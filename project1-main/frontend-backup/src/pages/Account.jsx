import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useStore } from "../lib/store";

const API_BASE = "http://localhost:8001/api";

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
  const nav = useNavigate();

  if (!user) return <Navigate to="/login?mode=login" />;

  return (
    <div className="container-oc py-12 max-w-4xl" data-testid="account-page">
      <p className="label-tiny text-gold mb-3">ACCOUNT CENTER</p>

      <h1 className="display text-5xl mb-2">
        HELLO, {(user.name || "OPERATOR").split(" ")[0].toUpperCase()}
      </h1>

      <p className="text-neutral-400 text-sm mb-10">
        {user.email || user.phone || user.username}
      </p>

      <div className="grid md:grid-cols-2 gap-4">
        <Tile to="/account/orders" t="Orders" s="View your shopping history and order status" />
        <Tile to="/account/wishlist" t="Wishlist" s="Your saved products" />
        <Tile to="/track" t="Track Order" s="Track any order using order number" />
        <Tile to="/shop" t="Continue Shopping" s="Browse all products" />

        {user.is_admin && (
          <Tile to="/admin" t="Admin Dashboard" s="Manage products and orders" />
        )}
      </div>

      <button
        onClick={() => {
          logout();
          nav("/");
        }}
        className="btn-outline mt-10"
        data-testid="logout-btn"
      >
        SIGN OUT
      </button>
    </div>
  );
}

function Tile({ to, t, s }) {
  return (
    <Link to={to} className="card-oc p-6 hover:border-gold transition-colors">
      <div className="display text-2xl">{t}</div>
      <div className="text-neutral-400 text-sm mt-1">{s}</div>
    </Link>
  );
}

export function Orders() {
  const { user, logout } = useStore();
  const nav = useNavigate();

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

  if (!user) return <Navigate to="/login?mode=login" />;

  return (
    <div className="container-oc py-12 max-w-4xl" data-testid="orders-page">
      <div className="flex items-center justify-between gap-4 mb-8">
        <div>
          <p className="label-tiny text-gold mb-3">SHOPPING HISTORY</p>
          <h1 className="display text-5xl">MY ORDERS</h1>
        </div>

        <Link to="/account" className="btn-outline">
          BACK
        </Link>
      </div>

      {loading && (
        <div className="card-oc p-6 text-neutral-400">
          Loading your orders...
        </div>
      )}

      {!loading && err && (
        <div className="card-oc p-6">
          <p className="text-red-400 mb-4">{err}</p>

          <button
            onClick={() => {
              logout();
              nav("/login?mode=login");
            }}
            className="btn-primary"
          >
            LOGIN AGAIN
          </button>
        </div>
      )}

      {!loading && !err && orders.length === 0 && (
        <div className="card-oc p-6">
          <p className="text-neutral-400 mb-4">
            No account orders found yet.
          </p>

          <p className="text-neutral-500 text-sm mb-5">
            Note: Orders placed before login may only appear through Track Order using your order number.
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
              className="card-oc p-5 flex flex-col md:flex-row justify-between gap-4 hover:border-gold"
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

                <div className="mono text-gold">
                  {money(order.total)}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
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
        setItems(products.filter((product) => wishlist.includes(product.id)));
      } catch (error) {
        setErr(error.message || "Could not load wishlist.");
      } finally {
        setLoading(false);
      }
    }

    loadWishlist();
  }, [user, wishlist]);

  if (!user) return <Navigate to="/login?mode=login" />;

  return (
    <div className="container-oc py-12" data-testid="wishlist-page">
      <div className="flex items-center justify-between gap-4 mb-8">
        <div>
          <p className="label-tiny text-gold mb-3">SAVED PRODUCTS</p>
          <h1 className="display text-5xl">WISHLIST</h1>
        </div>

        <Link to="/account" className="btn-outline">
          BACK
        </Link>
      </div>

      {loading && <p className="text-neutral-400">Loading wishlist...</p>}

      {!loading && err && <p className="text-red-400">{err}</p>}

      {!loading && !err && items.length === 0 && (
        <p className="text-neutral-400">
          Nothing saved yet.{" "}
          <Link to="/shop" className="text-gold">
            Shop →
          </Link>
        </p>
      )}

      {!loading && !err && items.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {items.map((product) => (
            <Link
              key={product.id}
              to={`/product/${product.slug}`}
              className="card-oc p-3 hover:border-gold"
            >
              <img
                src={product.images?.[0]}
                alt={product.name}
                className="w-full aspect-[3/4] object-cover"
              />

              <div className="display text-lg mt-3">
                {product.name}
              </div>

              <div className="mono mt-1">
                {money(product.price)}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}