import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Heart,
  LogOut,
  MapPinned,
  Package,
  Shield,
  ShoppingBag,
} from "lucide-react";

import { useStore } from "../lib/store";
import ProductCard from "../components/ProductCard";

const API_BASE = "http://localhost:8000/api";

function money(value) {
  return "₹" + Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  });
}

async function apiRequest(path) {
  const token = localStorage.getItem("oc_token");

  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  const text = await response.text();

  let data = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new Error(data?.detail || data?.message || "Request failed");
  }

  return data;
}

export function Account() {
  const { user, logout } = useStore();
  const navigate = useNavigate();

  if (!user) {
    return <Navigate to="/login?mode=login" />;
  }

  const firstName = (user.name || user.username || "Operator")
    .split(" ")[0]
    .toUpperCase();

  return (
    <div className="min-h-screen bg-black text-white">
      <section
        className="container-oc py-12 max-w-6xl"
        data-testid="account-page"
      >
        <div className="border border-white/10 bg-white/[0.03] p-6 md:p-8 mb-8">
          <p className="label-tiny text-gold mb-3">ACCOUNT CENTER</p>

          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5">
            <div>
              <h1 className="display text-5xl md:text-7xl">
                HELLO, {firstName}
              </h1>

              <p className="text-neutral-400 text-sm mt-2">
                {user.email || user.phone || user.username}
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                logout();
                navigate("/");
              }}
              className="btn-outline w-fit"
              data-testid="logout-btn"
            >
              <LogOut size={16} className="mr-2" />
              SIGN OUT
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          <AccountTile
            to="/account/orders"
            icon={<Package size={24} />}
            title="Orders"
            subtitle="View your shopping history and order status"
          />

          <AccountTile
            to="/account/wishlist"
            icon={<Heart size={24} />}
            title="Wishlist"
            subtitle="Your saved products and future buys"
          />

          <AccountTile
            to="/track"
            icon={<MapPinned size={24} />}
            title="Track Order"
            subtitle="Track any order using order number"
          />

          <AccountTile
            to="/shop"
            icon={<ShoppingBag size={24} />}
            title="Continue Shopping"
            subtitle="Browse T-Shirts, Hoodies and latest drops"
          />

          {user.is_admin && (
            <AccountTile
              to="/admin"
              icon={<Shield size={24} />}
              title="Admin Dashboard"
              subtitle="Manage products, orders and store data"
            />
          )}
        </div>
      </section>
    </div>
  );
}

function AccountTile({ to, icon, title, subtitle }) {
  return (
    <Link
      to={to}
      className="group border border-white/10 bg-white/[0.03] p-6 hover:border-gold transition-all duration-300 hover:-translate-y-1"
    >
      <div className="w-12 h-12 border border-white/10 flex items-center justify-center text-gold mb-5 group-hover:border-gold">
        {icon}
      </div>

      <div className="display text-2xl group-hover:text-gold transition-colors">
        {title}
      </div>

      <div className="text-neutral-400 text-sm mt-1 leading-relaxed">
        {subtitle}
      </div>
    </Link>
  );
}

