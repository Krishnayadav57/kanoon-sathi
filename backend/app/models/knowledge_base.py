import uuid
from datetime import datetime

from sqlalchemy import DateTime, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base


class LegalCategory(Base):
    """Top-level legal categories e.g. Traffic, Cyber, Labor, etc."""

    __tablename__ = "legal_categories"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    slug: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    name_en: Mapped[str] = mapped_column(String(100), nullable=False)
    name_ne: Mapped[str] = mapped_column(String(100), nullable=False)
    icon: Mapped[str] = mapped_column(String(50), default="scale")
    description_en: Mapped[str] = mapped_column(Text, default="")
    description_ne: Mapped[str] = mapped_column(Text, default="")


class LegalArticle(Base):
    """
    A single knowledge-base entry: a law, act section, or explainer.
    This is the grounding context fed to the AI — keep citations accurate.
    """

    __tablename__ = "legal_articles"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    category_slug: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    title_en: Mapped[str] = mapped_column(String(255), nullable=False)
    title_ne: Mapped[str] = mapped_column(String(255), nullable=False)
    summary_en: Mapped[str] = mapped_column(Text, default="")
    summary_ne: Mapped[str] = mapped_column(Text, default="")
    full_text_en: Mapped[str] = mapped_column(Text, default="")
    full_text_ne: Mapped[str] = mapped_column(Text, default="")
    source_reference: Mapped[str] = mapped_column(String(255), default="")  # e.g. "Motor Vehicle and Transport Management Act 2049, Sec 151"
    last_verified_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class LegalNewsUpdate(Base):
    __tablename__ = "legal_news_updates"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title_en: Mapped[str] = mapped_column(String(255), nullable=False)
    title_ne: Mapped[str] = mapped_column(String(255), nullable=False)
    summary_en: Mapped[str] = mapped_column(Text, default="")
    summary_ne: Mapped[str] = mapped_column(Text, default="")
    source_url: Mapped[str] = mapped_column(String(500), default="")
    published_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
