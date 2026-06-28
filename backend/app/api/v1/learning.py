from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.db.session import get_db
from app.models.extras import Badge, Quiz, QuizAttempt
from app.models.user import User

router = APIRouter(prefix="/learning", tags=["Legal Learning Mode"])


@router.get("/quizzes")
def list_quizzes(db: Session = Depends(get_db)):
    quizzes = db.execute(select(Quiz)).scalars().all()
    return [
        {"id": q.id, "category_slug": q.category_slug, "title_en": q.title_en, "title_ne": q.title_ne,
         "question_count": len(q.questions)}
        for q in quizzes
    ]


@router.get("/quizzes/{quiz_id}")
def get_quiz(quiz_id: str, db: Session = Depends(get_db)):
    quiz = db.get(Quiz, quiz_id)
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found.")
    # Strip correct_index before sending to client
    sanitized_questions = [
        {k: v for k, v in q.items() if k != "correct_index"} for q in quiz.questions
    ]
    return {"id": quiz.id, "title_en": quiz.title_en, "title_ne": quiz.title_ne, "questions": sanitized_questions}


@router.post("/quizzes/{quiz_id}/submit")
def submit_quiz(quiz_id: str, answers: list[int], current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    quiz = db.get(Quiz, quiz_id)
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found.")

    correct = sum(
        1 for i, q in enumerate(quiz.questions)
        if i < len(answers) and answers[i] == q.get("correct_index")
    )
    attempt = QuizAttempt(user_id=current_user.id, quiz_id=quiz.id, score=correct, total=len(quiz.questions))
    db.add(attempt)
    db.commit()

    awarded_badge = None
    prior_attempts = db.execute(
        select(QuizAttempt).where(QuizAttempt.user_id == current_user.id)
    ).scalars().all()
    if len(prior_attempts) == 1:
        badge = Badge(user_id=current_user.id, badge_code="first_quiz")
        db.add(badge)
        db.commit()
        awarded_badge = "first_quiz"

    return {"score": correct, "total": len(quiz.questions), "badge_awarded": awarded_badge}


@router.get("/badges")
def my_badges(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    badges = db.execute(select(Badge).where(Badge.user_id == current_user.id)).scalars().all()
    return [{"badge_code": b.badge_code, "awarded_at": b.awarded_at} for b in badges]
