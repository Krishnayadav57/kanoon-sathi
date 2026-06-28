from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.db.session import get_db
from app.models.complaint import Complaint, ComplaintType
from app.models.user import User
from app.schemas.legal import ComplaintGenerateRequest, ComplaintOut
from app.services.complaint_templates import generate_complaint_text

router = APIRouter(prefix="/complaints", tags=["Complaint Generator"])


@router.post("/generate", response_model=ComplaintOut, status_code=201)
def generate_complaint(
    payload: ComplaintGenerateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        text = generate_complaint_text(
            complaint_type=payload.complaint_type,
            language=payload.language,
            full_name=payload.full_name,
            address=payload.address,
            contact_number=payload.contact_number,
            incident_date=payload.incident_date,
            incident_location=payload.incident_location,
            incident_description=payload.incident_description,
            respondent_name=payload.respondent_name,
            additional_details=payload.additional_details,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    complaint = Complaint(
        user_id=current_user.id,
        complaint_type=ComplaintType(payload.complaint_type),
        form_data=payload.model_dump(),
        generated_text=text,
        language=payload.language,
    )
    db.add(complaint)
    db.commit()
    db.refresh(complaint)
    return complaint


@router.get("/", response_model=list[ComplaintOut])
def list_my_complaints(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    stmt = select(Complaint).where(Complaint.user_id == current_user.id).order_by(Complaint.created_at.desc())
    return db.execute(stmt).scalars().all()


@router.get("/{complaint_id}", response_model=ComplaintOut)
def get_complaint(complaint_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    complaint = db.get(Complaint, complaint_id)
    if not complaint or complaint.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Complaint not found.")
    return complaint
