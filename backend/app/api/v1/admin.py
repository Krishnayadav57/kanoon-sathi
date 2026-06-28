from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.deps import get_current_admin
from app.db.session import get_db
from app.models.extras import Advertisement
from app.models.payment import Payment, PaymentStatus
from app.models.user import SubscriptionPlan, User, UserRole

router = APIRouter(prefix="/admin", tags=["Admin Dashboard"])


@router.get("/users")
def list_users(
    skip: int = 0,
    limit: int = 50,
    _admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    stmt = select(User).order_by(User.created_at.desc()).offset(skip).limit(limit)
    users = db.execute(stmt).scalars().all()
    return [
        {
            "id": u.id, "full_name": u.full_name, "email": u.email, "role": u.role.value,
            "subscription_plan": u.subscription_plan.value, "is_active": u.is_active,
            "created_at": u.created_at,
        }
        for u in users
    ]


@router.patch("/users/{user_id}/toggle-active")
def toggle_user_active(user_id: str, _admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    user.is_active = not user.is_active
    db.add(user)
    db.commit()
    return {"id": user.id, "is_active": user.is_active}


@router.get("/revenue/summary")
def revenue_summary(_admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    total_revenue = db.execute(
        select(func.coalesce(func.sum(Payment.amount_npr), 0)).where(Payment.status == PaymentStatus.SUCCESS)
    ).scalar_one()

    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    revenue_30d = db.execute(
        select(func.coalesce(func.sum(Payment.amount_npr), 0)).where(
            Payment.status == PaymentStatus.SUCCESS, Payment.created_at >= thirty_days_ago
        )
    ).scalar_one()

    total_premium_users = db.execute(
        select(func.count(User.id)).where(User.subscription_plan == SubscriptionPlan.PREMIUM)
    ).scalar_one()

    total_users = db.execute(select(func.count(User.id))).scalar_one()

    by_provider = db.execute(
        select(Payment.provider, func.coalesce(func.sum(Payment.amount_npr), 0))
        .where(Payment.status == PaymentStatus.SUCCESS)
        .group_by(Payment.provider)
    ).all()

    return {
        "total_revenue_npr": total_revenue,
        "revenue_last_30_days_npr": revenue_30d,
        "total_users": total_users,
        "total_premium_users": total_premium_users,
        "revenue_by_provider": {p.value: amt for p, amt in by_provider},
    }


@router.get("/payments")
def list_payments(
    status_filter: str | None = Query(default=None, alias="status"),
    _admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    stmt = select(Payment).order_by(Payment.created_at.desc())
    if status_filter:
        stmt = stmt.where(Payment.status == status_filter)
    payments = db.execute(stmt).scalars().all()
    return [
        {
            "id": p.id, "user_id": p.user_id, "provider": p.provider.value, "transaction_id": p.transaction_id,
            "amount_npr": p.amount_npr, "status": p.status.value, "created_at": p.created_at,
        }
        for p in payments
    ]


@router.get("/ads")
def list_ads(_admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    ads = db.execute(select(Advertisement)).scalars().all()
    return [
        {"id": a.id, "placement": a.placement, "adsense_slot_id": a.adsense_slot_id, "is_active": a.is_active}
        for a in ads
    ]


@router.patch("/ads/{ad_id}/toggle")
def toggle_ad(ad_id: str, _admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    ad = db.get(Advertisement, ad_id)
    if not ad:
        raise HTTPException(status_code=404, detail="Ad not found.")
    ad.is_active = not ad.is_active
    db.add(ad)
    db.commit()
    return {"id": ad.id, "is_active": ad.is_active}
