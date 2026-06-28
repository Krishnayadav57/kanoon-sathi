import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class DocumentStatus(str, enum.Enum):
    UPLOADED = "uploaded"
    PROCESSING = "processing"
    EXPLAINED = "explained"
    FAILED = "failed"


class LegalDocument(Base):
    """
    Uploaded document for the Legal Document Explainer.
    NOTE (scaffold): file_path stores the uploaded file; `explanation` is filled
    by a background OCR+AI pipeline. OCR extraction itself is stubbed —
    wire in a real OCR engine (e.g. Tesseract) before production use.
    """

    __tablename__ = "legal_documents"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False)
    original_filename: Mapped[str] = mapped_column(String(255))
    file_path: Mapped[str] = mapped_column(String(500))
    mime_type: Mapped[str] = mapped_column(String(100))
    status: Mapped[DocumentStatus] = mapped_column(Enum(DocumentStatus), default=DocumentStatus.UPLOADED)
    extracted_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    explanation_ne: Mapped[str | None] = mapped_column(Text, nullable=True)
    explanation_en: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="documents")
