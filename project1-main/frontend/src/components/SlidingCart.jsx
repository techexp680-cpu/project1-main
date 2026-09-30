import { useStore } from "../lib/store";
import { X, Plus, Minus, Trash2, ArrowRight, ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";
import { inr } from "../lib/api";

export default function SlidingCart() {
  const {
    cart,
    cartOpen,
    setCartOpen,
    updateQty,
    removeItem,
    subtotal,
  } = useStore();

  if (!cartOpen) return null;

  const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);

  return (
    <div className="fixed inset-0 z-[70]" data-testid="sliding-cart">
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={() => setCartOpen(false)}
      />

      <aside className="absolute right-0 top-0 h-full w-full sm:w-[480px] bg-black border-l border-white/10 flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-5 border-b border-white/10">
          <div>
            <div className="display text-2xl leading-none">
              YOUR CART
            </div>

            <div className="mono text-[10px] text-neutral-500 mt-1 tracking-[0.18em] uppercase">
              {totalItems} item{totalItems !== 1 ? "s" : ""} selected
            </div>
          </div>

          <button
            type="button"
            onClick={() => setCartOpen(false)}
            className="p-2 border border-white/10 hover:border-gold hover:text-gold transition"
            data-testid="close-cart"
            aria-label="Close cart"
          >
            <X size={20} />
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-20">
              <div className="w-16 h-16 border border-white/10 flex items-center justify-center mb-5">
                <ShoppingBag size={28} className="text-gold" />
              </div>

              <p className="display text-3xl">CART IS EMPTY</p>

              <p className="text-neutral-500 text-sm mt-2 max-w-xs">
                Add tactical gear to your cart and begin checkout.
              </p>

              <Link
                to="/shop"
                onClick={() => setCartOpen(false)}
                className="btn-primary mt-7"
              >
                SHOP NOW
              </Link>
            </div>
          ) : (
            <div className="space-y-1">
              {cart.map((item, index) => (
                <div
                  key={`${item.product_id}-${item.size}-${item.color}-${index}`}
                  className="flex gap-4 py-5 border-b border-white/10"
                  data-testid={`cart-item-${index}`}
                >
                  <div className="w-24 h-28 bg-ink-800 border border-white/10 shrink-0 overflow-hidden">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px] text-neutral-600 uppercase tracking-[0.2em]">
                        No Image
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-semibold leading-snug line-clamp-2">
                          {item.name}
                        </h3>

                        <div className="label-tiny mt-1 text-neutral-500">
                          Size {item.size}
                          {item.color ? ` · ${item.color}` : ""}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="text-neutral-600 hover:text-red-400 transition shrink-0"
                        data-testid={`remove-${index}`}
                        aria-label="Remove item"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className="mono text-sm mt-3">
                      {inr(item.price)}
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      <div className="inline-flex items-center border border-white/10">
                        <button
                          type="button"
                          onClick={() => updateQty(index, item.qty - 1)}
                          className="p-2 hover:bg-white/10 transition"
                          data-testid={`qty-dec-${index}`}
                          aria-label="Decrease quantity"
                        >
                          <Minus size={14} />
                        </button>

                        <span
                          className="px-4 mono text-sm min-w-10 text-center"
                          data-testid={`qty-val-${index}`}
                        >
                          {item.qty}
                        </span>

                        <button
                          type="button"
                          onClick={() => updateQty(index, item.qty + 1)}
                          className="p-2 hover:bg-white/10 transition"
                          data-testid={`qty-inc-${index}`}
                          aria-label="Increase quantity"
                        >
                          <Plus size={14} />
                        </button>
                      </div>

                      <div className="mono text-sm text-gold">
                        {inr(item.price * item.qty)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div className="border-t border-white/10 p-5 bg-black">
            <div className="space-y-3 mb-5">
              <div className="flex justify-between text-sm">
                <span className="label-tiny text-neutral-400">
                  Subtotal
                </span>

                <span className="mono text-white">
                  {inr(subtotal)}
                </span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="label-tiny text-neutral-400">
                  Estimated GST
                </span>

                <span className="mono text-neutral-400">
                  Calculated at checkout
                </span>
              </div>

              <p className="text-xs text-neutral-500 leading-relaxed">
                Shipping, GST and coupons will be calculated on the checkout page.
              </p>
            </div>

            <Link
              to="/checkout"
              onClick={() => setCartOpen(false)}
              className="btn-primary w-full justify-center"
              data-testid="cart-checkout"
            >
              CHECKOUT
              <ArrowRight className="ml-2" size={16} />
            </Link>

            <Link
              to="/cart"
              onClick={() => setCartOpen(false)}
              className="btn-outline w-full justify-center mt-3"
              data-testid="cart-view-full"
            >
              VIEW FULL CART
            </Link>

            <button
              type="button"
              onClick={() => setCartOpen(false)}
              className="w-full text-center text-xs tracking-[0.2em] uppercase text-neutral-500 hover:text-gold mt-4 transition"
            >
              Continue Shopping
            </button>
          </div>
        )}
      </aside>
    </div>
  );
}
