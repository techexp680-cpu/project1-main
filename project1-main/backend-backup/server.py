from fastapi import FastAPI, APIRouter, HTTPException, Depends, Query, status, Request
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import random
from typing import List, Optional
from datetime import datetime, timezone, timedelta
from pydantic import BaseModel

from models import (
    User, UserPublic, RegisterReq, LoginReq, GoogleLoginReq, ForgotReq, ResetReq, AddressReq,
    Product, ProductReview, Order, CreateOrderReq, Coupon, CouponCheckReq, NewsletterReq, ContactReq,
    utc_now_iso, new_id,
)
from auth import (
    hash_password, verify_password, create_token,
    get_current_user_id, get_current_admin, optional_user_id,
)
from seed_data import PRODUCTS, COUPONS, REVIEW_TEMPLATES
import payments
import uploads
import emails


mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI(title="Operator's Choice API")
api = APIRouter(prefix="/api")

logger = logging.getLogger("oc")
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')


# ---------- Helpers ----------
def public_user(u: dict) -> dict:
    return {
        "id": u["id"], "name": u["name"], "email": u["email"],
        "phone": u.get("phone"), "is_admin": u.get("is_admin", False),
        "addresses": u.get("addresses", []), "wishlist": u.get("wishlist", []),
        "created_at": u["created_at"],
    }


def calc_totals(items: list, coupon: Optional[dict]) -> dict:
    subtotal = sum(i["price"] * i["qty"] for i in items)
    discount = 0.0
    if coupon and coupon.get("active") and subtotal >= coupon.get("min_order", 0):
        if coupon["discount_type"] == "percent":
            discount = round(subtotal * coupon["value"] / 100, 2)
        else:
            discount = float(coupon["value"])
    discounted = max(subtotal - discount, 0)
    shipping_fee = 0.0 if discounted >= 1999 else 99.0
    if coupon and coupon.get("code") == "FREESHIP" and coupon.get("active"):
        shipping_fee = 0.0
    gst = round(discounted * 0.05, 2)
    total = round(discounted + shipping_fee + gst, 2)
    return {
        "subtotal": round(subtotal, 2), "discount": round(discount, 2),
        "shipping_fee": shipping_fee, "gst": gst, "total": total,
    }


# ---------- Health ----------
("/")
async def root():
    return {"ok": True, "brand": "Operator's Choice"}

@api.get
# ---------- Auth ----------
@api.post("/auth/register")
async def register(req: RegisterReq):
    existing = await db.users.find_one({"email": req.email.lower()})
    if existing:
        raise HTTPException(400, "Email already registered")
    u = User(name=req.name, email=req.email.lower(), phone=req.phone,
             password_hash=hash_password(req.password))
    await db.users.insert_one(u.model_dump())
    token = create_token(u.id, u.is_admin)
    return {"token": token, "user": public_user(u.model_dump())}


@api.post("/auth/login")
async def login(req: LoginReq):
    u = await db.users.find_one({"email": req.email.lower()}, {"_id": 0})
    if not u or not verify_password(req.password, u["password_hash"]):
        raise HTTPException(401, "Invalid email or password")
    token = create_token(u["id"], u.get("is_admin", False))
    return {"token": token, "user": public_user(u)}


@api.post("/auth/google")
async def google_login(req: GoogleLoginReq):
    """Mocked Emergent Google login — accepts name+email and signs in or creates account."""
    u = await db.users.find_one({"email": req.email.lower()}, {"_id": 0})
    if not u:
        nu = User(name=req.name, email=req.email.lower(),
                  password_hash=hash_password(new_id()))
        await db.users.insert_one(nu.model_dump())
        u = nu.model_dump()
    token = create_token(u["id"], u.get("is_admin", False))
    return {"token": token, "user": public_user(u)}


@api.post("/auth/forgot")
async def forgot(req: ForgotReq):
    u = await db.users.find_one({"email": req.email.lower()})
    otp = str(random.randint(100000, 999999))
    if u:
        await db.users.update_one({"id": u["id"]}, {"$set": {"reset_otp": otp, "reset_otp_at": utc_now_iso()}})
        emails.send_otp(req.email.lower(), otp)
    # If live email, do not leak OTP. In mock mode return demo_otp for dev visibility.
    if emails.is_live():
        return {"message": "If an account exists, an OTP has been sent."}
    return {"message": "OTP sent (mock)", "demo_otp": otp}


