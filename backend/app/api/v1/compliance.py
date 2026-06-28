from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.db.session import get_db
from app.models.extras import ComplianceReminder
from app.models.user import User

router = APIRouter(prefix="/compliance", tags=["Business Compliance Assistant"])

CHECKLIST = [
    {"item_en": "Renew company registration annually", "item_ne": "वार्षिक रूपमा कम्पनी दर्ता नवीकरण गर्नुहोस्"},
    {"item_en": "File VAT/tax returns on schedule", "item_ne": "तोकिएको समयमा भ्याट/कर विवरण बुझाउनुहोस्"},
    {"item_en": "Maintain updated PAN/VAT registration", "item_ne": "PAN/VAT दर्ता अपडेट राख्नुहोस्"},
    {"item_en": "Keep audited financial statements current", "item_ne": "लेखा परीक्षण गरिएको वित्तीय विवरण अपडेट राख्नुहोस्"},
    {"item_en": "Renew industry-specific licenses on time", "item_ne": "उद्योग-विशेष लाइसेन्स समयमै नवीकरण गर्नुहोस्"},
]


class ReminderCreate(BaseModel):
    title: str
    reminder_type: str
    due_date: datetime


@router.get("/checklist")
def get_checklist():
    return CHECKLIST


@router.get("/reminders")
def list_reminders(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    stmt = select(ComplianceReminder).where(ComplianceReminder.user_id == current_user.id).order_by(ComplianceReminder.due_date)
    reminders = db.execute(stmt).scalars().all()
    return [
        {"id": r.id, "title": r.title, "reminder_type": r.reminder_type, "due_date": r.due_date, "is_completed": r.is_completed}
        for r in reminders
    ]


@router.post("/reminders", status_code=201)
def create_reminder(payload: ReminderCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    reminder = ComplianceReminder(
        user_id=current_user.id, title=payload.title, reminder_type=payload.reminder_type, due_date=payload.due_date,
    )
    db.add(reminder)
    db.commit()
    db.refresh(reminder)
    return {"id": reminder.id}


@router.patch("/reminders/{reminder_id}/complete")
def complete_reminder(reminder_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    reminder = db.get(ComplianceReminder, reminder_id)
    if not reminder or reminder.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Reminder not found.")
    reminder.is_completed = True
    db.add(reminder)
    db.commit()
    return {"status": "completed"}
