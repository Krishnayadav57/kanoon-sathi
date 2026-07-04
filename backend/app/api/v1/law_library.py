"""
NEW ROUTER (Phase 1): /law-library

Public endpoints browse published Law -> Chapter -> Section content.
Authenticated endpoints track reading progress, award XP, maintain daily
streaks, and manage bookmarks/notes.
Admin endpoints (reuse existing get_current_admin dependency) provide a
minimal CMS: create/edit law/chapter/section, publish/draft/schedule.

INTEGRATION STEPS:
1. Copy to backend/app/api/v1/law_library.py
2. In backend/app/api/v1/__init__.py add:
       from app.api.v1 import law_library
   and:
       api_router.include_router(law_library.router)
3. Copy app/models/law_library.py and app/schemas/law_library.py (see those files).
4. Run alembic migration (see models file header).
"""
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.deps import get_current_admin, get_current_user
from app.db.session import get_db
from app.models.law_library import (
    Law, LawBookmark, LawChapter, LawNote, LawSection, LawStatus,
    StudyStreakLog, UserLearningProfile, UserSectionProgress,
)
from app.models.user import User
from app.schemas.law_library import (
    LawChapterCreate, LawCreate, LawDetail, LawListItem, LawSectionCreate,
    LearningProfileOut, NoteCreate, PublishStatusUpdate,
)

router = APIRouter(prefix="/law-library", tags=["Law Library"])

XP_PER_SECTION = 10
LEVEL_THRESHOLDS = [
    (0, "Beginner"),
    (200, "Learner"),
    (600, "Intermediate"),
    (1500, "Advanced"),
    (3500, "Legal Expert"),
]


def _level_for_xp(xp: int) -> str:
    level = LEVEL_THRESHOLDS[0][1]
    for threshold, name in LEVEL_THRESHOLDS:
        if xp >= threshold:
            level = name
    return level


def _today() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%d")


def _get_or_create_profile(db: Session, user_id: str) -> UserLearningProfile:
    profile = db.execute(
        select(UserLearningProfile).where(UserLearningProfile.user_id == user_id)
    ).scalar_one_or_none()
    if profile is None:
        profile = UserLearningProfile(user_id=user_id)
        db.add(profile)
        db.commit()
        db.refresh(profile)
    return profile


# ---------------- Public browse ----------------

@router.get("/laws", response_model=list[LawListItem])
def list_laws(category: str | None = Query(default=None), db: Session = Depends(get_db)):
    stmt = select(Law).where(Law.status == LawStatus.PUBLISHED)
    if category:
        stmt = stmt.where(Law.category_slug == category)
    return db.execute(stmt).scalars().all()


@router.get("/laws/{law_id}", response_model=LawDetail)
def get_law(law_id: str, db: Session = Depends(get_db)):
    law = db.get(Law, law_id)
    if not law or law.status != LawStatus.PUBLISHED:
        raise HTTPException(status_code=404, detail="Law not found.")
    return law


@router.get("/sections/{section_id}")
def get_section(section_id: str, db: Session = Depends(get_db)):
    section = db.get(LawSection, section_id)
    if not section or section.status != LawStatus.PUBLISHED:
        raise HTTPException(status_code=404, detail="Section not found.")
    return section


# ---------------- Authenticated: progress, XP, streaks ----------------

