"""
NEW MODULE (Phase 1): Structured Law Library + Gamification.

This is additive and does NOT modify app/models/knowledge_base.py (LegalCategory /
LegalArticle keep powering AI-chat grounding exactly as before). This module adds
the deeper, hierarchical structure requested for the Law Library / Learning Center:

    Law -> LawChapter -> LawSection (explanation, examples, related laws, notes)

Plus lightweight gamification tracking (XP, streaks, bookmarks, notes) so the
existing User model doesn't need its columns touched — everything lives in new
tables with a FK to users.id.

INTEGRATION STEPS (do these in your real repo — nothing here overwrites anything):
1. Copy this file to backend/app/models/law_library.py
2. Add to backend/app/models/__init__.py:
       from app.models.law_library import (
           Law, LawChapter, LawSection, LawBookmark, LawNote,
           UserLearningProfile, StudyStreakLog,
       )
   and append the class names to __all__.
3. Add the same import block to backend/alembic/env.py (next to the other
   `from app.models.xxx import ...` lines) so autogenerate picks it up.
4. Run: alembic revision --autogenerate -m "add law library + gamification"
        alembic upgrade head
"""
import enum
import uuid
from datetime import datetime

from sqlalchemy import (
    Boolean, DateTime, Enum, ForeignKey, Integer, JSON, String, Text, UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class LawStatus(str, enum.Enum):
    DRAFT = "draft"
    PUBLISHED = "published"
    SCHEDULED = "scheduled"
    ARCHIVED = "archived"


class Law(Base):
    """Top-level law/act, e.g. 'Muluki Criminal Code, 2074'."""

    __tablename__ = "laws"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    slug: Mapped[str] = mapped_column(String(120), unique=True, index=True, nullable=False)
    title_en: Mapped[str] = mapped_column(String(255), nullable=False)
    title_ne: Mapped[str] = mapped_column(String(255), nullable=False)
    category_slug: Mapped[str] = mapped_column(String(50), index=True)  # links to existing LegalCategory.slug
    short_description_en: Mapped[str] = mapped_column(Text, default="")
    short_description_ne: Mapped[str] = mapped_column(Text, default="")
    year_bs: Mapped[str | None] = mapped_column(String(10), nullable=True)
    source_reference: Mapped[str] = mapped_column(String(255), default="")
    cover_icon: Mapped[str] = mapped_column(String(50), default="scale")
    status: Mapped[LawStatus] = mapped_column(Enum(LawStatus), default=LawStatus.DRAFT)
    publish_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)  # scheduled publish
    version: Mapped[int] = mapped_column(Integer, default=1)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    chapters = relationship(
        "LawChapter", back_populates="law", cascade="all, delete-orphan", order_by="LawChapter.order_index"
    )


class LawChapter(Base):
    __tablename__ = "law_chapters"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    law_id: Mapped[str] = mapped_column(String(36), ForeignKey("laws.id"), nullable=False, index=True)
    order_index: Mapped[int] = mapped_column(Integer, default=0)
    title_en: Mapped[str] = mapped_column(String(255), nullable=False)
    title_ne: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[LawStatus] = mapped_column(Enum(LawStatus), default=LawStatus.DRAFT)

    law = relationship("Law", back_populates="chapters")
    sections = relationship(
        "LawSection", back_populates="chapter", cascade="all, delete-orphan", order_by="LawSection.order_index"
    )


class LawSection(Base):
    __tablename__ = "law_sections"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    chapter_id: Mapped[str] = mapped_column(String(36), ForeignKey("law_chapters.id"), nullable=False, index=True)
    order_index: Mapped[int] = mapped_column(Integer, default=0)
    section_number: Mapped[str] = mapped_column(String(50), default="")  # e.g. "Section 219"
    title_en: Mapped[str] = mapped_column(String(255), nullable=False)
    title_ne: Mapped[str] = mapped_column(String(255), nullable=False)
    text_en: Mapped[str] = mapped_column(Text, default="")
    text_ne: Mapped[str] = mapped_column(Text, default="")
    explanation_en: Mapped[str] = mapped_column(Text, default="")  # "explain in simple terms"
    explanation_ne: Mapped[str] = mapped_column(Text, default="")
    examples: Mapped[list] = mapped_column(JSON, default=list)          # [{en, ne}]
    related_law_section_ids: Mapped[list] = mapped_column(JSON, default=list)  # [law_section.id, ...]
    important_notes_en: Mapped[str] = mapped_column(Text, default="")
    important_notes_ne: Mapped[str] = mapped_column(Text, default="")
    audio_url_en: Mapped[str | None] = mapped_column(String(500), nullable=True)
    audio_url_ne: Mapped[str | None] = mapped_column(String(500), nullable=True)
    status: Mapped[LawStatus] = mapped_column(Enum(LawStatus), default=LawStatus.DRAFT)

    chapter = relationship("LawChapter", back_populates="sections")


# ---------------- Gamification / personal learning area ----------------

class UserLearningProfile(Base):
    """One row per user. Keeps XP/level/streak out of the core User table."""

    __tablename__ = "user_learning_profiles"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), unique=True, nullable=False)
    xp_total: Mapped[int] = mapped_column(Integer, default=0)
    level: Mapped[str] = mapped_column(String(30), default="Beginner")
    current_streak_days: Mapped[int] = mapped_column(Integer, default=0)
    longest_streak_days: Mapped[int] = mapped_column(Integer, default=0)
    last_activity_date: Mapped[str | None] = mapped_column(String(10), nullable=True)  # YYYY-MM-DD
    daily_goal_sections: Mapped[int] = mapped_column(Integer, default=3)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class StudyStreakLog(Base):
    """One row per user per day something was studied — used to compute streaks/history."""

    __tablename__ = "study_streak_logs"
    __table_args__ = (UniqueConstraint("user_id", "study_date", name="uq_user_study_date"),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    study_date: Mapped[str] = mapped_column(String(10), nullable=False)  # YYYY-MM-DD
    sections_completed: Mapped[int] = mapped_column(Integer, default=0)
    xp_earned: Mapped[int] = mapped_column(Integer, default=0)


class LawBookmark(Base):
    __tablename__ = "law_bookmarks"
    __table_args__ = (UniqueConstraint("user_id", "section_id", name="uq_user_section_bookmark"),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    section_id: Mapped[str] = mapped_column(String(36), ForeignKey("law_sections.id"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class LawNote(Base):
    __tablename__ = "law_notes"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    section_id: Mapped[str] = mapped_column(String(36), ForeignKey("law_sections.id"), nullable=False)
    content: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class UserSectionProgress(Base):
    """Marks a section as read/completed by a user — powers % completion + 'continue learning'."""

    __tablename__ = "user_section_progress"
    __table_args__ = (UniqueConstraint("user_id", "section_id", name="uq_user_section_progress"),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    section_id: Mapped[str] = mapped_column(String(36), ForeignKey("law_sections.id"), nullable=False)
    completed: Mapped[bool] = mapped_column(Boolean, default=False)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
