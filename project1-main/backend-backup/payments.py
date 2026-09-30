import os
import hmac
import hashlib
import logging
from typing import Optional, Dict, Any

import razorpay

log = logging.getLogger("oc.payments")

RAZORPAY_KEY_ID = os.environ.get("RAZORPAY_KEY_ID", "").strip()
RAZORPAY_KEY_SECRET = os.environ.get("RAZORPAY_KEY_SECRET", "").strip()
RAZORPAY_MODE = os.environ.get("RAZORPAY_MODE", "test").strip().lower()
RAZORPAY_WEBHOOK_SECRET = os.environ.get("RAZORPAY_WEBHOOK_SECRET", "").strip()


def is_live() -> bool:
    return (
        RAZORPAY_MODE == "live"
        and RAZORPAY_KEY_ID.startswith("rzp_live_")
        and bool(RAZORPAY_KEY_SECRET)
    )


def public_key_id() -> str:
    return RAZORPAY_KEY_ID


def _client():
    if not RAZORPAY_KEY_ID or not RAZORPAY_KEY_SECRET:
        raise RuntimeError("Razorpay Key ID or Key Secret missing in .env")

    return razorpay.Client(
        auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET)
    )


def create_order(
    amount_paise: int,
    receipt: str,
    notes: Optional[Dict[str, Any]] = None,
) -> dict:
    if amount_paise <= 0:
        raise ValueError("Amount must be greater than 0")

    client = _client()

    order = client.order.create(
        data={
            "amount": int(amount_paise),
            "currency": "INR",
            "receipt": receipt[:40],
            "notes": notes or {},
        }
    )

    log.info(
        "Razorpay order created: id=%s amount=%s mode=%s",
        order.get("id"),
        amount_paise,
        RAZORPAY_MODE,
    )

    return {
        **order,
        "is_mock": False,
    }


def verify_payment_signature(
    razorpay_order_id: str,
    razorpay_payment_id: str,
    razorpay_signature: str,
) -> bool:
    if not razorpay_order_id or not razorpay_payment_id or not razorpay_signature:
        log.warning("Razorpay verification failed: missing order/payment/signature")
        return False

    if not RAZORPAY_KEY_SECRET:
        log.warning("Razorpay verification failed: key secret missing")
        return False

    body = f"{razorpay_order_id}|{razorpay_payment_id}"

    expected_signature = hmac.new(
        RAZORPAY_KEY_SECRET.encode("utf-8"),
        body.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()

    verified = hmac.compare_digest(expected_signature, razorpay_signature)

    if verified:
        log.info(
            "Razorpay payment verified: order=%s payment=%s",
            razorpay_order_id,
            razorpay_payment_id,
        )
        return True

    log.warning(
        "Razorpay signature verification failed: order=%s payment=%s",
        razorpay_order_id,
        razorpay_payment_id,
    )

    return False


def verify_webhook_signature(payload_bytes: bytes, signature: str) -> bool:
    if not RAZORPAY_WEBHOOK_SECRET:
        log.warning("Webhook verification failed: RAZORPAY_WEBHOOK_SECRET missing")
        return False

    expected_signature = hmac.new(
        RAZORPAY_WEBHOOK_SECRET.encode("utf-8"),
        payload_bytes,
        hashlib.sha256,
    ).hexdigest()

    return hmac.compare_digest(expected_signature, signature)