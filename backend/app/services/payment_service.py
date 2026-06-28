"""
Payment integration scaffolding for eSewa and Khalti.

STATUS: SCAFFOLD — the control flow, DB writes, idempotency guard, and webhook
shapes are complete and follow each provider's documented v2 integration
pattern, but you MUST plug in real merchant credentials (ESEWA_SECRET_KEY,
KHALTI_SECRET_KEY in .env) and test against their sandbox before going live.
Signature/verification logic below mirrors each provider's published spec as
of this writing — re-check their current docs before production use, since
payment-gateway APIs change.

Flow implemented:
1. POST /payments/initiate -> creates a PENDING Payment row, returns the
   provider's redirect/payment payload for the frontend to redirect/launch.
2. Provider redirects user back / calls webhook -> POST /payments/verify
   or /payments/webhook/{provider} -> verify_* functions below check the
   signature/status with the provider, then atomically:
     - reject if transaction_id already SUCCESS (duplicate-processing guard)
     - update Payment.status
     - on success: extend user's subscription_expires_at, set plan=PREMIUM
3. All raw callback payloads are stored in Payment.raw_callback_payload for
   audit/debugging.
"""
import base64
import hashlib
import hmac
import json
from datetime import datetime, timedelta, timezone

import httpx
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.payment import Payment, PaymentProvider, PaymentStatus
from app.models.user import SubscriptionPlan, User


class PaymentError(Exception):
    pass


class DuplicatePaymentError(PaymentError):
    pass


PREMIUM_MONTHLY_PRICE = settings.PREMIUM_MONTHLY_PRICE_NPR


# ---------------- eSewa ----------------

def build_esewa_signature(total_amount: str, transaction_uuid: str, product_code: str) -> str:
    """eSewa v2 expects an HMAC-SHA256 signature over a specific field string, base64-encoded."""
    message = f"total_amount={total_amount},transaction_uuid={transaction_uuid},product_code={product_code}"
    digest = hmac.new(settings.ESEWA_SECRET_KEY.encode(), message.encode(), hashlib.sha256).digest()
    return base64.b64encode(digest).decode()


def build_esewa_initiate_payload(transaction_id: str, amount: int) -> dict:
    """Returns the form fields the frontend must POST to eSewa's payment page."""
    signature = build_esewa_signature(str(amount), transaction_id, settings.ESEWA_MERCHANT_CODE)
    return {
        "amount": amount,
        "tax_amount": 0,
        "total_amount": amount,
        "transaction_uuid": transaction_id,
        "product_code": settings.ESEWA_MERCHANT_CODE,
        "product_service_charge": 0,
        "product_delivery_charge": 0,
        "success_url": "/payments/esewa/success",
        "failure_url": "/payments/esewa/failure",
        "signed_field_names": "total_amount,transaction_uuid,product_code",
        "signature": signature,
        "esewa_form_url": f"{settings.ESEWA_BASE_URL}/api/epay/main/v2/form",
    }


async def verify_esewa_payment(transaction_id: str) -> dict:
    """Server-to-server status check against eSewa's status-check endpoint."""
    url = f"{settings.ESEWA_BASE_URL}/api/epay/transaction/status/"
    params = {
        "product_code": settings.ESEWA_MERCHANT_CODE,
        "transaction_uuid": transaction_id,
        "total_amount": PREMIUM_MONTHLY_PRICE,
    }
    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.get(url, params=params)
    if resp.status_code != 200:
        raise PaymentError(f"eSewa status check failed: HTTP {resp.status_code}")
    return resp.json()  # expected: {"status": "COMPLETE"/"PENDING"/"FAILED", "ref_id": ..., ...}


# ---------------- Khalti ----------------

async def verify_khalti_payment(token_or_pidx: str) -> dict:
    """Server-to-server lookup against Khalti's payment-verification endpoint."""
    url = f"{settings.KHALTI_BASE_URL}/api/v2/epayment/lookup/"
    headers = {"Authorization": f"Key {settings.KHALTI_SECRET_KEY}"}
    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.post(url, headers=headers, json={"pidx": token_or_pidx})
    if resp.status_code != 200:
        raise PaymentError(f"Khalti verification failed: HTTP {resp.status_code}")
    return resp.json()  # expected: {"status": "Completed"/"Pending"/"Expired"/..., "total_amount": ..., ...}


async def initiate_khalti_payment(transaction_id: str, amount_npr: int, return_url: str, website_url: str) -> dict:
    url = f"{settings.KHALTI_BASE_URL}/api/v2/epayment/initiate/"
    headers = {"Authorization": f"Key {settings.KHALTI_SECRET_KEY}"}
    body = {
        "return_url": return_url,
        "website_url": website_url,
        "amount": amount_npr * 100,  # Khalti uses paisa
        "purchase_order_id": transaction_id,
        "purchase_order_name": "Kanoon Mitra Premium Subscription",
    }
    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.post(url, headers=headers, json=body)
    if resp.status_code != 200:
        raise PaymentError(f"Khalti initiate failed: HTTP {resp.status_code}: {resp.text[:300]}")
    return resp.json()  # expected: {"pidx": ..., "payment_url": ..., ...}


# ---------------- Shared settlement logic ----------------

def settle_successful_payment(
    db: Session,
    payment: Payment,
    raw_payload: dict | None = None,
) -> Payment:
    """
    Idempotently marks a payment SUCCESS and extends the user's premium subscription.
    Safe to call more than once for the same payment row (no double-extension).
    """
    if payment.status == PaymentStatus.SUCCESS:
        return payment  # already settled — duplicate webhook/callback, no-op

    payment.status = PaymentStatus.SUCCESS
    if raw_payload is not None:
        payment.raw_callback_payload = json.dumps(raw_payload)[:4000]

    user = db.get(User, payment.user_id)
    if user is None:
        raise PaymentError(f"User {payment.user_id} not found while settling payment {payment.id}")

    now = datetime.now(timezone.utc)
    base = user.subscription_expires_at if (user.subscription_expires_at and user.subscription_expires_at > now) else now
    new_expiry = base + timedelta(days=30)

    user.subscription_plan = SubscriptionPlan.PREMIUM
    user.subscription_expires_at = new_expiry
    payment.subscription_expiry_date = new_expiry

    db.add(payment)
    db.add(user)
    db.commit()
    db.refresh(payment)
    return payment


def mark_payment_failed(db: Session, payment: Payment, reason: str = "") -> Payment:
    payment.status = PaymentStatus.FAILED
    if reason:
        payment.raw_callback_payload = json.dumps({"failure_reason": reason})[:4000]
    db.add(payment)
    db.commit()
    db.refresh(payment)
    return payment