@api.post("/auth/reset")
async def reset(req: ResetReq):
    u = await db.users.find_one({"email": req.email.lower()})
    if not u or u.get("reset_otp") != req.otp:
        raise HTTPException(400, "Invalid OTP")
    await db.users.update_one({"id": u["id"]}, {
        "$set": {"password_hash": hash_password(req.new_password)},
        "$unset": {"reset_otp": "", "reset_otp_at": ""},
    })
    return {"message": "Password reset successful"}


("/auth/me")
async def me(uid: str = Depends(get_current_user_id)):
    u = await db.users.find_one({"id": uid}, {"_id": 0})
    if not u:
        raise HTTPException(404, "User not found")
    return public_user(u)


# ---------- Addresses ----------
@api.post("/account/addresses")
async def add_address(req: AddressReq, uid: str = Depends(get_current_user_id)):
    addr = req.model_dump()
    addr["id"] = new_id()
    if addr["is_default"]:
        await db.users.update_one({"id": uid}, {"$set": {"addresses.$[].is_default": False}})
    await db.users.up@api.getdate_one({"id": uid}, {"$push": {"addresses": addr}})
    u = await db.users.find_one({"id": uid}, {"_id": 0})
    return public_user(u)


@api.delete("/account/addresses/{addr_id}")
async def delete_address(addr_id: str, uid: str = Depends(get_current_user_id)):
    await db.users.update_one({"id": uid}, {"$pull": {"addresses": {"id": addr_id}}})
    u = await db.users.find_one({"id": uid}, {"_id": 0})
    return public_user(u)


# ---------- Wishlist ----------
@api.post("/account/wishlist/{product_id}")
async def toggle_wishlist(product_id: str, uid: str = Depends(get_current_user_id)):
    u = await db.users.find_one({"id": uid})
    wl = u.get("wishlist", [])
    if product_id in wl:
        wl.remove(product_id)
    else:
        wl.append(product_id)
    await db.users.update_one({"id": uid}, {"$set": {"wishlist": wl}})
    return {"wishlist": wl}


# ---------- Products ----------
@api.get("/products")
async def list_products(
    category: Optional[str] = None,
    collection: Optional[str] = None,
    q: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    color: Optional[str] = None,
    size: Optional[str] = None,
    sort: str = "newest",
    limit: int = 60,
):
    flt: dict = {}
    if category: flt["category"] = category
    if collection: flt["collection"] = collection
    if q: flt["name"] = {"$regex": q, "$options": "i"}
    if min_price is not None or max_price is not None:
        rng = {}
        if min_price is not None: rng["$gte"] = min_price
        if max_price is not None: rng["$lte"] = max_price
        flt["price"] = rng
    if color: flt["colors.name"] = {"$regex": color, "$options": "i"}
    if size: flt["sizes"] = size

    sort_map = {
        "newest": [("created_at", -1)],
        "price_asc": [("price", 1)],
        "price_desc": [("price", -1)],
        "bestselling": [("sold_count", -1)],
    }
    cursor = db.products.find(flt, {"_id": 0}).sort(sort_map.get(sort, sort_map["newest"])).limit(limit)
    return await cursor.to_list(limit)


@api.get("/products/best-sellers")
async def best_sellers(limit: int = 8):
    cursor = db.products.find({}, {"_id": 0}).sort([("sold_count", -1)]).limit(limit)
    return await cursor.to_list(limit)


@api.get("/products/new-drops")
async def new_drops():
    cursor = db.products.find({"is_new_drop": True}, {"_id": 0}).sort([("created_at", -1)])
    return await cursor.to_list(50)


@api.get("/products/{slug}")
async def product_detail(slug: str):
    p = await db.products.find_one({"slug": slug}, {"_id": 0})
    if not p:
        raise HTTPException(404, "Product not found")
    # similar = same category, exclude self
    sim = await db.products.find({"category": p["category"], "slug": {"$ne": slug}}, {"_id": 0}).limit(4).to_list(4)
    return {"product": p, "similar": sim}


