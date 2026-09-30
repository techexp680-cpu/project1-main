import { useStore } from "../lib/store";
import { X, Plus, Minus, Trash2, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { inr } from "../lib/api";

export default function SlidingCart() {
  const { cart, cartOpen, setCartOpen, updateQty, removeItem, subtotal } = useStore();
  if (!cartOpen) return null;

  return (
    <div className="fixed inset-0 z-[70]" data-testid="sliding-cart">
      <div className="absolute inset-0 bg-black/70" onClick={() => setCartOpen(false)} />
      <aside className="absolute right-0 top-0 h-full w-full sm:w-[460px] bg-ink-900 border-l border-white/10 flex flex-col">
        <div className="flex items-center justify-between h-16 px-5 border-b border-white/10">
          <div className="display text-2xl">YOUR ARSENAL <span className="mono text-xs text-neutral-500">({cart.length})</span></div>
          <button onClick={() => setCartOpen(false)} className="p-2 hover:text-gold" data-testid="close-cart"><X size={20} /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {cart.length === 0 && (
            <div className="text-center py-20">
              <p className="display text-2xl">CART IS EMPTY</p>
              <p className="text-neutral-500 text-sm mt-2">Add gear to begin the mission.</p>
              <Link to="/shop" onClick={() => setCartOpen(false)} className="btn-primary mt-6">SHOP NOW</Link>
            </div>
          )}
          {cart.map((it, idx) => (
            <div key={idx} className="flex gap-4 py-4 border-b border-white/10" data-testid={`cart-item-${idx}`}>
              <img src={it.image} alt={it.name} className="w-20 h-24 object-cover" />
              <div className="flex-1">
                <div className="text-sm font-semibold leading-snug">{it.name}</div>
                <div className="label-tiny mt-1">Size {it.size}{it.color ? ` · ${it.color}` : ""}</div>
                <div className="mono text-sm mt-2">{inr(it.price)}</div>
                <div className="flex items-center justify-between mt-2">
                  <div className="inline-flex items-center border border-ink-500">
                    <button onClick={() => updateQty(idx, it.qty - 1)} className="p-2 hover:bg-ink-700" data-testid={`qty-dec-${idx}`}><Minus size={14} /></button>
                    <span className="px-3 mono text-sm" data-testid={`qty-val-${idx}`}>{it.qty}</span>
                    <button onClick={() => updateQty(idx, it.qty + 1)} className="p-2 hover:bg-ink-700" data-testid={`qty-inc-${idx}`}><Plus size={14} /></button>
                  </div>
                  <button onClick={() => removeItem(idx)} className="text-neutral-500 hover:text-red-400" data-testid={`remove-${idx}`}><Trash2 size={16} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {cart.length > 0 && (
          <div className="border-t border-white/10 p-5 space-y-4">
            <div className="flex justify-between text-sm">
              <span className="label-tiny">Subtotal</span>
              <span className="mono">{inr(subtotal)}</span>
            </div>
            <p className="text-xs text-neutral-500">Shipping, GST & coupons calculated at checkout.</p>
            <Link to="/checkout" onClick={() => setCartOpen(false)} className="btn-primary w-full" data-testid="cart-checkout">
              CHECKOUT <ArrowRight className="ml-2" size={16} />
            </Link>
            <Link to="/cart" onClick={() => setCartOpen(false)} className="btn-outline w-full" data-testid="cart-view-full">VIEW CART</Link>
          </div>
        )}
      </aside>
    </div>
  );
}
