"""
Stripe integration for card payments (Premium subscription).

Uses Stripe Checkout (hosted payment page) rather than building a custom card
form — this is the safest approach: card details never touch our backend,
which keeps us out of PCI-DSS scope. The secret key is read from the
STRIPE_SECRET_KEY env var only; it is never sent to the frontend or logged.
"""
import stripe

from app.core.config import settings

stripe.api_key = settings.STRIPE_SECRET_KEY


class StripeError(Exception):
    pass


def create_checkout_session(
    user_id: str,
    user_email: str,
    transaction_id: str,
    amount_usd_cents: int,
    success_url: str,
    cancel_url: str,
) -> dict:
    if not settings.STRIPE_SECRET_KEY:
        raise StripeError("Stripe is not configured. Set STRIPE_SECRET_KEY in the backend .env file.")
    try:
        session = stripe.checkout.Session.create(
            mode="payment",
            payment_method_types=["card"],
            customer_email=user_email,
            line_items=[
                {
                    "price_data": {
                        "currency": "usd",
                        "product_data": {"name": "Kanoon Mitra Premium — 1 month"},
                        "unit_amount": amount_usd_cents,
                    },
                    "quantity": 1,
                }
            ],
            success_url=success_url,
            cancel_url=cancel_url,
            client_reference_id=transaction_id,
            metadata={"user_id": user_id, "transaction_id": transaction_id},
        )
        return {"checkout_url": session.url, "session_id": session.id}
    except stripe.error.StripeError as e:
        raise StripeError(str(e)) from e


def verify_webhook_signature(payload: bytes, sig_header: str) -> stripe.Event:
    if not settings.STRIPE_WEBHOOK_SECRET:
        raise StripeError("STRIPE_WEBHOOK_SECRET is not set — cannot verify webhook authenticity.")
    try:
        return stripe.Webhook.construct_event(payload, sig_header, settings.STRIPE_WEBHOOK_SECRET)
    except (stripe.error.SignatureVerificationError, ValueError) as e:
        raise StripeError(f"Webhook signature verification failed: {e}") from e


def retrieve_session(session_id: str) -> dict:
    try:
        session = stripe.checkout.Session.retrieve(session_id)
        return session
    except stripe.error.StripeError as e:
        raise StripeError(str(e)) from e
