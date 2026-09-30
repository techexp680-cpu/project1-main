import { Link, NavLink, useNavigate } from "react-router-dom";
import { Search, Heart, ShoppingBag, User, Menu, X } from "lucide-react";
import { useState } from "react";
import { useStore } from "../lib/store";

const mainLinks = [
  { to: "/", label: "Home" },
  { to: "/shop", label: "Products" },
  { to: "/best-sellers", label: "Best Sellers" },
  { to: "/mission-board", label: "Mission Board" },
  { to: "/operator-journal", label: "Operator Journal" },
];

const shopLinks = [
  { to: "/shop", label: "All Products" },
  { to: "/best-sellers", label: "Best Sellers" },
  { to: "/mission-board", label: "Mission Board" },
  { to: "/operator-journal", label: "Operator Journal" },
  { to: "/track", label: "Track Order" },
];

const infoLinks = [
  { to: "/about", label: "About Us" },
  { to: "/contact", label: "Contact" },
  { to: "/contact", label: "Support" },
  { to: "/track", label: "My Order" },
];

export default function Nav() {
  const { itemCount, setCartOpen, user } = useStore();

  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [q, setQ] = useState("");

  const nav = useNavigate();

  const onSearch = (e) => {
    e.preventDefault();

    if (q.trim()) {
      nav(`/shop?q=${encodeURIComponent(q.trim())}`);
      setSearchOpen(false);
      setOpen(false);
    }
  };

  const closeMenu = () => setOpen(false);

  return (
    <>
      {/* Announcement Bar */}
      <div
        className="bg-olive text-white py-2 text-[10px] md:text-xs tracking-[0.3em] uppercase text-center font-medium border-b border-white/10"
        data-testid="announce-bar"
      >
        Free shipping over ₹1999 · XIII Kargil Drop live now · Forged for the Fearless
      </div>

      {/* Main Header */}
      <header
        className="sticky top-0 z-50 bg-ink-900/80 backdrop-blur-xl border-b border-white/10"
        data-testid="main-nav"
      >
        <div className="container-oc flex items-center justify-between h-16 md:h-20">
          {/* Logo + Menu */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setOpen(true)}
              className="text-white p-2 hover:text-gold transition"
              data-testid="menu-open"
              aria-label="Open menu"
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

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-7">
            {mainLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === "/"}
                className={({ isActive }) =>
                  `text-[11px] tracking-[0.2em] uppercase font-semibold transition-colors ${
                    isActive
                      ? "text-gold"
                      : "text-white/80 hover:text-white"
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          {/* Header Actions */}
          <div className="flex items-center gap-1 md:gap-3 text-white">
            {/* Search */}
            <button
              onClick={() => setSearchOpen((current) => !current)}
              className="p-2 hover:text-gold transition"
              data-testid="search-toggle"
              aria-label="Search"
            >
              <Search size={18} />
            </button>

            {/* Wishlist */}
            <Link
              to={user ? "/account/wishlist" : "/login?mode=login"}
              className="p-2 hover:text-gold hidden sm:inline-flex transition"
              data-testid="wishlist-link"
              aria-label="Wishlist"
            >
              <Heart size={18} />
            </Link>

            {/* Account */}
            <Link
              to={user ? "/account" : "/login?mode=login"}
              className="p-2 hover:text-gold hidden sm:inline-flex transition"
              data-testid="profile-link"
              title={user ? "Account" : "Login"}
              aria-label="Account"
            >
              <User size={18} />
            </Link>

            {/* Cart */}
            <button
              onClick={() => setCartOpen(true)}
              className="relative p-2 hover:text-gold transition"
              data-testid="cart-toggle"
              aria-label="Cart"
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

        {/* Desktop Search */}
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
              placeholder="SEARCH PRODUCTS, MISSIONS, JOURNAL..."
              className="input-oc tracking-widest"
              data-testid="search-input"
            />
          </form>
        )}
      </header>

      {/* Mobile / Side Menu */}
      {open && (
        <div className="fixed inset-0 z-[60]" data-testid="side-menu">
          {/* Background Overlay */}
          <div
            onClick={closeMenu}
            className="absolute inset-0 bg-black/75"
          />

          {/* Side Panel */}
          <div className="relative bg-ink-900 h-full w-[88%] max-w-[390px] border-r border-white/10 overflow-y-auto shadow-2xl">
            {/* Menu Header */}
            <div className="flex justify-between items-center px-5 py-4 border-b border-white/10 sticky top-0 bg-ink-900 z-10">
              <div>
                <p className="display text-xl text-white">MENU</p>

                <p className="text-[10px] tracking-[0.25em] uppercase text-neutral-500">
                  Operator&apos;s Choice
                </p>
              </div>

              <button
                onClick={closeMenu}
                className="p-2 text-white hover:text-gold transition"
                data-testid="menu-close"
                aria-label="Close menu"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-5 space-y-7">
              {/* Account Section */}
              {!user ? (
                <div>
                  <p className="label-tiny text-gold mb-3">ACCOUNT</p>

                  <div className="grid grid-cols-2 gap-3">
                    <NavLink
                      to="/login?mode=signup"
                      onClick={closeMenu}
                      className="border border-white/10 bg-white/5 p-3 text-center text-xs tracking-[0.18em] uppercase hover:border-gold hover:text-gold transition"
                    >
                      Sign In
                    </NavLink>

                    <NavLink
                      to="/login?mode=login"
                      onClick={closeMenu}
                      className="border border-white/10 bg-white/5 p-3 text-center text-xs tracking-[0.18em] uppercase hover:border-gold hover:text-gold transition"
                    >
                      Login
                    </NavLink>
                  </div>

                  <p className="text-[11px] text-neutral-500 mt-3 leading-relaxed">
                    Sign In for new customers. Login for existing customers to
                    access orders and wishlist.
                  </p>
                </div>
              ) : (
                <div>
                  <p className="label-tiny text-gold mb-3">ACCOUNT</p>

                  <div className="grid grid-cols-2 gap-3">
                    <NavLink
                      to="/account"
                      onClick={closeMenu}
                      className="border border-white/10 bg-white/5 p-3 text-center text-xs tracking-[0.18em] uppercase hover:border-gold hover:text-gold transition"
                    >
                      My Account
                    </NavLink>

                    <NavLink
                      to="/account/orders"
                      onClick={closeMenu}
                      className="border border-white/10 bg-white/5 p-3 text-center text-xs tracking-[0.18em] uppercase hover:border-gold hover:text-gold transition"
                    >
                      Orders
                    </NavLink>

                    <NavLink
                      to="/account/wishlist"
                      onClick={closeMenu}
                      className="border border-white/10 bg-white/5 p-3 text-center text-xs tracking-[0.18em] uppercase hover:border-gold hover:text-gold transition"
                    >
                      Wishlist
                    </NavLink>

                    <NavLink
                      to="/track"
                      onClick={closeMenu}
                      className="border border-white/10 bg-white/5 p-3 text-center text-xs tracking-[0.18em] uppercase hover:border-gold hover:text-gold transition"
                    >
                      Track
                    </NavLink>
                  </div>
                </div>
              )}

              {/* Shop Section */}
              <div>
                <p className="label-tiny text-gold mb-3">SHOP</p>

                <div className="grid grid-cols-2 gap-3">
                  {shopLinks.map((link) => (
                    <NavLink
                      key={link.to}
                      to={link.to}
                      onClick={closeMenu}
                      className="border border-white/10 bg-white/5 p-3 text-center text-xs tracking-[0.15em] uppercase hover:border-gold hover:text-gold transition"
                    >
                      {link.label}
                    </NavLink>
                  ))}

                  <button
                    onClick={() => {
                      setCartOpen(true);
                      closeMenu();
                    }}
                    className="border border-white/10 bg-white/5 p-3 text-center text-xs tracking-[0.15em] uppercase hover:border-gold hover:text-gold transition"
                  >
                    Cart
                  </button>
                </div>
              </div>

              {/* Help & Info Section */}
              <div>
                <p className="label-tiny text-gold mb-3">HELP & INFO</p>

                <div className="grid grid-cols-2 gap-3">
                  {infoLinks.map((link, index) => (
                    <NavLink
                      key={`${link.to}-${index}`}
                      to={link.to}
                      onClick={closeMenu}
                      className="border border-white/10 bg-white/5 p-3 text-center text-xs tracking-[0.15em] uppercase hover:border-gold hover:text-gold transition"
                    >
                      {link.label}
                    </NavLink>
                  ))}
                </div>
              </div>

              {/* Quick Search */}
              <div className="border-t border-white/10 pt-5">
                <form onSubmit={onSearch}>
                  <p className="label-tiny text-gold mb-3">
                    QUICK SEARCH
                  </p>

                  <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Search products..."
                    className="w-full bg-black border border-white/20 px-4 py-3 text-sm text-white outline-none focus:border-gold"
                  />

                  <button
                    type="submit"
                    className="w-full mt-3 bg-gold text-black py-3 text-xs tracking-[0.2em] uppercase font-bold hover:bg-white transition"
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