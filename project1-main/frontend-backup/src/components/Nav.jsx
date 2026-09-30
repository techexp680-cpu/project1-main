import { Link, NavLink, useNavigate } from "react-router-dom";
import { Search, Heart, ShoppingBag, User, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useStore } from "../lib/store";

const mainLinks = [
  { to: "/", label: "Home" },
  { to: "/shop", label: "Products" },
  { to: "/best-sellers", label: "Best Sellers" },
  { to: "/new-drop", label: "New Drop" },
  { to: "/collections", label: "Collections" },
];

const shopLinks = [
  { to: "/shop", label: "All Products" },
  { to: "/best-sellers", label: "Best Sellers" },
  { to: "/new-drop", label: "New Drop" },
  { to: "/collections", label: "Collections" },
  { to: "/track-order", label: "Track Order" },
];

const infoLinks = [
  { to: "/about", label: "About Us" },
  { to: "/contact", label: "Contact" },
];

export default function Nav() {
  const { itemCount, setCartOpen, user } = useStore();

  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [q, setQ] = useState("");

  const nav = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("oc_token");
    const loginTime = localStorage.getItem("oc_login_time");

    if (token && loginTime) {
      const now = Date.now();
      const savedTime = Number(loginTime);
      const twentyFourHours = 24 * 60 * 60 * 1000;

      if (now - savedTime > twentyFourHours) {
        localStorage.removeItem("oc_token");
        localStorage.removeItem("oc_user");
        localStorage.removeItem("oc_login_time");
        window.location.href = "/login";
      }
    }
  }, []);

  const onSearch = (e) => {
    e.preventDefault();

    if (q.trim()) {
      nav(`/shop?q=${encodeURIComponent(q.trim())}`);
      setSearchOpen(false);
      setOpen(false);
    }
  };

  return (
    <>
      <div
        className="bg-olive text-white py-2 text-[10px] md:text-xs tracking-[0.3em] uppercase text-center font-medium border-b border-white/10"
        data-testid="announce-bar"
      >
        Free shipping over ₹1999 · XIII Kargil Drop live now · Forged for the Fearless
      </div>

      <header
        className="sticky top-0 z-50 bg-ink-900/80 backdrop-blur-xl border-b border-white/10"
        data-testid="main-nav"
      >
        <div className="container-oc flex items-center justify-between h-16 md:h-20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setOpen(true)}
              className="text-white p-2 hover:text-gold"
              data-testid="menu-open"
            >
              <Menu size={24} />
            </button>

            <Link
              to="/"
              className="display text-2xl md:text-3xl tracking-wider text-white whitespace-nowrap"
              data-testid="logo"
            >
              OPERATOR<span className="text-gold">'</span>S CHOICE
            </Link>
          </div>

          <nav className="hidden lg:flex items-center gap-7">
            {mainLinks.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.to === "/"}
                className={({ isActive }) =>
                  `text-[11px] tracking-[0.2em] uppercase font-semibold transition-colors ${
                    isActive ? "text-gold" : "text-white/80 hover:text-white"
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-1 md:gap-3 text-white">
            <button
              onClick={() => setSearchOpen((s) => !s)}
              className="p-2 hover:text-gold"
              data-testid="search-toggle"
            >
              <Search size={18} />
            </button>

            <Link
              to={user ? "/account/wishlist" : "/login"}
              className="p-2 hover:text-gold hidden sm:inline-flex"
              data-testid="wishlist-link"
            >
              <Heart size={18} />
            </Link>

            <Link
              to={user ? "/account" : "/login"}
              className="p-2 hover:text-gold hidden sm:inline-flex"
              data-testid="profile-link"
              title={user ? "Account" : "Sign In / Login"}
            >
              <User size={18} />
            </Link>

            <button
              onClick={() => setCartOpen(true)}
              className="relative p-2 hover:text-gold"
              data-testid="cart-toggle"
            >
              <ShoppingBag size={18} />

              {itemCount > 0 && (
                <span
                  className="absolute -top-0 -right-0 bg-gold text-black text-[10px] mono font-bold w-4 h-4 flex items-center justify-center"
                  data-testid="cart-count"
                >
                  {itemCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {searchOpen && (
          <form
            onSubmit={onSearch}
            className="container-oc pb-4"
            data-testid="search-form"
          >
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="SEARCH FOR PRODUCTS, COLLECTIONS, DROPS..."
              className="input-oc tracking-widest"
              data-testid="search-input"
            />
          </form>
        )}
      </header>

      {open && (
        <div className="fixed inset-0 z-[60]" data-testid="side-menu">
          <div
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/70"
          />

          <div className="relative bg-ink-900 h-full w-[86%] max-w-[380px] border-r border-white/10 overflow-y-auto">
            <div className="flex justify-between items-center px-5 py-4 border-b border-white/10 sticky top-0 bg-ink-900 z-10">
              <div>
                <p className="display text-xl text-white">MENU</p>
                <p className="text-[10px] tracking-[0.25em] uppercase text-neutral-500">
                  Operator&apos;s Choice
                </p>
              </div>

              <button
                onClick={() => setOpen(false)}
                className="p-2 text-white hover:text-gold"
                data-testid="menu-close"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-5 space-y-7">
              {!user ? (
                <div>
                  <p className="label-tiny text-gold mb-3">ACCOUNT</p>

                  <div className="grid grid-cols-2 gap-3">
                    <NavLink
                      to="/login"
                      onClick={() => setOpen(false)}
                      className="border border-white/10 bg-white/5 p-3 text-center text-xs tracking-[0.2em] uppercase hover:border-gold hover:text-gold"
                    >
                      Sign In
                    </NavLink>

                    <NavLink
                      to="/login"
                      onClick={() => setOpen(false)}
                      className="border border-white/10 bg-white/5 p-3 text-center text-xs tracking-[0.2em] uppercase hover:border-gold hover:text-gold"
                    >
                      Login
                    </NavLink>
                  </div>

                  <p className="text-[11px] text-neutral-500 mt-3">
                    Sign In for new members . Login for loyal ones.
                  </p>
                </div>
              ) : (
                <div>
                  <p className="label-tiny text-gold mb-3">ACCOUNT</p>

                  <div className="grid grid-cols-2 gap-3">
                    <NavLink
                      to="/account"
                      onClick={() => setOpen(false)}
                      className="border border-white/10 bg-white/5 p-3 text-center text-xs tracking-[0.2em] uppercase hover:border-gold hover:text-gold"
                    >
                      My Account
                    </NavLink>

                    <NavLink
                      to="/account/wishlist"
                      onClick={() => setOpen(false)}
                      className="border border-white/10 bg-white/5 p-3 text-center text-xs tracking-[0.2em] uppercase hover:border-gold hover:text-gold"
                    >
                      Wishlist
                    </NavLink>
                  </div>
                </div>
              )}

              <div>
                <p className="label-tiny text-gold mb-3">SHOP</p>

                <div className="grid grid-cols-2 gap-3">
                  {shopLinks.map((l) => (
                    <NavLink
                      key={l.to}
                      to={l.to}
                      onClick={() => setOpen(false)}
                      className="border border-white/10 bg-white/5 p-3 text-center text-xs tracking-[0.17em] uppercase hover:border-gold hover:text-gold"
                    >
                      {l.label}
                    </NavLink>
                  ))}

                  <button
                    onClick={() => {
                      setCartOpen(true);
                      setOpen(false);
                    }}
                    className="border border-white/10 bg-white/5 p-3 text-center text-xs tracking-[0.17em] uppercase hover:border-gold hover:text-gold"
                  >
                    Cart
                  </button>
                </div>
              </div>

              <div>
                <p className="label-tiny text-gold mb-3">HELP & INFO</p>

                <div className="grid grid-cols-2 gap-3">
                  {infoLinks.map((l) => (
                    <NavLink
                      key={l.to}
                      to={l.to}
                      onClick={() => setOpen(false)}
                      className="border border-white/10 bg-white/5 p-3 text-center text-xs tracking-[0.17em] uppercase hover:border-gold hover:text-gold"
                    >
                      {l.label}
                    </NavLink>
                  ))}

                  <NavLink
                    to="/contact"
                    onClick={() => setOpen(false)}
                    className="border border-white/10 bg-white/5 p-3 text-center text-xs tracking-[0.17em] uppercase hover:border-gold hover:text-gold"
                  >
                    Support
                  </NavLink>

                  <NavLink
                    to="/track-order"
                    onClick={() => setOpen(false)}
                    className="border border-white/10 bg-white/5 p-3 text-center text-xs tracking-[0.17em] uppercase hover:border-gold hover:text-gold"
                  >
                    My Order
                  </NavLink>
                </div>
              </div>

              <div className="border-t border-white/10 pt-5">
                <form onSubmit={onSearch}>
                  <p className="label-tiny text-gold mb-3">QUICK SEARCH</p>

                  <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Search products..."
                    className="w-full bg-black border border-white/20 px-4 py-3 text-sm text-white outline-none focus:border-gold"
                  />

                  <button
                    type="submit"
                    className="w-full mt-3 bg-gold text-black py-3 text-xs tracking-[0.2em] uppercase font-bold"
                  >
                    Search
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}