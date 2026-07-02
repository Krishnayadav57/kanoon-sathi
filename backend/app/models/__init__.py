"""
Import all models here so Alembic's autogenerate can discover them
via Base.metadata, and so `from app.models import User` works app-wide.
"""
from app.models.chat import ChatMessage, ChatSession
from app.models.complaint import Complaint, ComplaintType
from app.models.document import LegalDocument, DocumentStatus
from app.models.extras import (
    VoiceUsage,
    Advertisement,
    Badge,
    ComplianceReminder,
    ConsultationBooking,
    LawyerProfile,
    Notification,
    OfficeLocation,
    Quiz,
    QuizAttempt,
    ScamCheck,
)
from app.models.knowledge_base import LegalArticle, LegalCategory, LegalNewsUpdate
from app.models.payment import Payment, PaymentProvider, PaymentStatus
from app.models.user import AccessibilityMode, SubscriptionPlan, User, UserRole

__all__ = [
    "User",
    "UserRole",
    "SubscriptionPlan",
    "AccessibilityMode",
    "ChatSession",
    "ChatMessage",
    "LegalCategory",
    "LegalArticle",
    "LegalNewsUpdate",
    "Complaint",
    "ComplaintType",
    "LegalDocument",
    "DocumentStatus",
    "Payment",
    "PaymentProvider",
    "PaymentStatus",
    "Quiz",
    "QuizAttempt",
    "Badge",
    "Notification",
    "Advertisement",
    "OfficeLocation",
    "LawyerProfile",
    "ConsultationBooking",
    "ComplianceReminder",
    "ScamCheck",
    "VoiceUsage",
]
