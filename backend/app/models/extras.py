import enum
import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum, Float, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


# ---------- Legal Learning Mode ----------

class Quiz(Base):
    __tablename__ = "quizzes"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    category_slug: Mapped[str] = mapped_column(String(50))
    title_en: Mapped[str] = mapped_column(String(255))
    title_ne: Mapped[str] = mapped_column(String(255))
    questions: Mapped[list] = mapped_column(JSON)  # [{question_en, question_ne, options_en[], options_ne[], correct_index}]


class QuizAttempt(Base):
    __tablename__ = "quiz_attempts"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False)
    quiz_id: Mapped[str] = mapped_column(String(36), ForeignKey("quizzes.id"), nullable=False)
    score: Mapped[int] = mapped_column(Integer, default=0)
    total: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="quiz_attempts")


class Badge(Base):
    __tablename__ = "badges"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False)
    badge_code: Mapped[str] = mapped_column(String(50))  # e.g. 'first_quiz', 'cyber_law_expert'
    awarded_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


# ---------- Notifications (compliance reminders, system messages) ----------

class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False)
    title: Mapped[str] = mapped_column(String(255))
    body: Mapped[str] = mapped_column(Text)
    category: Mapped[str] = mapped_column(String(50), default="general")  # 'compliance' | 'payment' | 'system'
    is_read: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="notifications")


# ---------- Advertisement system ----------

class Advertisement(Base):
    __tablename__ = "advertisements"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    placement: Mapped[str] = mapped_column(String(50))  # 'chat_sidebar' | 'dashboard_banner' etc.
    adsense_slot_id: Mapped[str] = mapped_column(String(100), default="")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


# ---------- Office Locator ----------

class OfficeLocation(Base):
    __tablename__ = "office_locations"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    office_type: Mapped[str] = mapped_column(String(50))  # 'police' | 'court' | 'traffic' | 'government'
    name_en: Mapped[str] = mapped_column(String(255))
    name_ne: Mapped[str] = mapped_column(String(255))
    address: Mapped[str] = mapped_column(String(500))
    district: Mapped[str] = mapped_column(String(100))
    phone: Mapped[str] = mapped_column(String(50), default="")
    latitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    longitude: Mapped[float | None] = mapped_column(Float, nullable=True)


# ---------- Lawyer Marketplace ----------

class LawyerProfile(Base):
    __tablename__ = "lawyer_profiles"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=True)
    full_name: Mapped[str] = mapped_column(String(120))
    specialization: Mapped[str] = mapped_column(String(100))  # 'cyber_law', 'family_law', etc.
    bio_en: Mapped[str] = mapped_column(Text, default="")
    bio_ne: Mapped[str] = mapped_column(Text, default="")
    years_experience: Mapped[int] = mapped_column(Integer, default=0)
    consultation_fee_npr: Mapped[int] = mapped_column(Integer, default=0)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    photo_url: Mapped[str] = mapped_column(String(500), default="")


class ConsultationBooking(Base):
    __tablename__ = "consultation_bookings"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False)
    lawyer_id: Mapped[str] = mapped_column(String(36), ForeignKey("lawyer_profiles.id"), nullable=False)
    scheduled_at: Mapped[datetime] = mapped_column(DateTime)
    status: Mapped[str] = mapped_column(String(30), default="requested")  # requested|confirmed|completed|cancelled
    notes: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


# ---------- Business Compliance Assistant ----------

class ComplianceReminder(Base):
    __tablename__ = "compliance_reminders"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False)
    title: Mapped[str] = mapped_column(String(255))
    reminder_type: Mapped[str] = mapped_column(String(50))  # 'company_renewal'|'tax'|'license'
    due_date: Mapped[datetime] = mapped_column(DateTime)
    is_completed: Mapped[bool] = mapped_column(Boolean, default=False)


# ---------- Scam Detection log ----------

class ScamCheck(Base):
    __tablename__ = "scam_checks"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=True)
    submitted_text: Mapped[str] = mapped_column(Text)
    risk_level: Mapped[str] = mapped_column(String(20), default="unknown")  # low|medium|high
    explanation: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


# ---------- Real-time Voice Assistant usage tracking ----------

class VoiceUsage(Base):
    """
    One row per user per UTC calendar day, tracking cumulative voice seconds used.
    Enforces the free-plan daily cap (FREE_PLAN_DAILY_VOICE_SECONDS in config).
    Premium users are never blocked but their usage is still logged here.
    """
    __tablename__ = "voice_usage"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    usage_date: Mapped[str] = mapped_column(String(10), nullable=False)   # "YYYY-MM-DD" UTC
    seconds_used: Mapped[int] = mapped_column(Integer, default=0)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
