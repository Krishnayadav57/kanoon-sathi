"""
Three payment paths supported:

1. STRIPE — hosted Checkout session. User redirected to Stripe, card details
   never touch our server. Webhook confirms payment server-to-server.
2. ESEWA / KHALTI (manual mode) — since we don't have merchant API access,
   the user pays directly to your eSewa/Khalti number (shown as QR + number),
   then submits the transaction reference + a screenshot here. Status becomes
   AWAITING_REVIEW until an admin approves/rejects it via /admin endpoints.
3. ESEWA / KHALTI (api mode) — kept from the original scaffold for when/if
   you get real merchant API credentials (see payment_service.py).
"""
import os
import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.deps import get_current_admin, get_current_user
from app.db.session import get_db
from app.models.payment import Payment, PaymentProvider, PaymentStatus
from app.models.user import User
from app.services import payment_service, stripe_service

router = APIRouter(prefix="/payments", tags=["Payments"])

UPLOAD_SUBDIR = "payment_proofs"


@router.get("/manual-instructions")
def manual_payment_instructions():
    """Returns the receiver details to show on the payment page (QR/number to pay to)."""
    return {
        "esewa": {
            "number": settings.ESEWA_RECEIVER_NUMBER,
            "name": settings.ESEWA_RECEIVER_NAME,
            "amount_npr": settings.PREMIUM_MONTHLY_PRICE_NPR,
        },
        "khalti": {
            "number": settings.KHALTI_RECEIVER_NUMBER,
            "name": settings.KHALTI_RECEIVER_NAME,
            "amount_npr": settings.PREMIUM_MONTHLY_PRICE_NPR,
        },
    }


# ---------------- Manual eSewa / Khalti flow ----------------