export function Orders() {
  const { user, logout } = useStore();
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!user) return;

    async function loadOrders() {
      try {
        setLoading(true);
        setErr("");

        const data = await apiRequest("/orders/mine");
        setOrders(Array.isArray(data) ? data : []);
      } catch (error) {
        setErr(error.message || "Could not load orders.");
      } finally {
        setLoading(false);
      }
    }

    loadOrders();
  }, [user]);

  if (!user) {
    return <Navigate to="/login?mode=login" />;
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <section
        className="container-oc py-12 max-w-5xl"
        data-testid="orders-page"
      >
        <div className="flex items-center justify-between gap-4 mb-8">
          <div>
            <p className="label-tiny text-gold mb-3">SHOPPING HISTORY</p>
            <h1 className="display text-5xl md:text-6xl">MY ORDERS</h1>
          </div>

          <Link to="/account" className="btn-outline">
            <ArrowLeft size={16} className="mr-2" />
            BACK
          </Link>
        </div>

        {loading && (
          <div className="border border-white/10 bg-white/[0.03] p-6 text-neutral-400">
            Loading your orders...
          </div>
        )}

        {!loading && err && (
          <div className="border border-white/10 bg-white/[0.03] p-6">
            <p className="text-red-400 mb-4">{err}</p>

            <button
              type="button"
              onClick={() => {
                logout();
                navigate("/login?mode=login");
              }}
              className="btn-primary"
            >
              LOGIN AGAIN
            </button>
          </div>
        )}

        {!loading && !err && orders.length === 0 && (
          <div className="border border-white/10 bg-white/[0.03] p-8">
            <p className="display text-3xl mb-3">NO ORDERS YET</p>

            <p className="text-neutral-400 mb-4">
              Your account has no saved orders yet.
            </p>

            <p className="text-neutral-500 text-sm mb-6">
              Orders placed before login may only appear through Track Order
              using your order number.
            </p>

            <div className="flex flex-wrap gap-3">
              <Link to="/shop" className="btn-primary">
                SHOP NOW
              </Link>

              <Link to="/track" className="btn-outline">
                TRACK ORDER
              </Link>
            </div>
          </div>
        )}

        {!loading && !err && orders.length > 0 && (
          <div className="space-y-4">
            {orders.map((order) => (
              <Link
                key={order.id || order.order_number}
                to={`/track?order=${order.order_number}`}
                className="border border-white/10 bg-white/[0.03] p-5 flex flex-col md:flex-row justify-between gap-4 hover:border-gold transition-all duration-300"
                data-testid={`order-${order.order_number}`}
              >
                <div>
                  <div className="mono text-gold text-lg">
                    {order.order_number}
                  </div>

                  <div className="text-xs text-neutral-500 mt-1">
                    {order.created_at
                      ? new Date(order.created_at).toLocaleString()
                      : "Date not available"}
                  </div>

                  <div className="text-sm text-neutral-400 mt-3">
                    {(order.items || []).length} item(s)
                  </div>
                </div>

                <div className="flex md:flex-col items-start md:items-end gap-2">
                  <div className="label-tiny uppercase text-white">
                    {(order.status || "placed").replace(/_/g, " ")}
                  </div>

                  <div className="mono text-gold">{money(order.total)}</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export function Wishlist() {
  const { user, wishlist } = useStore();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!user) return;

    async function loadWishlist() {
      try {
        setLoading(true);
        setErr("");

        if (!wishlist || wishlist.length === 0) {
          setItems([]);
          return;
        }

        const products = await apiRequest("/products");

        setItems(
          products.filter((product) => wishlist.includes(product.id))
        );
      } catch (error) {
        setErr(error.message || "Could not load wishlist.");
      } finally {
        setLoading(false);
      }
    }

    loadWishlist();
  }, [user, wishlist]);

  if (!user) {
    return <Navigate to="/login?mode=login" />;
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <section className="container-oc py-12" data-testid="wishlist-page">
        <div className="flex items-center justify-between gap-4 mb-8">
          <div>
            <p className="label-tiny text-gold mb-3">SAVED PRODUCTS</p>
            <h1 className="display text-5xl md:text-6xl">WISHLIST</h1>
          </div>

          <Link to="/account" className="btn-outline">
            <ArrowLeft size={16} className="mr-2" />
            BACK
          </Link>
        </div>

        {loading && (
          <div className="border border-white/10 bg-white/[0.03] p-6 text-neutral-400">
            Loading wishlist...
          </div>
        )}

        {!loading && err && (
          <div className="border border-white/10 bg-white/[0.03] p-6 text-red-400">
            {err}
          </div>
        )}

        {!loading && !err && items.length === 0 && (
          <div className="border border-white/10 bg-white/[0.03] p-8">
            <p className="display text-3xl mb-3">NOTHING SAVED YET</p>

            <p className="text-neutral-400 mb-6">
              Save your favourite T-Shirts and Hoodies by tapping the heart
              icon.
            </p>

            <Link to="/shop" className="btn-primary">
              SHOP PRODUCTS
            </Link>
          </div>
        )}

        {!loading && !err && items.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {items.map((product) => (
              <ProductCard key={product.id} p={product} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
