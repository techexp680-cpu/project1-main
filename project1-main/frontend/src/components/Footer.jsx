import { Link } from "react-router-dom";
import {
  Instagram,
  Send,
  MessageCircle,
  ShieldCheck,
  Truck,
  RotateCcw,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Footer() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();

    const cleanEmail = email.trim();

    if (!cleanEmail) {
      toast.error("Please enter your email.");
      return;
    }

    try {
      setBusy(true);

      const response = await fetch(
        "http://localhost:8000/api/newsletter",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email: cleanEmail }),
        }
      );

      if (!response.ok) {
        throw new Error("Newsletter failed");
      }

      toast.success("Welcome to the squad.");
      setEmail("");
    } catch {
      toast.error("Could not subscribe. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <footer
      className="bg-ink-900 border-t border-white/10 mt-24"
      data-testid="site-footer"
    >
      {/* TRUST FEATURES */}
      <div className="container-oc py-10 grid md:grid-cols-3 gap-4 border-b border-white/10">

        <div className="card-oc p-5 flex gap-4 items-start">
          <Truck className="text-gold shrink-0" size={22} />

          <div>
            <div className="label-tiny text-white">
              Fast Shipping
            </div>

            <p className="text-neutral-500 text-sm mt-1">
              Free shipping on orders above ₹1999.
            </p>
          </div>
        </div>

        <div className="card-oc p-5 flex gap-4 items-start">
          <RotateCcw className="text-gold shrink-0" size={22} />

          <div>
            <div className="label-tiny text-white">
              Easy Support
            </div>

            <p className="text-neutral-500 text-sm mt-1">
              Contact support for size, order, and return help.
            </p>
          </div>
        </div>

        <div className="card-oc p-5 flex gap-4 items-start">
          <ShieldCheck className="text-gold shrink-0" size={22} />

          <div>
            <div className="label-tiny text-white">
              Secure Checkout
            </div>

            <p className="text-neutral-500 text-sm mt-1">
              Razorpay payment integration ready for live mode.
            </p>
          </div>
        </div>

      </div>

      {/* FOOTER CONTENT */}
      <div className="container-oc py-16 grid md:grid-cols-12 gap-10">

        {/* BRAND + NEWSLETTER */}
        <div className="md:col-span-4">

          <Link to="/" className="display text-3xl block">
            OPERATOR<span className="text-gold">'</span>S CHOICE
          </Link>

          <p className="text-neutral-400 mt-3 max-w-sm">
            Premium tactical streetwear, forged for those who refuse to back
            down. Made in India. Built for the world.
          </p>

          <form
            onSubmit={submit}
            className="mt-6 flex"
            data-testid="newsletter-form"
          >
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              required
              placeholder="ENTER EMAIL"
              className="input-oc tracking-widest flex-1"
              data-testid="newsletter-input"
            />

            <button
              disabled={busy}
              className="px-5 bg-gold text-black hover:bg-white transition-colors disabled:opacity-60"
              data-testid="newsletter-submit"
              aria-label="Subscribe"
            >
              <Send size={18} />
            </button>
          </form>

          <p className="text-[11px] text-neutral-600 mt-3">
            Join for Mission Board updates, restocks, and exclusive Operator
            updates.
          </p>

        </div>

        {/* SHOP */}
        <div className="md:col-span-2">

          <h4 className="label-tiny text-gold mb-4">
            Shop
          </h4>

          <ul className="space-y-2 text-sm text-neutral-300">

            <li>
              <Link
                to="/shop"
                className="hover:text-gold"
              >
                All Products
              </Link>
            </li>

            <li>
              <Link
                to="/best-sellers"
                className="hover:text-gold"
              >
                Best Sellers
              </Link>
            </li>

            <li>
              <Link
                to="/mission-board"
                className="hover:text-gold"
              >
                Mission Board
              </Link>
            </li>

            <li>
              <Link
                to="/operator-journal"
                className="hover:text-gold"
              >
                Operator Journal
              </Link>
            </li>

            <li>
              <Link
                to="/shop?category=tees"
                className="hover:text-gold"
              >
                T-Shirts
              </Link>
            </li>

          </ul>
        </div>

        {/* ACCOUNT */}
        <div className="md:col-span-2">

          <h4 className="label-tiny text-gold mb-4">
            Account
          </h4>

          <ul className="space-y-2 text-sm text-neutral-300">

            <li>
              <Link
                to="/login?mode=signup"
                className="hover:text-gold"
              >
                Sign In
              </Link>
            </li>

            <li>
              <Link
                to="/login?mode=login"
                className="hover:text-gold"
              >
                Login
              </Link>
            </li>

            <li>
              <Link
                to="/account"
                className="hover:text-gold"
              >
                My Account
              </Link>
            </li>

            <li>
              <Link
                to="/account/orders"
                className="hover:text-gold"
              >
                My Orders
              </Link>
            </li>

            <li>
              <Link
                to="/account/wishlist"
                className="hover:text-gold"
              >
                Wishlist
              </Link>
            </li>

          </ul>
        </div>

        {/* SUPPORT */}
        <div className="md:col-span-2">

          <h4 className="label-tiny text-gold mb-4">
            Support
          </h4>

          <ul className="space-y-2 text-sm text-neutral-300">

            <li>
              <Link
                to="/track"
                className="hover:text-gold"
              >
                Track Order
              </Link>
            </li>

            <li>
              <Link
                to="/contact"
                className="hover:text-gold"
              >
                Contact
              </Link>
            </li>

            <li>
              <Link
                to="/about"
                className="hover:text-gold"
              >
                About Us
              </Link>
            </li>

            <li>
              <Link
                to="/contact"
                className="hover:text-gold"
              >
                Shipping Help
              </Link>
            </li>

            <li>
              <Link
                to="/contact"
                className="hover:text-gold"
              >
                Returns Help
              </Link>
            </li>

          </ul>
        </div>

        {/* FOLLOW */}
        <div className="md:col-span-2">

          <h4 className="label-tiny text-gold mb-4">
            Follow
          </h4>

          <a
            href="https://instagram.com"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 hover:text-gold text-sm text-neutral-300"
            data-testid="instagram-link"
          >
            <Instagram size={18} />
            @operatorschoice
          </a>

          <a
            href="https://wa.me/919999999999"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 mt-3 hover:text-gold text-sm text-neutral-300"
            data-testid="whatsapp-link"
          >
            <MessageCircle size={18} />
            WhatsApp Support
          </a>

          <p className="text-[11px] text-neutral-600 mt-4">
            Replace Instagram and WhatsApp links with your real brand details
            before launch.
          </p>

        </div>

      </div>

      {/* COPYRIGHT */}
      <div className="border-t border-white/10 py-6 container-oc flex flex-col md:flex-row justify-between gap-3 text-xs text-neutral-500">

        <div>
          © {new Date().getFullYear()} Operator&apos;s Choice. All rights
          reserved.
        </div>

        <div className="mono tracking-widest">
          FORGED FOR THE FEARLESS
        </div>

      </div>
    </footer>
  );
}