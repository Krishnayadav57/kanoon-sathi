from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.db.session import get_db
from app.models.chat import ChatSession
from app.models.complaint import Complaint
from app.models.document import LegalDocument
from app.models.payment import Payment
from app.models.user import SubscriptionPlan, User

router = APIRouter(prefix="/dashboard", tags=["User Dashboard"])


@router.get("/summary")
def dashboard_summary(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    chat_count = db.execute(
        select(func.count(ChatSession.id)).where(ChatSession.user_id == current_user.id)
    ).scalar_one()
    document_count = db.execute(
        select(func.count(LegalDocument.id)).where(LegalDocument.user_id == current_user.id)
    ).scalar_one()
    complaint_count = db.execute(
        select(func.count(Complaint.id)).where(Complaint.user_id == current_user.id)
    ).scalar_one()
    last_payment = db.execute(
        select(Payment).where(Payment.user_id == current_user.id).order_by(Payment.created_at.desc()).limit(1)
    ).scalar_one_or_none()

    is_premium_active = (
        current_user.subscription_plan == SubscriptionPlan.PREMIUM
        and (
            current_user.subscription_expires_at is None
            or current_user.subscription_expires_at > datetime.now(timezone.utc).replace(tzinfo=None)
        )
    )

    return {
        "user": {
            "full_name": current_user.full_name,
            "email": current_user.email,
            "subscription_plan": current_user.subscription_plan.value,
            "subscription_expires_at": current_user.subscription_expires_at,
            "is_premium_active": is_premium_active,
        },
        "stats": {
            "total_chats": chat_count,
            "total_documents": document_count,
            "total_complaints": complaint_count,
        },
        "last_payment": {
            "amount_npr": last_payment.amount_npr,
            "status": last_payment.status.value,
            "provider": last_payment.provider.value,
            "created_at": last_payment.created_at,
        } if last_payment else None,
    }