@api.post("/products/{slug}/reviews")
async def add_review(slug: str, review: ProductReview, uid: str = Depends(get_current_user_id)):
    p = await db.products.find_one({"slug": slug})
    if not p:
        raise HTTPException(404, "Product not found")
    r = review.model_dump()
    r["created_at"] = utc_now_iso()
    await db.products.update_one({"slug": slug}, {"$push": {"reviews": r}})
    # recompute average
    p2 = await db.products.find_one({"slug": slug})
    reviews = p2.get("reviews", [])
    avg = round(sum(rv["rating"] for rv in reviews) / len(reviews), 2) if reviews else 5.0
    await db.products.update_one({"slug": slug}, {"$set": {"rating": avg}})
    return {"ok": True}


# ---------- Coupons ----------
@api.post("/coupons/check")
async def check_coupon(req: CouponCheckReq):
    c = await db.coupons.find_one({"code": req.code.upper(), "active": True}, {"_id": 0})
    if not c:
        raise HTTPException(404, "Invalid coupon")
    if req.subtotal < c["min_order"]:
        raise HTTPException(400, f"Minimum order ₹{c['min_order']} required for {c['code']}")
    return c


# ---------- Orders ----------
def make_tracking_steps() -> list:
    now = datetime.now(timezone.utc)
    return [
        {"step": "Order Confirmed", "done": True, "at": now.isoformat()},
        {"step": "Packed at Warehouse", "done": False, "at": None},
        {"step": "Shipped", "done": False, "at": None},
        {"step": "Out for Delivery", "done": False, "at": None},
        {"step": "Delivered", "done": False, "at": None},
    ]


@api.post("/orders")
async def create_order(req: CreateOrderReq, uid: Optional[str] = Depends(optional_user_id)):
    items = [i.model_dump() for i in req.items]
    coupon = None
    if req.coupon_code:
        coupon = await db.coupons.find_one({"code": req.coupon_code.upper(), "active": True}, {"_id": 0})
    totals = calc_totals(items, coupon)
    order_number = f"OC{datetime.now().strftime('%y%m%d')}{random.randint(1000, 9999)}"
    o = Order(
        order_number=order_number,
        user_id=uid,
        items=items,
        shipping_address=req.shipping_address.model_dump(),
        subtotal=totals["subtotal"],
        discount=totals["discount"],
        gst=totals["gst"],
        shipping_fee=totals["shipping_fee"],
        total=totals["total"],
        coupon_code=(coupon["code"] if coupon else None),
        status="confirmed",
        payment_status="paid",
        payment_id=f"pay_MOCK{random.randint(100000, 999999)}",
        tracking_steps=make_tracking_steps(),
    )
    await db.orders.insert_one(o.model_dump())
    # Increment sold counts
    for it in items:
        await db.products.update_one({"id": it["product_id"]}, {"$inc": {"sold_count": it["qty"]}})
    # Confirmation email (mock-safe)
    try:
        if o.shipping_address.get("email"):
            emails.send_order_confirmation(o.shipping_address["email"], o.model_dump())
    except Exception as e:
        logger.warning(f"Order email failed: {e}")
    return o.model_dump()


@api.get("/orders/track/{order_number}")
async def track_order(order_number: str):
    o = await db.orders.find_one({"order_number": order_number}, {"_id": 0})
    if not o:
        raise HTTPException(404, "Order not found")
    return o


@api.get("/orders/mine")
async def my_orders(uid: str = Depends(get_current_user_id)):
    cursor = db.orders.find({"user_id": uid}, {"_id": 0}).sort([("created_at", -1)])
    return await cursor.to_list(100)


# ---------- Newsletter / Contact ----------
@api.post("/newsletter")
async def subscribe(req: NewsletterReq):
    await db.newsletter.update_one(
        {"email": req.email.lower()},
        {"$set": {"email": req.email.lower(), "at": utc_now_iso()}},
        upsert=True,
    )
    return {"message": "Subscribed to the squad."}


@api.post("/contact")
async def contact(req: ContactReq):
    await db.contact.insert_one({
        "id": new_id(), "name": req.name, "email": req.email,
        "message": req.message, "at": utc_now_iso(),
    })
    emails.send_contact_notification(req.name, req.email, req.message)
    return {"message": "Message received. We respond within 24h."}


# ---------- Payments (Razorpay) ----------
class CreatePaymentOrderReq(BaseModel):
    items: List[dict]
    shipping_address: dict
    coupon_code: Optional[str] = None