@router.post("/manual/submit")
async def submit_manual_payment(
    provider: str = Form(...),  # "esewa" | "khalti"
    transaction_reference: str = Form(...),
    screenshot: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if provider not in ("esewa", "khalti"):
        raise HTTPException(status_code=400, detail="Provider must be 'esewa' or 'khalti'.")
    if not transaction_reference.strip():
        raise HTTPException(status_code=400, detail="Please enter the transaction reference/ID from your payment.")

    if screenshot.content_type not in ("image/png", "image/jpeg", "image/jpg", "image/webp"):
        raise HTTPException(status_code=400, detail="Screenshot must be a PNG, JPEG, or WEBP image.")

    contents = await screenshot.read()
    if len(contents) / (1024 * 1024) > settings.MAX_UPLOAD_MB:
        raise HTTPException(status_code=400, detail=f"Screenshot exceeds {settings.MAX_UPLOAD_MB}MB limit.")

    upload_dir = os.path.join(settings.UPLOAD_DIR, UPLOAD_SUBDIR)
    os.makedirs(upload_dir, exist_ok=True)
    safe_name = f"{uuid.uuid4()}_{screenshot.filename}"
    file_path = os.path.join(upload_dir, safe_name)
    with open(file_path, "wb") as f:
        f.write(contents)

    # Prevent the same reference number being submitted twice (duplicate-processing guard)
    existing = db.execute(
        select(Payment).where(Payment.user_submitted_reference == transaction_reference.strip())
    ).scalar_one_or_none()
    if existing:
        raise HTTPException(
            status_code=409,
            detail="This transaction reference has already been submitted. If this is a mistake, contact support.",
        )

    payment = Payment(
        user_id=current_user.id,
        provider=PaymentProvider(provider),
        transaction_id=str(uuid.uuid4()),
        amount_npr=settings.PREMIUM_MONTHLY_PRICE_NPR,
        status=PaymentStatus.AWAITING_REVIEW,
        plan_purchased="premium_monthly",
        user_submitted_reference=transaction_reference.strip(),
        screenshot_path=file_path,
    )
    db.add(payment)
    db.commit()
    db.refresh(payment)

    return {
        "id": payment.id,
        "status": payment.status.value,
        "message": "Your payment proof has been submitted and is awaiting verification. This is usually reviewed within 24 hours.",
    }


@router.get("/manual/my-submissions")
def my_manual_submissions(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    stmt = (
        select(Payment)
        .where(Payment.user_id == current_user.id, Payment.provider.in_([PaymentProvider.ESEWA, PaymentProvider.KHALTI]))
        .order_by(Payment.created_at.desc())
    )
    payments = db.execute(stmt).scalars().all()
    return [
        {
            "id": p.id, "provider": p.provider.value, "status": p.status.value,
            "user_submitted_reference": p.user_submitted_reference, "admin_notes": p.admin_notes,
            "created_at": p.created_at,
        }
        for p in payments
    ]


# ---------------- Admin review of manual submissions ----------------

@router.get("/admin/pending-review")
def list_pending_review(_admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    stmt = select(Payment).where(Payment.status == PaymentStatus.AWAITING_REVIEW).order_by(Payment.created_at.asc())
    payments = db.execute(stmt).scalars().all()
    return [
        {
            "id": p.id, "user_id": p.user_id, "provider": p.provider.value,
            "amount_npr": p.amount_npr, "user_submitted_reference": p.user_submitted_reference,
            "screenshot_path": p.screenshot_path, "created_at": p.created_at,
        }
        for p in payments
    ]


@router.post("/admin/{payment_id}/approve")
def approve_manual_payment(
    payment_id: str,
    notes: str = Form(default=""),
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    payment = db.get(Payment, payment_id)
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found.")
    if payment.status == PaymentStatus.SUCCESS:
        return {"status": "already_approved"}

    payment.admin_notes = notes
    payment.reviewed_by_admin_id = admin.id
    payment.reviewed_at = datetime.utcnow()
    payment_service.settle_successful_payment(db, payment)
    return {"status": "success", "subscription_expiry_date": payment.subscription_expiry_date}


@router.post("/admin/{payment_id}/reject")
def reject_manual_payment(
    payment_id: str,
    notes: str = Form(...),
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    payment = db.get(Payment, payment_id)
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found.")

    payment.status = PaymentStatus.REJECTED
    payment.admin_notes = notes
    payment.reviewed_by_admin_id = admin.id
    payment.reviewed_at = datetime.utcnow()
    db.add(payment)
    db.commit()
    return {"status": "rejected"}


# ---------------- Stripe ----------------

@router.post("/stripe/create-checkout-session")
def create_stripe_checkout(request: Request, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    transaction_id = str(uuid.uuid4())
    payment = Payment(
        user_id=current_user.id,
        provider=PaymentProvider.STRIPE,
        transaction_id=transaction_id,
        amount_npr=settings.PREMIUM_MONTHLY_PRICE_NPR,
        status=PaymentStatus.PENDING,
        plan_purchased="premium_monthly",
    )
    db.add(payment)
    db.commit()

    base_url = str(request.headers.get("origin") or request.base_url).rstrip("/")
    try:
        result = stripe_service.create_checkout_session(
            user_id=current_user.id,
            user_email=current_user.email,
            transaction_id=transaction_id,
            amount_usd_cents=settings.STRIPE_PRICE_NPR_TO_USD_CENTS,
            success_url=f"{base_url}/payments/success?session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{base_url}/pricing",
        )
    except stripe_service.StripeError as e:
        payment_service.mark_payment_failed(db, payment, reason=str(e))
        raise HTTPException(status_code=502, detail=f"Could not start Stripe checkout: {e}")

    payment.provider_reference_id = result["session_id"]
    db.add(payment)
    db.commit()
    return {"payment_id": payment.id, **result}


@router.post("/stripe/webhook")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature", "")
    try:
        event = stripe_service.verify_webhook_signature(payload, sig_header)
    except stripe_service.StripeError as e:
        raise HTTPException(status_code=400, detail=str(e))

    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        transaction_id = session.get("client_reference_id") or session.get("metadata", {}).get("transaction_id")
        payment = db.execute(select(Payment).where(Payment.transaction_id == transaction_id)).scalar_one_or_none()
        if payment and payment.status != PaymentStatus.SUCCESS:
            payment_service.settle_successful_payment(db, payment, raw_payload=dict(session))

    return {"received": True}


@router.get("/stripe/verify-session/{session_id}")
def verify_stripe_session(session_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Fallback check for the success-redirect page in case the webhook hasn't landed yet."""
    payment = db.execute(select(Payment).where(Payment.provider_reference_id == session_id)).scalar_one_or_none()
    if not payment or payment.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Payment not found.")

    if payment.status == PaymentStatus.SUCCESS:
        return {"status": "success", "subscription_expires_at": payment.subscription_expiry_date}

    try:
        session = stripe_service.retrieve_session(session_id)
    except stripe_service.StripeError as e:
        raise HTTPException(status_code=502, detail=str(e))

    if session.get("payment_status") == "paid":
        payment_service.settle_successful_payment(db, payment, raw_payload=dict(session))
        return {"status": "success", "subscription_expires_at": payment.subscription_expiry_date}

    return {"status": "pending"}


# ---------------- eSewa / Khalti API mode (kept for future merchant API access) ----------------

@router.post("/initiate/esewa")
def initiate_esewa(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if settings.ESEWA_MODE != "api":
        raise HTTPException(status_code=400, detail="eSewa is in manual-verification mode. Use /payments/manual/submit instead.")
    transaction_id = str(uuid.uuid4())
    payment = Payment(
        user_id=current_user.id, provider=PaymentProvider.ESEWA, transaction_id=transaction_id,
        amount_npr=settings.PREMIUM_MONTHLY_PRICE_NPR, status=PaymentStatus.PENDING, plan_purchased="premium_monthly",
    )
    db.add(payment)
    db.commit()
    form_payload = payment_service.build_esewa_initiate_payload(transaction_id, settings.PREMIUM_MONTHLY_PRICE_NPR)
    return {"payment_id": payment.id, "transaction_id": transaction_id, **form_payload}


@router.get("/history")
def payment_history(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    stmt = select(Payment).where(Payment.user_id == current_user.id).order_by(Payment.created_at.desc())
    payments = db.execute(stmt).scalars().all()
    return [
        {
            "id": p.id, "provider": p.provider.value, "transaction_id": p.transaction_id,
            "amount_npr": p.amount_npr, "status": p.status.value, "plan_purchased": p.plan_purchased,
            "subscription_expiry_date": p.subscription_expiry_date, "admin_notes": p.admin_notes,
            "created_at": p.created_at,
        }
        for p in payments
    ]
