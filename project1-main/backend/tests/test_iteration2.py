"""Iteration 2 tests — Razorpay payment v2, Cloudinary uploads, admin product CRUD, regression."""
import os
import pytest
import requests

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://forged-fearless.preview.emergentagent.com').rstrip('/')
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@operatorschoice.com"
ADMIN_PASSWORD = "Operator@2026"


@pytest.fixture(scope="session")
def admin_token():
    r = requests.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=20)
    assert r.status_code == 200, r.text
    return r.json()["token"]


@pytest.fixture(scope="session")
def user_token():
    email = "TEST_iter2_user@example.com"
    requests.post(f"{API}/auth/register", json={"name": "Iter2 User", "email": email, "password": "Test@1234"}, timeout=20)
    r = requests.post(f"{API}/auth/login", json={"email": email, "password": "Test@1234"}, timeout=20)
    return r.json().get("token")


@pytest.fixture(scope="session")
def sample_items():
    r = requests.get(f"{API}/products", timeout=20)
    prods = r.json()
    p = prods[0]
    return [{
        "product_id": p["id"], "slug": p["slug"], "name": p["name"],
        "image": p["images"][0] if p.get("images") else "",
        "price": p["price"], "qty": 2, "size": "L", "color": "Black",
    }]


@pytest.fixture(scope="session")
def shipping_address():
    return {
        "full_name": "Test Operator", "email": "TEST_iter2_user@example.com",
        "phone": "9999999999", "line1": "1 MG Road", "line2": "Apt 1",
        "city": "Bangalore", "state": "KA", "pincode": "560001", "country": "India",
    }


# ---------- Payments ----------
class TestPayments:
    def test_config_mock_mode(self):
        r = requests.get(f"{API}/payments/config", timeout=20)
        assert r.status_code == 200
        data = r.json()
        assert data["key_id"] == ""
        assert data["is_live"] is False
        assert data["currency"] == "INR"

    def test_create_order_mock(self, sample_items, shipping_address):
        r = requests.post(f"{API}/payments/create-order", json={
            "items": sample_items, "shipping_address": shipping_address, "coupon_code": "FORGED10",
        }, timeout=20)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["id"].startswith("order_MOCK")
        assert d["currency"] == "INR"
        assert d["is_mock"] is True
        t = d["totals"]
        # 2 * price; price >= 999 so subtotal >= 1998
        assert t["subtotal"] > 0
        assert t["discount"] > 0  # FORGED10 applied
        # amount in paise
        assert d["amount"] == int(round(t["total"] * 100))

    def test_verify_mock_creates_order(self, sample_items, shipping_address):
        r = requests.post(f"{API}/payments/verify", json={
            "razorpay_order_id": "order_MOCK123", "razorpay_payment_id": "pay_MOCK456",
            "razorpay_signature": "mock_signature",
            "items": sample_items, "shipping_address": shipping_address, "coupon_code": "FORGED10",
        }, timeout=20)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["order_number"].startswith("OC")
        assert isinstance(d["tracking_steps"], list) and len(d["tracking_steps"]) == 5
        assert d["payment_status"] == "paid"
        # GET to verify persisted
        g = requests.get(f"{API}/orders/track/{d['order_number']}", timeout=20)
        assert g.status_code == 200
        assert g.json()["order_number"] == d["order_number"]

    def test_verify_rejects_empty_payment_id(self, sample_items, shipping_address):
        r = requests.post(f"{API}/payments/verify", json={
            "razorpay_order_id": "order_x", "razorpay_payment_id": "",
            "razorpay_signature": "x", "items": sample_items, "shipping_address": shipping_address,
        }, timeout=20)
        assert r.status_code == 400

    def test_webhook_mock_accepts(self):
        r = requests.post(f"{API}/payments/webhook", json={"event": "payment.captured", "payload": {}}, timeout=20)
        assert r.status_code == 200
        assert r.json() == {"ok": True}