class VerifyPaymentReq(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str
    items: List[dict]
    shipping_address: dict
    coupon_code: Optional[str] = None


@api.get("/payments/config")
async def payments_config():
    """Return public config the frontend needs to launch Razorpay checkout."""
    return {
        "key_id": payments.public_key_id(),
        "is_live": payments.is_live(),
        "currency": "INR",
    }


@api.post("/payments/create-order")
async def payments_create_order(req: CreatePaymentOrderReq):
    """Create a Razorpay order before launching checkout. Returns Razorpay order details."""
    coupon = None
    if req.coupon_code:
        coupon = await db.coupons.find_one({"code": req.coupon_code.upper(), "active": True}, {"_id": 0})
    totals = calc_totals(req.items, coupon)
    amount_paise = int(round(totals["total"] * 100))
    receipt = f"oc_{datetime.now().strftime('%y%m%d%H%M%S')}"
    order = payments.create_order(amount_paise, receipt, notes={"brand": "operators_choice"})
    return {**order, "totals": totals}


@api.post("/payments/verify")
async def payments_verify(req: VerifyPaymentReq, uid: Optional[str] = Depends(optional_user_id)):
    """Verify Razorpay signature then create the Order record. Returns the order."""
    ok = payments.verify_payment_signature(
        req.razorpay_order_id, req.razorpay_payment_id, req.razorpay_signature
    )
    if not ok:
        raise HTTPException(400, "Payment signature verification failed")

    coupon = None
    if req.coupon_code:
        coupon = await db.coupons.find_one({"code": req.coupon_code.upper(), "active": True}, {"_id": 0})
    totals = calc_totals(req.items, coupon)
    order_number = f"OC{datetime.now().strftime('%y%m%d')}{random.randint(1000, 9999)}"
    o = Order(
        order_number=order_number, user_id=uid,
        items=req.items, shipping_address=req.shipping_address,
        subtotal=totals["subtotal"], discount=totals["discount"],
        gst=totals["gst"], shipping_fee=totals["shipping_fee"], total=totals["total"],
        coupon_code=(coupon["code"] if coupon else None),
        status="confirmed", payment_status="paid",
        payment_id=req.razorpay_payment_id,
        tracking_steps=make_tracking_steps(),
    )
    await db.orders.insert_one(o.model_dump())
    for it in req.items:
        await db.products.update_one({"id": it["product_id"]}, {"$inc": {"sold_count": it["qty"]}})
    # Email confirmation
    try:
        if req.shipping_address.get("email"):
            emails.send_order_confirmation(req.shipping_address["email"], o.model_dump())
    except Exception as e:
        logger.warning(f"Order email failed: {e}")
    return o.model_dump()


@api.post("/payments/webhook")
async def payments_webhook(request: Request):
    """Razorpay webhook (signature verified). Currently logs and acks."""
    payload = await request.body()
    sig = request.headers.get("X-Razorpay-Signature", "")
    if not payments.verify_webhook_signature(payload, sig):
        raise HTTPException(401, "Invalid webhook signature")
    try:
        import json
        data = json.loads(payload.decode("utf-8") or "{}")
        await db.webhooks.insert_one({"id": new_id(), "event": data.get("event"), "raw": data, "at": utc_now_iso()})
    except Exception as e:
        logger.warning(f"Webhook parse failed: {e}")
    return {"ok": True}


# ---------- Cloudinary uploads ----------
@api.get("/uploads/signature")
async def upload_signature(folder: str = "products/", _: str = Depends(get_current_admin)):
    """Admin-only: returns signed upload params for Cloudinary."""
    try:
        return uploads.generate_signature(folder)
    except ValueError as e:
        raise HTTPException(400, str(e))


# ---------- Admin ----------
@api.get("/admin/stats")
async def admin_stats(_: str = Depends(get_current_admin)):
    total_orders = await db.orders.count_documents({})
    total_users = await db.users.count_documents({"is_admin": {"$ne": True}})
    total_products = await db.products.count_documents({})
    revenue_agg = await db.orders.aggregate([{"$group": {"_id": None, "sum": {"$sum": "$total"}}}]).to_list(1)
    revenue = revenue_agg[0]["sum"] if revenue_agg else 0
    recent = await db.orders.find({}, {"_id": 0}).sort([("created_at", -1)]).limit(8).to_list(8)
    return {
        "total_orders": total_orders, "total_users": total_users,
        "total_products": total_products, "revenue": round(revenue, 2),
        "recent_orders": recent,
    }


@api.get("/admin/orders")
async def admin_orders(_: str = Depends(get_current_admin)):
    return await db.orders.find({}, {"_id": 0}).sort([("created_at", -1)]).to_list(500)


@api.patch("/admin/orders/{order_number}/status")
async def admin_update_status(order_number: str, new_status: str, _: str = Depends(get_current_admin)):
    valid = ["confirmed", "packed", "shipped", "out_for_delivery", "delivered", "cancelled"]
    if new_status not in valid:
        raise HTTPException(400, f"Status must be one of {valid}")
    o = await db.orders.find_one({"order_number": order_number})
    if not o:
        raise HTTPException(404, "Order not found")
    steps = o.get("tracking_steps", [])
    step_map = {"confirmed": 0, "packed": 1, "shipped": 2, "out_for_delivery": 3, "delivered": 4}
    idx = step_map.get(new_status, 0)
    now = datetime.now(timezone.utc).isoformat()
    for i in range(len(steps)):
        if i <= idx:
            steps[i]["done"] = True
            if not steps[i].get("at"):
                steps[i]["at"] = now
    await db.orders.update_one({"order_number": order_number}, {"$set": {"status": new_status, "tracking_steps": steps}})
    return {"ok": True}


@api.post("/admin/products")
async def admin_create_product(p: Product, _: str = Depends(get_current_admin)):
    if await db.products.find_one({"slug": p.slug}):
        raise HTTPException(400, "Slug already exists")
    await db.products.insert_one(p.model_dump())
    return p.model_dump()


@api.patch("/admin/products/{slug}")
async def admin_update_product(slug: str, updates: dict, _: str = Depends(get_current_admin)):
    updates.pop("id", None); updates.pop("created_at", None)
    await db.products.update_one({"slug": slug}, {"$set": updates})
    p = await db.products.find_one({"slug": slug}, {"_id": 0})
    return p


@api.delete("/admin/products/{slug}")
async def admin_delete_product(slug: str, _: str = Depends(get_current_admin)):
    await db.products.delete_one({"slug": slug})
    return {"ok": True}


@api.get("/admin/customers")
async def admin_customers(_: str = Depends(get_current_admin)):
    users = await db.users.find({"is_admin": {"$ne": True}}, {"_id": 0, "password_hash": 0, "reset_otp": 0}).to_list(500)
    return users


# ---------- Startup: seed ----------
@app.on_event("startup")
async def on_startup():
    # Seed admin
    admin_email = os.environ["ADMIN_EMAIL"].lower()
    admin_pw = os.environ["ADMIN_PASSWORD"]
    existing_admin = await db.users.find_one({"email": admin_email})
    if not existing_admin:
        admin = User(name="Operator Admin", email=admin_email,
                     password_hash=hash_password(admin_pw), is_admin=True)
        await db.users.insert_one(admin.model_dump())
        logger.info(f"Seeded admin {admin_email}")
    else:
        # ensure is_admin flag and password
        await db.users.update_one({"email": admin_email}, {"$set": {
            "is_admin": True, "password_hash": hash_password(admin_pw),
        }})

    # Seed products
    if await db.products.count_documents({}) == 0:
        for raw in PRODUCTS:
            p = Product(**raw)
            # Generate reviews
            reviews = []
            for nm, rt, cm in random.sample(REVIEW_TEMPLATES, k=min(3, len(REVIEW_TEMPLATES))):
                reviews.append({"user_name": nm, "rating": rt, "comment": cm, "created_at": utc_now_iso()})
            p.reviews = [ProductReview(**r) for r in reviews]
            await db.products.insert_one(p.model_dump())
        logger.info(f"Seeded {len(PRODUCTS)} products")

    # Seed coupons
    if await db.coupons.count_documents({}) == 0:
        for c in COUPONS:
            cc = Coupon(**c)
            await db.coupons.insert_one(cc.model_dump())
        logger.info(f"Seeded {len(COUPONS)} coupons")


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()


app.include_router(api)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)
