import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useStore } from "../lib/store";
import api, { inr } from "../lib/api";
import { toast } from "sonner";
import AdminProductEditor from "./AdminProductEditor";
import { Plus, Edit } from "lucide-react";

const TABS = ["Overview", "Orders", "Products", "Customers"];
const STATUSES = ["confirmed", "packed", "shipped", "out_for_delivery", "delivered", "cancelled"];

export default function Admin() {
  const { user } = useStore();
  const [tab, setTab] = useState("Overview");
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [editing, setEditing] = useState(null); // null = closed, {} = new, {slug,...} = edit
  const [showEditor, setShowEditor] = useState(false);

  const loadProducts = () => api.get("/products", { params: { limit: 100 } }).then(({ data }) => setProducts(data));

  useEffect(() => {
    if (!user?.is_admin) return;
    api.get("/admin/stats").then(({ data }) => setStats(data));
    api.get("/admin/orders").then(({ data }) => setOrders(data));
    loadProducts();
    api.get("/admin/customers").then(({ data }) => setCustomers(data));
  }, [user]);

  if (!user) return <Navigate to="/login" />;
  if (!user.is_admin) return <Navigate to="/account" />;

  const updateStatus = async (n, s) => {
    await api.patch(`/admin/orders/${n}/status`, null, { params: { new_status: s } });
    const { data } = await api.get("/admin/orders");
    setOrders(data); toast.success("Status updated");
  };
  const deleteProduct = async (slug) => {
    if (!window.confirm(`Delete ${slug}?`)) return;
    await api.delete(`/admin/products/${slug}`);
    setProducts((p) => p.filter((x) => x.slug !== slug));
    toast.success("Product deleted");
  };

  return (
    <div className="container-oc py-12" data-testid="admin-page">
      <div className="flex items-center justify-between">
        <h1 className="display text-5xl">COMMAND CENTER</h1>
        <span className="label-tiny text-gold mono">ADMIN · {user.email}</span>
      </div>
      <div className="flex gap-2 mt-8 border-b border-ink-500">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-3 label-tiny ${tab === t ? "text-gold border-b-2 border-gold" : "text-neutral-400 hover:text-white"}`}
            data-testid={`tab-${t.toLowerCase()}`}>{t}</button>
        ))}
      </div>

      {tab === "Overview" && stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-8" data-testid="overview">
          <Stat l="Revenue" v={inr(stats.revenue)} />
          <Stat l="Orders" v={stats.total_orders} />
          <Stat l="Customers" v={stats.total_users} />
          <Stat l="Products" v={stats.total_products} />
          <div className="col-span-2 md:col-span-4 card-oc p-6 mt-2">
            <h3 className="label-tiny text-gold mb-3">Recent Orders</h3>
            <div className="space-y-2">
              {stats.recent_orders.map((o) => (
                <div key={o.id} className="flex justify-between text-sm border-b border-ink-500 py-2">
                  <span className="mono">{o.order_number}</span>
                  <span className="text-neutral-400">{o.shipping_address?.full_name}</span>
                  <span>{inr(o.total)}</span>
                  <span className="label-tiny">{o.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === "Orders" && (
        <div className="mt-8 space-y-2" data-testid="orders-tab">
          {orders.map((o) => (
            <div key={o.id} className="card-oc p-4 flex flex-col md:flex-row gap-3 md:items-center justify-between">
              <div>
                <div className="mono text-gold">{o.order_number}</div>
                <div className="text-xs text-neutral-500">{o.shipping_address?.full_name} · {o.items.length} items · {inr(o.total)}</div>
              </div>
              <select value={o.status} onChange={(e) => updateStatus(o.order_number, e.target.value)} className="input-oc py-2 text-sm w-auto" data-testid={`status-${o.order_number}`}>
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          ))}
        </div>
      )}

      {tab === "Products" && (
        <div className="mt-8 space-y-2" data-testid="products-tab">
          <div className="flex justify-end">
            <button onClick={() => { setEditing(null); setShowEditor(true); }} className="btn-primary" data-testid="new-product">
              <Plus size={16} className="mr-2" /> NEW PRODUCT
            </button>
          </div>
          {products.map((p) => (
            <div key={p.id} className="card-oc p-4 flex gap-3 items-center">
              <img src={p.images[0]} alt="" className="w-16 h-20 object-cover" />
              <div className="flex-1">
                <div className="font-semibold">{p.name}</div>
                <div className="label-tiny">{p.category} · {p.collection} · stock {p.stock}</div>
              </div>
              <div className="mono">{inr(p.price)}</div>
              <button onClick={() => { setEditing(p); setShowEditor(true); }} className="btn-outline" data-testid={`edit-${p.slug}`}><Edit size={14} /></button>
              <button onClick={() => deleteProduct(p.slug)} className="btn-outline" data-testid={`del-${p.slug}`}>DELETE</button>
            </div>
          ))}
        </div>
      )}

      {tab === "Customers" && (
        <div className="mt-8 space-y-2" data-testid="customers-tab">
          {customers.map((c) => (
            <div key={c.id} className="card-oc p-4 flex justify-between">
              <div><div className="font-semibold">{c.name}</div><div className="text-xs text-neutral-500">{c.email}</div></div>
              <div className="label-tiny">{new Date(c.created_at).toLocaleDateString()}</div>
            </div>
          ))}
        </div>
      )}

      {showEditor && (
        <AdminProductEditor initial={editing} onClose={() => setShowEditor(false)} onSaved={loadProducts} />
      )}
    </div>
  );
}
function Stat({ l, v }) {
  return (
    <div className="card-oc p-5">
      <div className="label-tiny text-gold">{l}</div>
      <div className="mono text-3xl mt-2">{v}</div>
    </div>
  );
}
