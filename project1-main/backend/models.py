from __future__ import annotations
from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
import uuid


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def new_id() -> str:
    return str(uuid.uuid4())


class BaseDoc(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=new_id)
    created_at: str = Field(default_factory=utc_now_iso)


# ------------ User ------------
class UserPublic(BaseModel):
    id: str
    name: str
    email: EmailStr
    phone: Optional[str] = None
    is_admin: bool = False
    addresses: List[Dict[str, Any]] = []
    wishlist: List[str] = []
    created_at: str


class User(BaseDoc):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    password_hash: str
    is_admin: bool = False
    addresses: List[Dict[str, Any]] = []
    wishlist: List[str] = []


class RegisterReq(BaseModel):
    name: str
    email: EmailStr
    password: str
    phone: Optional[str] = None


class LoginReq(BaseModel):
    email: EmailStr
    password: str


class GoogleLoginReq(BaseModel):
    name: str
    email: EmailStr
    picture: Optional[str] = None


class ForgotReq(BaseModel):
    email: EmailStr


class ResetReq(BaseModel):
    email: EmailStr
    otp: str
    new_password: str


class AddressReq(BaseModel):
    full_name: str
    phone: str
    line1: str
    line2: Optional[str] = ""
    city: str
    state: str
    pincode: str
    landmark: Optional[str] = ""
    is_default: bool = False


# ------------ Product ------------
class ProductReview(BaseModel):
    user_name: str
    rating: int = 5
    comment: str
    created_at: str = Field(default_factory=utc_now_iso)


class Product(BaseDoc):
    slug: str
    name: str
    description: str
    price: float
    compare_at_price: Optional[float] = None
    category: str  # tees, hoodies, cargo, caps, accessories
    collection: Optional[str] = None  # operator, kargil, patriot, fearless, bravest
    images: List[str] = []
    sizes: List[str] = ["S", "M", "L", "XL", "XXL"]
    colors: List[Dict[str, str]] = []  # [{name, hex}]
    stock: int = 50
    specs: Dict[str, str] = {}
    badges: List[str] = []  # ["Limited Edition","Bestseller","One Time Drop"]
    is_new_drop: bool = False
    drop_ends_at: Optional[str] = None
    rating: float = 4.7
    reviews: List[ProductReview] = []
    sold_count: int = 0


# ------------ Order ------------
class OrderItem(BaseModel):
    product_id: str
    name: str
    image: str
    price: float
    size: str
    color: Optional[str] = None
    qty: int


class ShippingAddress(BaseModel):
    full_name: str
    phone: str
    email: EmailStr
    line1: str
    line2: Optional[str] = ""
    city: str
    state: str
    pincode: str
    landmark: Optional[str] = ""


class CreateOrderReq(BaseModel):
    items: List[OrderItem]
    shipping_address: ShippingAddress
    coupon_code: Optional[str] = None


class Order(BaseDoc):
    order_number: str
    user_id: Optional[str] = None
    items: List[Dict[str, Any]]
    shipping_address: Dict[str, Any]
    subtotal: float
    discount: float = 0.0
    gst: float
    shipping_fee: float
    total: float
    coupon_code: Optional[str] = None
    status: str = "confirmed"  # confirmed -> packed -> shipped -> out_for_delivery -> delivered
    payment_status: str = "paid"  # mocked paid
    payment_id: str
    tracking_steps: List[Dict[str, Any]] = []


# ------------ Coupon ------------
class Coupon(BaseDoc):
    code: str
    description: str
    discount_type: str = "percent"  # percent | flat
    value: float = 10.0
    min_order: float = 0.0
    active: bool = True


class CouponCheckReq(BaseModel):
    code: str
    subtotal: float


# ------------ Newsletter ------------
class NewsletterReq(BaseModel):
    email: EmailStr


class ContactReq(BaseModel):
    name: str
    email: EmailStr
    message: str
