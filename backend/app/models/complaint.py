import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class ComplaintType(str, enum.Enum):
    POLICE = "police"
    CYBER_BUREAU = "cyber_bureau"
    MUNICIPALITY = "municipality"
    CONSUMER = "consumer"
    OFFICE_GRIEVANCE = "office_grievance"


class Complaint(Base):
    __tablename__ = "complaints"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False)
    complaint_type: Mapped[ComplaintType] = mapped_column(Enum(ComplaintType), nullable=False)
    form_data: Mapped[dict] = mapped_column(JSON, default=dict)  # raw answers used to fill template
    generated_text: Mapped[str] = mapped_column(Text)
    language: Mapped[str] = mapped_column(String(5), default="ne")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="complaints")