# ---------- Uploads ----------
class TestUploads:
    def test_signature_admin_mock(self, admin_token):
        r = requests.get(f"{API}/uploads/signature?folder=products/",
                         headers={"Authorization": f"Bearer {admin_token}"}, timeout=20)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["is_mock"] is True
        assert d["cloud_name"] == "mock"
        assert "signature" in d and "timestamp" in d
        assert d["folder"] == "products/"

    def test_signature_invalid_folder(self, admin_token):
        r = requests.get(f"{API}/uploads/signature?folder=invalid/",
                         headers={"Authorization": f"Bearer {admin_token}"}, timeout=20)
        assert r.status_code == 400

    def test_signature_requires_admin(self, user_token):
        r = requests.get(f"{API}/uploads/signature?folder=products/",
                         headers={"Authorization": f"Bearer {user_token}"}, timeout=20)
        assert r.status_code in (401, 403)

    def test_signature_no_auth(self):
        r = requests.get(f"{API}/uploads/signature?folder=products/", timeout=20)
        assert r.status_code in (401, 403)


# ---------- Admin Products CRUD ----------
class TestAdminProducts:
    def test_create_product(self, admin_token):
        slug = "test-iter2-product"
        # cleanup before
        requests.delete(f"{API}/admin/products/{slug}",
                        headers={"Authorization": f"Bearer {admin_token}"}, timeout=20)
        payload = {
            "name": "Iter2 Test Tee", "slug": slug, "category": "tshirts",
            "collection": "forged", "price": 1499, "compare_at_price": 1999,
            "description": "test description", "images": ["https://picsum.photos/seed/iter2/600/800"],
            "sizes": ["S", "M", "L"], "stock": 25, "rating": 5.0,
        }
        r = requests.post(f"{API}/admin/products", json=payload,
                          headers={"Authorization": f"Bearer {admin_token}"}, timeout=20)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["slug"] == slug
        # appears in list
        l = requests.get(f"{API}/products?q=Iter2", timeout=20).json()
        assert any(p["slug"] == slug for p in l)

    def test_update_product(self, admin_token):
        # Pick the first existing product
        prods = requests.get(f"{API}/products", timeout=20).json()
        slug = prods[0]["slug"]
        r = requests.patch(f"{API}/admin/products/{slug}", json={"price": 1599, "stock": 77},
                           headers={"Authorization": f"Bearer {admin_token}"}, timeout=20)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d is not None, f"PATCH returned null for slug={slug}"
        assert d["price"] == 1599
        assert d["stock"] == 77
        g = requests.get(f"{API}/products/{slug}", timeout=20)
        assert g.json()["product"]["price"] == 1599


# ---------- Regression ----------
class TestRegression:
    def test_health(self):
        r = requests.get(f"{API}/", timeout=20)
        assert r.status_code == 200 and r.json()["ok"] is True

    def test_products_list(self):
        r = requests.get(f"{API}/products", timeout=20)
        assert r.status_code == 200
        assert len(r.json()) >= 12

    def test_auth_forgot_mock_returns_demo_otp(self):
        r = requests.post(f"{API}/auth/forgot", json={"email": ADMIN_EMAIL}, timeout=20)
        assert r.status_code == 200
        assert "demo_otp" in r.json()  # mock mode

    def test_coupon_check(self):
        r = requests.post(f"{API}/coupons/check", json={"code": "FORGED10", "subtotal": 1500}, timeout=20)
        assert r.status_code == 200

    def test_legacy_orders(self, sample_items, shipping_address):
        r = requests.post(f"{API}/orders", json={
            "items": sample_items, "shipping_address": shipping_address, "coupon_code": "FORGED10",
        }, timeout=20)
        assert r.status_code == 200
        assert r.json()["payment_id"].startswith("pay_MOCK")

    def test_admin_stats(self, admin_token):
        r = requests.get(f"{API}/admin/stats", headers={"Authorization": f"Bearer {admin_token}"}, timeout=20)
        assert r.status_code == 200 and "total_orders" in r.json()

    def test_admin_orders(self, admin_token):
        r = requests.get(f"{API}/admin/orders", headers={"Authorization": f"Bearer {admin_token}"}, timeout=20)
        assert r.status_code == 200

    def test_admin_customers(self, admin_token):
        r = requests.get(f"{API}/admin/customers", headers={"Authorization": f"Bearer {admin_token}"}, timeout=20)
        assert r.status_code == 200

    def test_newsletter(self):
        r = requests.post(f"{API}/newsletter", json={"email": "TEST_iter2_news@example.com"}, timeout=20)
        assert r.status_code == 200

    def test_contact(self):
        r = requests.post(f"{API}/contact", json={"name": "T", "email": "t@x.com", "message": "hi"}, timeout=20)
        assert r.status_code == 200