@router.post("/sections/{section_id}/complete")
def complete_section(section_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    section = db.get(LawSection, section_id)
    if not section:
        raise HTTPException(status_code=404, detail="Section not found.")

    progress = db.execute(
        select(UserSectionProgress).where(
            UserSectionProgress.user_id == current_user.id,
            UserSectionProgress.section_id == section_id,
        )
    ).scalar_one_or_none()

    already_done = bool(progress and progress.completed)
    if not progress:
        progress = UserSectionProgress(user_id=current_user.id, section_id=section_id)
        db.add(progress)
    progress.completed = True
    progress.completed_at = datetime.utcnow()
    db.commit()

    profile = _get_or_create_profile(db, current_user.id)
    today = _today()

    if not already_done:
        profile.xp_total += XP_PER_SECTION
        profile.level = _level_for_xp(profile.xp_total)

        yesterday = (datetime.now(timezone.utc) - timedelta(days=1)).strftime("%Y-%m-%d")
        if profile.last_activity_date == today:
            pass  # already studied today, streak unchanged
        elif profile.last_activity_date == yesterday:
            profile.current_streak_days += 1
        else:
            profile.current_streak_days = 1
        profile.longest_streak_days = max(profile.longest_streak_days, profile.current_streak_days)
        profile.last_activity_date = today

        log = db.execute(
            select(StudyStreakLog).where(StudyStreakLog.user_id == current_user.id, StudyStreakLog.study_date == today)
        ).scalar_one_or_none()
        if log is None:
            log = StudyStreakLog(user_id=current_user.id, study_date=today, sections_completed=0, xp_earned=0)
            db.add(log)
        log.sections_completed += 1
        log.xp_earned += XP_PER_SECTION

        db.add(profile)
        db.commit()

    return {"completed": True, "xp_total": profile.xp_total, "level": profile.level, "streak": profile.current_streak_days}


@router.get("/me/profile", response_model=LearningProfileOut)
def my_learning_profile(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = _get_or_create_profile(db, current_user.id)
    today_log = db.execute(
        select(StudyStreakLog).where(StudyStreakLog.user_id == current_user.id, StudyStreakLog.study_date == _today())
    ).scalar_one_or_none()
    return LearningProfileOut(
        xp_total=profile.xp_total,
        level=profile.level,
        current_streak_days=profile.current_streak_days,
        longest_streak_days=profile.longest_streak_days,
        daily_goal_sections=profile.daily_goal_sections,
        sections_completed_today=today_log.sections_completed if today_log else 0,
    )


@router.post("/bookmarks/{section_id}")
def toggle_bookmark(section_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    existing = db.execute(
        select(LawBookmark).where(LawBookmark.user_id == current_user.id, LawBookmark.section_id == section_id)
    ).scalar_one_or_none()
    if existing:
        db.delete(existing)
        db.commit()
        return {"bookmarked": False}
    db.add(LawBookmark(user_id=current_user.id, section_id=section_id))
    db.commit()
    return {"bookmarked": True}


@router.get("/me/bookmarks")
def my_bookmarks(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    stmt = select(LawBookmark).where(LawBookmark.user_id == current_user.id)
    return [{"section_id": b.section_id, "created_at": b.created_at} for b in db.execute(stmt).scalars().all()]


@router.post("/notes")
def add_note(payload: NoteCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    note = LawNote(user_id=current_user.id, section_id=payload.section_id, content=payload.content)
    db.add(note)
    db.commit()
    db.refresh(note)
    return {"id": note.id}


@router.get("/me/notes")
def my_notes(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    stmt = select(LawNote).where(LawNote.user_id == current_user.id).order_by(LawNote.updated_at.desc())
    notes = db.execute(stmt).scalars().all()
    return [{"id": n.id, "section_id": n.section_id, "content": n.content, "updated_at": n.updated_at} for n in notes]


# ---------------- Admin CMS ----------------

@router.post("/admin/laws", status_code=201)
def admin_create_law(payload: LawCreate, _admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    law = Law(**payload.model_dump())
    db.add(law)
    db.commit()
    db.refresh(law)
    return {"id": law.id}


@router.post("/admin/chapters", status_code=201)
def admin_create_chapter(payload: LawChapterCreate, _admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    if not db.get(Law, payload.law_id):
        raise HTTPException(status_code=404, detail="Law not found.")
    chapter = LawChapter(**payload.model_dump())
    db.add(chapter)
    db.commit()
    db.refresh(chapter)
    return {"id": chapter.id}


@router.post("/admin/sections", status_code=201)
def admin_create_section(payload: LawSectionCreate, _admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    if not db.get(LawChapter, payload.chapter_id):
        raise HTTPException(status_code=404, detail="Chapter not found.")
    section = LawSection(**payload.model_dump())
    db.add(section)
    db.commit()
    db.refresh(section)
    return {"id": section.id}


@router.patch("/admin/laws/{law_id}/status")
def admin_set_law_status(law_id: str, payload: PublishStatusUpdate, _admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    law = db.get(Law, law_id)
    if not law:
        raise HTTPException(status_code=404, detail="Law not found.")
    law.status = LawStatus(payload.status)
    law.publish_at = payload.publish_at
    law.version += 1
    db.add(law)
    db.commit()
    return {"id": law.id, "status": law.status.value, "version": law.version}


@router.get("/admin/laws", response_model=list[LawListItem])
def admin_list_all_laws(_admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    """Same as public list but includes drafts/scheduled/archived — for the CMS table view."""
    return db.execute(select(Law)).scalars().all()
