import { useState } from "react";
import api from "../lib/api";
import { toast } from "sonner";
import { X, Upload } from "lucide-react";

const COLLECTIONS = ["operator", "kargil", "fearless", "bravest", "patriot"];
const CATEGORIES = ["tees", "hoodies", "cargo", "caps", "accessories"];
const BADGES = ["Limited Edition", "Bestseller", "One Time Drop"];

const emptyProduct = {
  slug: "", name: "", description: "", price: 0, compare_at_price: 0,
  category: "tees", collection: "operator",
  images: [],
  sizes: ["S", "M", "L", "XL", "XXL"],
  colors: [{ name: "Matte Black", hex: "#0A0A0A" }],
  stock: 50, badges: [], is_new_drop: false, specs: {},
};

export default function AdminProductEditor({ initial, onClose, onSaved }) {
  const [p, setP] = useState({ ...emptyProduct, ...(initial || {}) });
  const [uploading, setUploading] = useState(false);
  const isEdit = Boolean(initial);

  const set = (k, v) => setP({ ...p, [k]: v });

  const uploadImage = async (file) => {
    setUploading(true);
    try {
      const { data: sig } = await api.get("/uploads/signature", { params: { folder: "products/" } });
      if (sig.is_mock) {
        // Mock fallback: use a generated placeholder image URL
        const url = `https://picsum.photos/seed/${Date.now()}/800/1000`;
        set("images", [...(p.images || []), url]);
        toast.message("Image added (mock — Cloudinary keys not configured in preview)");
        return;
      }
      const form = new FormData();
      form.append("file", file);
      form.append("api_key", sig.api_key);
      form.append("timestamp", sig.timestamp);
      form.append("signature", sig.signature);
      form.append("folder", sig.folder);
      const res = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloud_name}/image/upload`, { method: "POST", body: form });
      const data = await res.json();
      if (data.secure_url) {
        set("images", [...(p.images || []), data.secure_url]);
        toast.success("Image uploaded");
      } else {
        toast.error("Upload failed");
      }
    } catch (e) {
      toast.error("Upload error: " + (e.message || ""));
    } finally {
      setUploading(false);
    }
  };

  const onFile = (e) => {
    const file = e.target.files?.[0]; if (!file) return; uploadImage(file);
  };

  const removeImage = (idx) => set("images", p.images.filter((_, i) => i !== idx));

  const save = async (e) => {
    e.preventDefault();
    if (!p.name || !p.slug) { toast.error("Name and slug are required"); return; }
    if (p.images.length === 0) { toast.error("At least one image required"); return; }
    try {
      if (isEdit) {
        await api.patch(`/admin/products/${initial.slug}`, p);
        toast.success("Product updated");
      } else {
        await api.post("/admin/products", p);
        toast.success("Product created");
      }
      onSaved?.();
      onClose?.();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Save failed");
    }
  };

  return (
    <div className="fixed inset-0 z-[80] bg-black/80 overflow-y-auto" data-testid="product-editor">
      <div className="min-h-full flex items-start justify-center p-4">
        <div className="w-full max-w-3xl bg-ink-900 border border-ink-500 my-8">
          <div className="flex items-center justify-between p-5 border-b border-ink-500">
            <h2 className="display text-2xl">{isEdit ? "EDIT PRODUCT" : "NEW PRODUCT"}</h2>
            <button onClick={onClose} className="p-2 hover:text-gold" data-testid="close-editor"><X size={20} /></button>
          </div>
          <form onSubmit={save} className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Field l="Name" v={p.name} on={(v) => set("name", v)} testid="ed-name" />
              <Field l="Slug (URL)" v={p.slug} on={(v) => set("slug", v.toLowerCase().replace(/\s+/g, "-"))} testid="ed-slug" disabled={isEdit} />
              <Field l="Price (₹)" type="number" v={p.price} on={(v) => set("price", Number(v))} testid="ed-price" />
              <Field l="Compare Price (₹)" type="number" v={p.compare_at_price || ""} on={(v) => set("compare_at_price", Number(v) || null)} testid="ed-compare" />
              <Select l="Category" v={p.category} on={(v) => set("category", v)} opts={CATEGORIES} testid="ed-cat" />
              <Select l="Collection" v={p.collection} on={(v) => set("collection", v)} opts={COLLECTIONS} testid="ed-col" />
              <Field l="Stock" type="number" v={p.stock} on={(v) => set("stock", Number(v))} testid="ed-stock" />
            </div>

            <div>
              <label className="label-tiny block mb-1">Description</label>
              <textarea value={p.description} onChange={(e) => set("description", e.target.value)} rows={3} className="input-oc" data-testid="ed-desc" />
            </div>

            <div>
              <label className="label-tiny block mb-2">Badges</label>
              <div className="flex flex-wrap gap-2">
                {BADGES.map((b) => (
                  <button type="button" key={b}
                    onClick={() => set("badges", p.badges.includes(b) ? p.badges.filter((x) => x !== b) : [...p.badges, b])}
                    className={`label-tiny px-3 py-2 border ${p.badges.includes(b) ? "border-gold text-gold" : "border-ink-500 text-neutral-400"}`}>
                    {b}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="label-tiny block mb-2">Images ({p.images.length})</label>
              <div className="grid grid-cols-4 gap-2">
                {p.images.map((src, i) => (
                  <div key={i} className="relative group aspect-[3/4] bg-ink-700">
                    <img src={src} alt="" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => removeImage(i)} className="absolute top-1 right-1 bg-black/70 p-1 opacity-0 group-hover:opacity-100" data-testid={`rm-img-${i}`}><X size={14} /></button>
                  </div>
                ))}
                <label className="aspect-[3/4] border border-dashed border-ink-500 flex items-center justify-center cursor-pointer hover:border-gold" data-testid="upload-image">
                  <input type="file" accept="image/*" hidden onChange={onFile} disabled={uploading} />
                  <div className="text-center text-xs text-neutral-400">
                    <Upload size={20} className="mx-auto mb-1" />
                    {uploading ? "..." : "ADD"}
                  </div>
                </label>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button type="button" onClick={onClose} className="btn-outline flex-1" data-testid="cancel-editor">CANCEL</button>
              <button className="btn-primary flex-1" data-testid="save-product">{isEdit ? "SAVE" : "CREATE"}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function Field({ l, v, on, type = "text", testid, disabled }) {
  return (
    <div>
      <label className="label-tiny block mb-1">{l}</label>
      <input type={type} value={v} onChange={(e) => on(e.target.value)} disabled={disabled} className="input-oc disabled:opacity-60" data-testid={testid} />
    </div>
  );
}
function Select({ l, v, on, opts, testid }) {
  return (
    <div>
      <label className="label-tiny block mb-1">{l}</label>
      <select value={v} onChange={(e) => on(e.target.value)} className="input-oc" data-testid={testid}>
        {opts.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}
