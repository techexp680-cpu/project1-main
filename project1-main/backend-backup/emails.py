"""Email sending via Resend with mock fallback."""
import os
import logging

log = logging.getLogger("oc.emails")

API_KEY = os.environ.get("RESEND_API_KEY", "")
FROM_EMAIL = os.environ.get("FROM_EMAIL", "orders@operatorschoice.com")
SUPPORT_EMAIL = os.environ.get("SUPPORT_EMAIL", "support@operatorschoice.com")


def is_live() -> bool:
    return bool(API_KEY) and "MOCKED" not in API_KEY


_client_ready = False
if is_live():
    try:
        import resend
        resend.api_key = API_KEY
        _client_ready = True
        log.info("Resend email client initialized")
    except Exception as e:
        log.warning(f"Resend init failed, mocking: {e}")


def _wrap_html(title: str, body_html: str) -> str:
    return f"""<!doctype html><html><body style="margin:0;background:#0A0A0A;color:#fff;font-family:Manrope,system-ui,sans-serif;">
<div style="max-width:560px;margin:auto;padding:32px 24px;background:#0A0A0A;border:1px solid #2D2D2D;">
<div style="font-family:'Bebas Neue',Impact,sans-serif;font-size:28px;letter-spacing:2px;color:#D4AF37;">OPERATOR'S CHOICE</div>
<div style="font-size:11px;letter-spacing:3px;color:#999;text-transform:uppercase;margin-bottom:24px;">Forged for the Fearless</div>
<h2 style="color:#fff;font-family:'Bebas Neue',Impact,sans-serif;letter-spacing:1px;">{title}</h2>
{body_html}
<hr style="border:none;border-top:1px solid #2D2D2D;margin:28px 0;"/>
<div style="font-size:11px;color:#666;">© Operator's Choice · {SUPPORT_EMAIL}</div>
</div></body></html>"""


def send(to: str, subject: str, html: str) -> bool:
    if not is_live() or not _client_ready:
        log.info(f"[MOCK EMAIL] to={to} subject={subject}")
        return True
    try:
        import resend
        resend.Emails.send({
            "from": f"Operator's Choice <{FROM_EMAIL}>",
            "to": [to],
            "subject": subject,
            "html": html,
        })
        return True
    except Exception as e:
        log.error(f"Resend send failed to {to}: {e}")
        return False


def send_otp(to: str, otp: str) -> bool:
    html = _wrap_html("PASSWORD RESET",
        f"<p>Use this one-time code to reset your password. Code expires in 15 minutes.</p>"
        f"<div style='font-family:JetBrains Mono,monospace;font-size:32px;letter-spacing:8px;color:#D4AF37;background:#1A1A1A;padding:18px;text-align:center;margin:18px 0;'>{otp}</div>"
        f"<p style='color:#999;font-size:13px;'>If you didn't request this, ignore this email.</p>")
    return send(to, "Your Operator's Choice reset code", html)


def send_order_confirmation(to: str, order: dict) -> bool:
    items_html = "".join([
        f"<tr><td style='padding:8px 0;color:#ccc;'>{it['name']} × {it['qty']}</td><td style='text-align:right;font-family:monospace;'>₹{int(it['price']*it['qty'])}</td></tr>"
        for it in order.get("items", [])
    ])
    html = _wrap_html(f"ORDER CONFIRMED · {order['order_number']}",
        f"<p>Mission confirmed, operator. Your order has been received and is being prepared.</p>"
        f"<table style='width:100%;font-size:14px;color:#fff;margin:18px 0;border-collapse:collapse;'>{items_html}</table>"
        f"<hr style='border:none;border-top:1px solid #2D2D2D;'/>"
        f"<table style='width:100%;font-size:14px;margin-top:10px;'>"
        f"<tr><td style='color:#999;'>Subtotal</td><td style='text-align:right;'>₹{int(order['subtotal'])}</td></tr>"
        f"<tr><td style='color:#999;'>GST</td><td style='text-align:right;'>₹{int(order['gst'])}</td></tr>"
        f"<tr><td style='color:#999;'>Shipping</td><td style='text-align:right;'>{'FREE' if order['shipping_fee']==0 else '₹'+str(int(order['shipping_fee']))}</td></tr>"
        f"<tr><td style='color:#D4AF37;font-size:18px;'><b>Total</b></td><td style='text-align:right;color:#D4AF37;font-size:18px;'><b>₹{int(order['total'])}</b></td></tr>"
        f"</table>")
    return send(to, f"Order Confirmed · {order['order_number']}", html)


def send_contact_notification(name: str, email: str, message: str) -> bool:
    html = _wrap_html("NEW CONTACT MESSAGE",
        f"<p><b>From:</b> {name} &lt;{email}&gt;</p><p style='background:#1A1A1A;padding:14px;color:#ddd;'>{message}</p>")
    return send(SUPPORT_EMAIL, f"Contact: {name}", html)
