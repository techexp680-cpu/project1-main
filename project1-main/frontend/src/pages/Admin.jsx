import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useStore } from "../lib/store";
import { inr } from "../lib/api";
import { toast } from "sonner";
import AdminProductEditor from "./AdminProductEditor";
import { Plus, Edit, RefreshCcw } from "lucide-react";

const API_BASE = "http://localhost:8000/api";

const TABS = ["Overview", "Orders", "Products", "Customers"];

const STATUSES = [
  "confirmed",
  "packed",
  "shipped",
  "out_for_delivery",
  "delivered",
  "cancelled",
];

async function adminRequest(path, options = {}) {
  const token = localStorage.getItem("oc_token");

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  const text = await response.text();

  let data = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!response.ok) {
    throw new Error(
      data?.detail || data?.message || `Request failed: ${response.status}`
    );
  }

  return data;
}

export default function Admin() {
  const { user } = useStore();

  const [tab, setTab] = useState("Overview");

  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);

  const [editing, setEditing] = useState(null);
  const [showEditor, setShowEditor] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadStats = async () => {
    const data = await adminRequest("/admin/stats");
    setStats(data);
  };

  const loadOrders = async () => {
    const data = await adminRequest("/admin/orders");
    setOrders(Array.isArray(data) ? data : []);
  };

  const loadProducts = async () => {
    const data = await adminRequest("/products?limit=100");
    setProducts(Array.isArray(data) ? data : []);
  };

  const loadCustomers = async () => {
    const data = await adminRequest("/admin/customers");
    setCustomers(Array.isArray(data) ? data : []);
  };

  const loadAll = async () => {
    if (!user?.is_admin) return;

    setLoading(true);
    setError("");

    try {
      await Promise.all([
        loadStats(),
        loadOrders(),
        loadProducts(),
        loadCustomers(),
      ]);
    } catch (err) {
      console.error(err);
      setError(err.message || "Admin data failed to load.");
      toast.error(err.message || "Admin data failed to load.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, [user]);

  if (!user) {
    return <Navigate to="/login?mode=login" replace />;
  }

  if (!user.is_admin) {
    return <Navigate to="/account" replace />;
  }

  const updateStatus = async (orderNumber, newStatus) => {
    try {
      await adminRequest(
        `/admin/orders/${orderNumber}/status?new_status=${encodeURIComponent(
          newStatus
        )}`,
        {
          method: "PATCH",
        }
      );

      toast.success("Order status updated.");
      await loadOrders();
      await loadStats();
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Could not update order status.");
    }
  };

  const deleteProduct = async (slug) => {
    if (!slug) {
      toast.error("Product slug missing.");
      return;
    }

    const ok = window.confirm(`Delete product: ${slug}?`);

    if (!ok) return;

    try {
      await adminRequest(`/admin/products/${slug}`, {
        method: "DELETE",
      });

      setProducts((current) => current.filter((product) => product.slug !== slug));
      toast.success("Product deleted.");
      await loadStats();
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Could not delete product.");
    }
  };

  const openNewProduct = () => {
    setEditing(null);
    setShowEditor(true);
  };

  const openEditProduct = (product) => {
    setEditing(product);
    setShowEditor(true);
  };

  const handleEditorSaved = async () => {
    setShowEditor(false);
    await loadProducts();
    await loadStats();
  };

  return (
    <div className="container-oc py-12" data-testid="admin-page">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <p className="label-tiny text-gold mb-2">// OWNER ACCESS</p>
          <h1 className="display text-5xl">COMMAND CENTER</h1>
        </div>

        <div className="flex flex-col md:items-end gap-2">
          <span className="label-tiny text-gold mono">
            ADMIN · {user.email}
          </span>

          <button
            type="button"
            onClick={loadAll}
            className="btn-outline inline-flex items-center gap-2 justify-center"
            disabled={loading}
          >
            <RefreshCcw size={14} />
            {loading ? "LOADING..." : "REFRESH"}
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-6 border border-red-500/40 bg-red-500/10 text-red-300 p-4 text-sm">
          {error}
        </div>
      )}

      <div className="flex gap-2 mt-8 border-b border-ink-500 overflow-x-auto">
        {TABS.map((item) => (
          <button
            key={item}
            onClick={() => setTab(item)}
            className={`px-4 py-3 label-tiny whitespace-nowrap ${
              tab === item
                ? "text-gold border-b-2 border-gold"
                : "text-neutral-400 hover:text-white"
            }`}
            data-testid={`tab-${item.toLowerCase()}`}
          >
            {item}
          </button>
        ))}
      </div>

      {loading && (
        <div className="mt-8 card-oc p-6 text-neutral-400">
          Loading admin data...
        </div>
      )}

      {!loading && tab === "Overview" && (
        <Overview stats={stats} />
      )}

      {!loading && tab === "Orders" && (
        <Orders orders={orders} updateStatus={updateStatus} />
      )}

      {!loading && tab === "Products" && (
        <Products
          products={products}
          openNewProduct={openNewProduct}
          openEditProduct={openEditProduct}
          deleteProduct={deleteProduct}
        />
      )}

      {!loading && tab === "Customers" && (
        <Customers customers={customers} />
      )}

      {showEditor && (
        <AdminProductEditor
          initial={editing}
          onClose={() => setShowEditor(false)}
          onSaved={handleEditorSaved}
        />
      )}
    </div>
  );
}

