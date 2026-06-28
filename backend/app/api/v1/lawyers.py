from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.db.session import get_db
from app.models.extras import ConsultationBooking, LawyerProfile
from app.models.user import User

router = APIRouter(prefix="/lawyers", tags=["Lawyer Marketplace"])


class BookingRequest(BaseModel):
    lawyer_id: str
    scheduled_at: datetime
    notes: str = ""


@router.get("/")
def list_lawyers(specialization: str | None = Query(default=None), db: Session = Depends(get_db)):
    stmt = select(LawyerProfile).where(LawyerProfile.is_verified == True)  # noqa: E712
    if specialization:
        stmt = stmt.where(LawyerProfile.specialization == specialization)
    lawyers = db.execute(stmt).scalars().all()
    return [
        {
            "id": l.id, "full_name": l.full_name, "specialization": l.specialization,
            "bio_en": l.bio_en, "bio_ne": l.bio_ne, "years_experience": l.years_experience,
            "consultation_fee_npr": l.consultation_fee_npr, "photo_url": l.photo_url,
        }
        for l in lawyers
    ]


@router.post("/bookings", status_code=201)
def book_consultation(payload: BookingRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    lawyer = db.get(LawyerProfile, payload.lawyer_id)
    if not lawyer:
        raise HTTPException(status_code=404, detail="Lawyer not found.")
    booking = ConsultationBooking(
        user_id=current_user.id,
        lawyer_id=payload.lawyer_id,
        scheduled_at=payload.scheduled_at,
        notes=payload.notes,
        status="requested",
    )
    db.add(booking)
    db.commit()
    db.refresh(booking)
    return {"id": booking.id, "status": booking.status, "scheduled_at": booking.scheduled_at}


@router.get("/bookings/my")
def my_bookings(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    stmt = select(ConsultationBooking).where(ConsultationBooking.user_id == current_user.id)
    bookings = db.execute(stmt).scalars().all()
    return [
        {"id": b.id, "lawyer_id": b.lawyer_id, "scheduled_at": b.scheduled_at, "status": b.status}
        for b in bookings
    ]
