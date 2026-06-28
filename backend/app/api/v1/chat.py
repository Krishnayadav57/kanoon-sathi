from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.deps import get_current_user
from app.db.session import get_db
from app.models.chat import ChatMessage, ChatSession
from app.models.user import SubscriptionPlan, User
from app.schemas.chat import (
    ChatSessionDetailOut,
    ChatSessionOut,
    SendMessageRequest,
    SendMessageResponse,
)
from app.services import ai_service
from app.services.knowledge_base import build_context_snippets, guess_category, retrieve_relevant_articles

router = APIRouter(prefix="/chat", tags=["AI Legal Chat"])


def _messages_used_today(db: Session, user_id: str) -> int:
    start_of_day = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    stmt = (
        select(func.count(ChatMessage.id))
        .join(ChatSession, ChatMessage.session_id == ChatSession.id)
        .where(
            ChatSession.user_id == user_id,
            ChatMessage.role == "user",
            ChatMessage.created_at >= start_of_day,
        )
    )
    return db.execute(stmt).scalar_one()


def _is_premium_active(user: User) -> bool:
    if user.subscription_plan != SubscriptionPlan.PREMIUM:
        return False
    if user.subscription_expires_at and user.subscription_expires_at < datetime.now(timezone.utc).replace(tzinfo=None):
        return False
    return True


@router.get("/sessions", response_model=list[ChatSessionOut])
def list_sessions(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    stmt = select(ChatSession).where(ChatSession.user_id == current_user.id).order_by(ChatSession.updated_at.desc())
    return db.execute(stmt).scalars().all()


@router.get("/sessions/{session_id}", response_model=ChatSessionDetailOut)
def get_session(session_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    session = db.get(ChatSession, session_id)
    if not session or session.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Chat session not found.")
    return session


@router.delete("/sessions/{session_id}", status_code=204)
def delete_session(session_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    session = db.get(ChatSession, session_id)
    if not session or session.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Chat session not found.")
    db.delete(session)
    db.commit()
    return None


@router.post("/send", response_model=SendMessageResponse)
async def send_message(
    payload: SendMessageRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    is_premium = _is_premium_active(current_user)

    if not is_premium:
        used = _messages_used_today(db, current_user.id)
        if used >= settings.FREE_PLAN_DAILY_MESSAGES:
            raise HTTPException(
                status_code=429,
                detail=(
                    f"You've reached today's free limit of {settings.FREE_PLAN_DAILY_MESSAGES} messages. "
                    "Upgrade to Premium for unlimited AI chat."
                ),
            )

    # Get or create session
    if payload.session_id:
        session = db.get(ChatSession, payload.session_id)
        if not session or session.user_id != current_user.id:
            raise HTTPException(status_code=404, detail="Chat session not found.")
    else:
        category_slug, _ = guess_category(payload.message)
        session = ChatSession(
            user_id=current_user.id,
            title=payload.message[:60],
            legal_category=category_slug,
        )
        db.add(session)
        db.commit()
        db.refresh(session)

    # Save user message
    user_msg = ChatMessage(session_id=session.id, role="user", content=payload.message, language=payload.language)
    db.add(user_msg)
    db.commit()
    db.refresh(user_msg)

    # Build grounding context from knowledge base
    articles = retrieve_relevant_articles(db, payload.message)
    context_snippets = build_context_snippets(articles, language=payload.language)

    # Build short conversation history for continuity
    history_stmt = (
        select(ChatMessage)
        .where(ChatMessage.session_id == session.id)
        .order_by(ChatMessage.created_at.asc())
    )
    history = [
        {"role": m.role, "content": m.content}
        for m in db.execute(history_stmt).scalars().all()
        if m.id != user_msg.id
    ]

    try:
        ai_text = await ai_service.generate_legal_response(
            user_message=payload.message,
            language=payload.language,
            context_snippets=context_snippets,
            conversation_history=history,
        )
    except ai_service.AIServiceError as e:
        ai_text = (
            "माफ गर्नुहोस्, अहिले AI सेवामा समस्या भएको छ। कृपया केहि बेरपछि फेरि प्रयास गर्नुहोस्।"
            if payload.language == "ne"
            else "Sorry, the AI service is having trouble right now. Please try again shortly."
        )
        # Surface the real reason in logs/response for the admin/dev, not swallowed silently
        ai_text += f"\n\n[debug: {e}]" if settings.DEBUG else ""

    assistant_msg = ChatMessage(session_id=session.id, role="assistant", content=ai_text, language=payload.language)
    db.add(assistant_msg)
    session.updated_at = datetime.utcnow()
    if not session.legal_category:
        session.legal_category, _ = guess_category(payload.message)
    db.add(session)
    db.commit()
    db.refresh(assistant_msg)

    remaining = None
    if not is_premium:
        used_now = _messages_used_today(db, current_user.id)
        remaining = max(0, settings.FREE_PLAN_DAILY_MESSAGES - used_now)

    return SendMessageResponse(
        session_id=session.id,
        user_message=user_msg,
        assistant_message=assistant_msg,
        legal_category=session.legal_category,
        disclaimer=ai_service.disclaimer_for(payload.language),
        messages_remaining_today=remaining,
    )
