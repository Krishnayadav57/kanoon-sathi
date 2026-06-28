from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.extras import OfficeLocation

router = APIRouter(prefix="/offices", tags=["Office Locator"])


@router.get("/")
def list_offices(
    office_type: str | None = Query(default=None),
    district: str | None = Query(default=None),
    db: Session = Depends(get_db),
):
    stmt = select(OfficeLocation)
    if office_type:
        stmt = stmt.where(OfficeLocation.office_type == office_type)
    if district:
        stmt = stmt.where(OfficeLocation.district == district)
    offices = db.execute(stmt).scalars().all()
    return [
        {
            "id": o.id, "office_type": o.office_type, "name_en": o.name_en, "name_ne": o.name_ne,
            "address": o.address, "district": o.district, "phone": o.phone,
            "latitude": o.latitude, "longitude": o.longitude,
        }
        for o in offices
    ]