function Overview({ stats }) {
  if (!stats) {
    return (
      <div className="mt-8 card-oc p-6 text-neutral-400">
        No overview data loaded.
      </div>
    );
  }

  const recentOrders = Array.isArray(stats.recent_orders)
    ? stats.recent_orders
    : [];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-8" data-testid="overview">
      <Stat label="Revenue" value={inr(stats.revenue || 0)} />
      <Stat label="Orders" value={stats.total_orders || 0} />
      <Stat label="Customers" value={stats.total_users || 0} />
      <Stat label="Products" value={stats.total_products || 0} />

      <div className="col-span-2 md:col-span-4 card-oc p-6 mt-2">
        <h3 className="label-tiny text-gold mb-3">Recent Orders</h3>

        {recentOrders.length === 0 ? (
          <p className="text-neutral-500 text-sm">No recent orders.</p>
        ) : (
          <div className="space-y-2">
            {recentOrders.map((order, index) => (
              <div
                key={order.id || order.order_number || index}
                className="grid md:grid-cols-4 gap-2 text-sm border-b border-ink-500 py-2"
              >
                <span className="mono text-gold">{order.order_number}</span>
                <span className="text-neutral-400">
                  {order.shipping_address?.full_name || "Customer"}
                </span>
                <span>{inr(order.total || 0)}</span>
                <span className="label-tiny">{order.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Orders({ orders, updateStatus }) {
  return (
    <div className="mt-8 space-y-2" data-testid="orders-tab">
      {orders.length === 0 ? (
        <div className="card-oc p-6 text-neutral-400">No orders found.</div>
      ) : (
        orders.map((order, index) => (
          <div
            key={order.id || order.order_number || index}
            className="card-oc p-4 flex flex-col md:flex-row gap-3 md:items-center justify-between"
          >
            <div>
              <div className="mono text-gold">{order.order_number}</div>

              <div className="text-xs text-neutral-500">
                {order.shipping_address?.full_name || "Customer"} ·{" "}
                {order.items?.length || 0} items · {inr(order.total || 0)}
              </div>

              <div className="text-xs text-neutral-600 mt-1">
                Payment: {order.payment_status || "unknown"}
              </div>
            </div>

            <select
              value={order.status || "confirmed"}
              onChange={(event) =>
                updateStatus(order.order_number, event.target.value)
              }
              className="input-oc py-2 text-sm w-full md:w-auto"
              data-testid={`status-${order.order_number}`}
            >
              {STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
        ))
      )}
    </div>
  );
}

function Products({
  products,
  openNewProduct,
  openEditProduct,
  deleteProduct,
}) {
  return (
    <div className="mt-8 space-y-2" data-testid="products-tab">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={openNewProduct}
          className="btn-primary"
          data-testid="new-product"
        >
          <Plus size={16} className="mr-2" />
          NEW PRODUCT
        </button>
      </div>

      {products.length === 0 ? (
        <div className="card-oc p-6 text-neutral-400">No products found.</div>
      ) : (
        products.map((product, index) => {
          const image = Array.isArray(product.images)
            ? product.images[0]
            : product.image;

          return (
            <div
              key={product.id || product.slug || index}
              className="card-oc p-4 flex gap-3 items-center"
            >
              <div className="w-16 h-20 bg-black border border-white/10 shrink-0 overflow-hidden">
                {image ? (
                  <img
                    src={image}
                    alt={product.name || ""}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[9px] uppercase text-neutral-600">
                    No Image
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="font-semibold truncate">
                  {product.name || "Unnamed Product"}
                </div>

                <div className="label-tiny text-neutral-500">
                  {product.category || "Category"} ·{" "}
                  {product.collection || "Collection"} · stock{" "}
                  {product.stock ?? product.inventory ?? 0}
                </div>

                <div className="text-xs text-neutral-600 mt-1">
                  /product/{product.slug}
                </div>
              </div>

              <div className="mono hidden md:block">
                {inr(product.price || 0)}
              </div>

              <button
                type="button"
                onClick={() => openEditProduct(product)}
                className="btn-outline"
                data-testid={`edit-${product.slug}`}
              >
                <Edit size={14} />
              </button>

              <button
                type="button"
                onClick={() => deleteProduct(product.slug)}
                className="btn-outline"
                data-testid={`del-${product.slug}`}
              >
                DELETE
              </button>
            </div>
          );
        })
      )}
    </div>
  );
}

function Customers({ customers }) {
  return (
    <div className="mt-8 space-y-3" data-testid="customers-tab">
      {customers.length === 0 ? (
        <div className="card-oc p-6 text-neutral-400">No customers found.</div>
      ) : (
        customers.map((customer, index) => {
          const address = customer.address || {};

          return (
            <div
              key={customer.id || customer.email || index}
              className="card-oc p-5"
            >
              <div className="flex flex-col md:flex-row md:justify-between gap-4">
                <div>
                  <div className="font-semibold text-lg">
                    {customer.name || "Customer"}
                  </div>

                  <div className="text-sm text-neutral-500 mt-1">
                    {customer.email || "No email"}
                  </div>

                  <div className="text-sm text-neutral-400 mt-2">
                    Phone: {customer.phone || "Not provided"}
                  </div>
                </div>

                <div className="text-left md:text-right">
                  <div className="label-tiny text-gold">
                    Orders: {customer.total_orders || 0}
                  </div>

                  <div className="label-tiny text-neutral-500 mt-1">
                    Joined:{" "}
                    {customer.created_at
                      ? new Date(customer.created_at).toLocaleDateString()
                      : "-"}
                  </div>

                  {customer.latest_order_number && (
                    <div className="label-tiny text-neutral-500 mt-1">
                      Latest: {customer.latest_order_number}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 border-t border-white/10 pt-4">
                <div className="label-tiny text-gold mb-2">Address</div>

                <div className="text-sm text-neutral-400 leading-6">
                  <div>{address.line1 || "Not provided"}</div>

                  {address.line2 && <div>{address.line2}</div>}

                  <div>
                    {address.city || "Not provided"},{" "}
                    {address.state || "Not provided"} -{" "}
                    {address.pincode || "Not provided"}
                  </div>

                  <div>{address.country || "India"}</div>

                  {address.landmark && (
                    <div>Landmark: {address.landmark}</div>
                  )}
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
function Stat({ label, value }) {
  return (
    <div className="card-oc p-5">
      <div className="label-tiny text-gold">{label}</div>
      <div className="mono text-3xl mt-2">{value}</div>
    </div>
  );
}
