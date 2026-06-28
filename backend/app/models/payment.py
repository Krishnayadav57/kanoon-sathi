import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class PaymentProvider(str, enum.Enum):
    ESEWA = "esewa"
    KHALTI = "khalti"
    STRIPE = "stripe"
    FONEPAY = "fonepay"  # reserved for future use, not yet implemented


class PaymentStatus(str, enum.Enum):
    PENDING = "pending"               # created, awaiting user action
    AWAITING_REVIEW = "awaiting_review"  # manual eSewa/Khalti: user submitted proof, admin must verify
    SUCCESS = "success"
    FAILED = "failed"
    REJECTED = "rejected"             # admin reviewed manual submission and rejected it
    CANCELLED = "cancelled"
    REFUNDED = "refunded"


class Payment(Base):
    """
    Full payment record. `transaction_id` MUST be unique to prevent
    duplicate processing (enforced at DB + service layer, see payments service).
    """

    __tablename__ = "payments"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False)

    provider: Mapped[PaymentProvider] = mapped_column(Enum(PaymentProvider), nullable=False)
    transaction_id: Mapped[str] = mapped_column(String(120), unique=True, nullable=False, index=True)
    provider_reference_id: Mapped[str | None] = mapped_column(String(120), nullable=True)  # provider's own ref/token

    amount_npr: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[PaymentStatus] = mapped_column(Enum(PaymentStatus), default=PaymentStatus.PENDING)

    plan_purchased: Mapped[str] = mapped_column(String(50), default="premium_monthly")
    subscription_expiry_date: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    raw_callback_payload: Mapped[str | None] = mapped_column(String(4000), nullable=True)  # JSON string, audit trail

    # --- Manual verification flow (eSewa/Khalti without merchant API access) ---
    user_submitted_reference: Mapped[str | None] = mapped_column(String(120), nullable=True)  # txn ID user typed in
    screenshot_path: Mapped[str | None] = mapped_column(String(500), nullable=True)
    admin_notes: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    reviewed_by_admin_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="payments")
