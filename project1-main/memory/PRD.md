# Operator's Choice — Product Requirements Doc

## Original Problem Statement
Build **Operator's Choice** — a premium, military-inspired tactical streetwear e-commerce site.
Tagline: *Forged for the Fearless*. Combines Nike/Gymshark/Zara feel with tactical brand DNA.
Color: Matte black + charcoal grey (primary), olive + khaki (secondary), white + metallic gold (accents).
Typography: Bebas Neue (display) + Manrope (body) + JetBrains Mono (specs).

## User Choices
- Tech stack: FastAPI + React + MongoDB
- Payment: Razorpay (MOCKED for V1)
- Auth: JWT email/password + Emergent Google login (mocked Google)
- Image storage: Cloudinary (MOCKED — using curated Unsplash/Pexels URLs)
- Scope: Full storefront + admin + mocked email/OTP

## User Personas
- Military enthusiasts, fitness/streetwear lovers, motorcycle riders, ages 18–35
- Admin: store operator managing inventory, orders, customers

## Architecture
- **Backend:** FastAPI under `/api/*`, JWT auth via `Authorization: Bearer`. MongoDB via Motor.
  Collections: `users`, `products`, `orders`, `coupons`, `newsletter`, `contact`.
- **Frontend:** React 19 + React Router 7 + Tailwind + Shadcn + sonner + lucide-react + framer-motion. Dark mode native.
- **State:** `StoreProvider` (auth + cart persisted to localStorage).

## What's Been Implemented (Feb 2026 — V1)
- ✅ Cinematic hero, sticky glass nav, scrolling marquee, collections bento
- ✅ Shop with filters (category/size/price) + sorting + search
- ✅ Product detail: gallery, zoom, size/color, qty, stock, badges, drop countdown, reviews, similar
- ✅ Sliding cart + full cart page with coupons (FORGED10 / OPERATOR20 / FREESHIP)
- ✅ Checkout (multi-section form) → MOCKED Razorpay flow → Order success page
- ✅ Order tracking page with live tracking steps
- ✅ User: register, login, JWT, mocked Google login, forgot/reset with OTP, profile, wishlist, orders
- ✅ Admin Command Center: stats overview (revenue, orders, users, products), orders w/ status update, products list w/ delete, customers list
- ✅ Contact page (form + WhatsApp/Insta/email/hours), About page, Footer with newsletter subscription
- ✅ Seeded data: 12 premium products across 5 collections (Kargil, Operator, Fearless, Bravest, Patriot), 3 coupons
- ✅ Math validated: subtotal → discount → free shipping over ₹1999 → 5% GST → total
- ✅ All data-testid attributes for QA automation

## Auto-seeded credentials
- Admin: `admin@operatorschoice.com` / `Operator@2026`

## Mocked Integrations (to swap for production)
- **Razorpay** — `/api/orders` currently auto-marks `payment_status: paid` after a 1.2s frontend delay. Plug `razorpay.Client.order.create` + signature verification when keys are added.
- **Cloudinary** — product images are stock URLs. Add admin upload UI calling Cloudinary unsigned/signed upload when keys are configured.
- **Emergent Google Auth** — `/api/auth/google` accepts any name+email. Replace with real Google token verification.
- **Email/OTP** — `/api/auth/forgot` returns `demo_otp` in response. Swap for SMTP/SendGrid.

## Prioritized Backlog
- **P0 (post-V1):** Wire real Razorpay (Orders API + signature verify), real Cloudinary upload, real Email + OTP
- **P1:** Admin product CREATE/EDIT form UI (backend endpoints already exist), invoice PDF download, recently viewed
- **P1:** Real Emergent Google login token verification, password reset email template
- **P2:** PWA + push notifications, product recommendations engine, advanced analytics charts, multi-currency
- **P2:** Image zoom modal on PDP, "save for later" in cart, address book CRUD UI
