import os
import hmac
import hashlib
import logging
from typing import Optional, Dict, Any

import razorpay

logger = logging.getLogger("oc.payments")


RAZORPAY_KEY_ID = os.environ.get("RAZORPAY_KEY_ID", "").strip()
RAZORPAY_KEY_SECRET = os.environ.get("RAZORPAY_KEY_SECRET", "").strip()
RAZORPAY_MODE = os.environ.get("RAZORPAY_MODE", "test").strip().lower()
RAZORPAY_WEBHOOK_SECRET = os.environ.get("RAZORPAY_WEBHOOK_SECRET", "").strip()


def is_live() -> bool:
    return RAZORPAY_MODE == "live"


def public_key_id() -> str:
    return RAZORPAY_KEY_ID


def _client():
    if not RAZORPAY_KEY_ID or not RAZORPAY_KEY_SECRET:
        raise RuntimeError("Razorpay keys are missing in backend .env")

    return razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))


def create_order(
    amount_paise: int,
    receipt: str,
    notes: Optional[Dict[str, Any]] = None,
) -> dict:
    """
    Creates a real Razorpay order.

    amount_paise example:
    ₹499 = 49900 paise
    """

    if amount_paise <= 0:
        raise ValueError("Amount must be greater than 0")

    client = _client()

    order_data = {
        "amount": int(amount_paise),
        "currency": "INR",
        "receipt": receipt,
        "notes": notes or {},
    }

    order = client.order.create(data=order_data)

    logger.info(
        "Razorpay order created: %s amount=%s mode=%s",
        order.get("id"),
        amount_paise,
        RAZORPAY_MODE,
    )

    return order


def verify_payment_signature(
    razorpay_order_id: str,
    razorpay_payment_id: str,
    razorpay_signature: str,
) -> bool:
    """
    Verifies Razorpay payment signature.

    Signature payload format:
    razorpay_order_id + "|" + razorpay_payment_id
    """

    if not RAZORPAY_KEY_SECRET:
        logger.error("Razorpay secret missing. Cannot verify payment.")
        return False

    if not razorpay_order_id or not razorpay_payment_id or not razorpay_signature:
        return False

    payload = f"{razorpay_order_id}|{razorpay_payment_id}"

    generated_signature = hmac.new(
        RAZORPAY_KEY_SECRET.encode("utf-8"),
        payload.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()

    return hmac.compare_digest(generated_signature, razorpay_signature)


def verify_webhook_signature(payload: bytes, signature: str) -> bool:
    """
    Verifies Razorpay webhook signature.

    Add this to .env later when setting webhook in Razorpay dashboard:
    RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
    """

    if not RAZORPAY_WEBHOOK_SECRET:
        logger.warning("RAZORPAY_WEBHOOK_SECRET missing. Webhook rejected.")
        return False

    if not payload or not signature:
        return False

    generated_signature = hmac.new(
        RAZORPAY_WEBHOOK_SECRET.encode("utf-8"),
        payload,
        hashlib.sha256,
    ).hexdigest()

    return hmac.compare_digest(generated_signature, signature)