import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api, { inr } from "../lib/api";
import { useStore } from "../lib/store";
import { Plus, Minus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function Cart() {
  const { cart, updateQty, removeItem, subtotal } = useStore();
  const [code, setCode] = useState("");
  const [coupon, setCoupon] = useState(null);
  const nav = useNavigate();

  const apply = async () => {
    if (!code) return;
    try {
      const { data } = await api.post("/coupons/check", { code: code.toUpperCase(), subtotal });
      setCoupon(data); toast.success(`${data.code} applied`);
    } catch (e) {
      setCoupon(null); toast.error(e.response?.data?.detail || "Invalid coupon");
    }
  };

  const discount = coupon ? (coupon.discount_type === "percent" ? (subtotal * coupon.value / 100) : coupon.value) : 0;
  const afterDisc = Math.max(subtotal - discount, 0);
  const shipping = coupon?.code === "FREESHIP" || afterDisc >= 1999 ? 0 : 99;
  const gst = Math.round(afterDisc * 0.05);
  const total = afterDisc + shipping + gst;

  if (cart.length === 0) {
    return (
      <div className="container-oc py-20 text-center" data-testid="cart-empty">
        <h1 className="display text-5xl">YOUR ARSENAL IS EMPTY</h1>
        <p className="text-neutral-400 mt-3">Time to gear up, operator.</p>
        <Link to="/shop" className="btn-primary mt-8 inline-flex">SHOP NOW</Link>
      </div>
    );
  }

  return (
    <div className="container-oc py-12" data-testid="cart-page">
      <h1 className="display text-5xl mb-8">YOUR ARSENAL</h1>
      <div className="grid lg:grid-cols-[1fr_360px] gap-10">
        <div className="divide-y divide-ink-500 border border-ink-500">
          {cart.map((it, idx) => (
            <div key={idx} className="p-5 flex gap-5" data-testid={`row-${idx}`}>
              <img src={it.image} alt={it.name} className="w-28 h-32 object-cover" />
              <div className="flex-1">
                <div className="font-semibold">{it.name}</div>
                <div className="label-tiny mt-1">Size {it.size}{it.color ? ` · ${it.color}` : ""}</div>
                <div className="mono mt-2">{inr(it.price)}</div>
                <div className="flex items-center gap-4 mt-3">
                  <div className="inline-flex items-center border border-ink-500">
                    <button onClick={() => updateQty(idx, it.qty - 1)} className="p-2"><Minus size={14} /></button>
                    <span className="px-3 mono">{it.qty}</span>
                    <button onClick={() => updateQty(idx, it.qty + 1)} className="p-2"><Plus size={14} /></button>
                  </div>
                  <button onClick={() => removeItem(idx)} className="text-neutral-500 hover:text-red-400"><Trash2 size={16} /></button>
                </div>
              </div>
              <div className="mono">{inr(it.price * it.qty)}</div>
            </div>
          ))}
        </div>

        <aside className="card-oc p-6 self-start">
          <h2 className="display text-2xl">ORDER SUMMARY</h2>
          <div className="mt-5 space-y-3 text-sm">
            <Row k="Subtotal" v={inr(subtotal)} />
            <Row k="Discount" v={discount > 0 ? `− ${inr(discount)}` : "—"} />
            <Row k="Shipping" v={shipping ? inr(shipping) : "FREE"} />
            <Row k="GST (5%)" v={inr(gst)} />
            <div className="h-px bg-ink-500 my-3" />
            <Row k="Total" v={inr(total)} bold />
          </div>

          <div className="mt-5 flex gap-2">
            <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="COUPON CODE" className="input-oc tracking-widest" data-testid="coupon-input" />
            <button onClick={apply} className="btn-outline" data-testid="apply-coupon">APPLY</button>
          </div>
          <div className="label-tiny text-neutral-500 mt-2">Try: FORGED10 · OPERATOR20 · FREESHIP</div>

          <button onClick={() => nav("/checkout", { state: { coupon } })} className="btn-primary w-full mt-6" data-testid="proceed-checkout">PROCEED TO CHECKOUT</button>
        </aside>
      </div>
    </div>
  );
}

function Row({ k, v, bold }) {
  return (
    <div className="flex justify-between">
      <span className={bold ? "display text-base" : "text-neutral-400"}>{k}</span>
      <span className={`mono ${bold ? "text-gold text-lg" : ""}`}>{v}</span>
    </div>
  );
}
