import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api, { inr } from "../lib/api";
import { useStore } from "../lib/store";
import ProductCard from "../components/ProductCard";
import CountdownTimer from "../components/CountdownTimer";
import { Heart, Star, Truck, RotateCcw, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export default function Product() {
  const { slug } = useParams();
  const [data, setData] = useState(null);
  const [idx, setIdx] = useState(0);
  const [size, setSize] = useState("");
  const [color, setColor] = useState("");
  const [qty, setQty] = useState(1);
  const { addToCart, toggleWishlist, wishlist, user } = useStore();

  useEffect(() => {
    setData(null);
    api.get(`http://localhost:8001/api/products/${slug}`).then(({ data }) => {
      setData(data);
      setIdx(0);
      setSize(data.product.sizes[0] || "");
      setColor(data.product.colors?.[0]?.name || "");
    });
  }, [slug]);

  if (!data) return <div className="container-oc py-20 text-neutral-400" data-testid="loading">Loading...</div>;
  const p = data.product;

  const handleAdd = (buyNow = false) => {
    if (!size) { toast.error("Select a size"); return; }
    addToCart({
      product_id: p.id, name: p.name, image: p.images[0], price: p.price,
      size, color: color || undefined, qty,
    });
    if (buyNow) window.location.href = "/checkout";
  };

  const fav = wishlist.includes(p.id);

  return (
    <div className="container-oc py-10 md:py-14" data-testid="product-page">
      <div className="grid lg:grid-cols-[1.2fr_1fr] gap-10">
        {/* Gallery */}
        <div data-testid="gallery">
          <div className="aspect-[4/5] bg-ink-800 img-zoom-wrap">
            <img src={p.images[idx]} alt={p.name} className="w-full h-full object-cover" />
          </div>
          <div className="grid grid-cols-4 gap-2 mt-2">
            {p.images.map((src, i) => (
              <button key={i} onClick={() => setIdx(i)} className={`aspect-square bg-ink-800 border ${i === idx ? "border-gold" : "border-ink-500"}`} data-testid={`thumb-${i}`}>
                <img src={src} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        {/* Details */}
        <div className="lg:sticky lg:top-28 lg:self-start">
          {p.badges?.length > 0 && (
            <div className="flex gap-2 mb-3">
              {p.badges.map((b) => <span key={b} className="label-tiny px-2 py-1 bg-ink-700 border border-gold/40 text-gold">{b}</span>)}
            </div>
          )}
          <h1 className="display text-4xl md:text-5xl leading-tight" data-testid="product-name">{p.name}</h1>
          <div className="flex items-center gap-3 mt-3">
            <div className="flex items-center gap-1 text-gold"><Star size={14} fill="currentColor" /> <span className="mono text-sm">{p.rating}</span></div>
            <span className="text-neutral-500 text-xs">· {p.reviews?.length || 0} reviews · {p.sold_count}+ sold</span>
          </div>

          <div className="flex items-baseline gap-3 mt-5">
            <span className="mono text-3xl">{inr(p.price)}</span>
            {p.compare_at_price > p.price && <span className="text-neutral-500 line-through mono">{inr(p.compare_at_price)}</span>}
            {p.compare_at_price > p.price && (
              <span className="label-tiny px-2 py-1 bg-olive text-white">{Math.round((1 - p.price / p.compare_at_price) * 100)}% OFF</span>
            )}
          </div>
          <div className="label-tiny text-neutral-400 mt-1">Incl. GST. Free shipping over ₹1999.</div>

          {p.is_new_drop && p.drop_ends_at && (
            <div className="mt-6 p-4 border border-gold/30 bg-ink-800"><CountdownTimer target={p.drop_ends_at} /></div>
          )}

          {p.colors?.length > 0 && (
            <div className="mt-6">
              <div className="label-tiny mb-2">Color: <span className="text-white">{color}</span></div>
              <div className="flex gap-2">
                {p.colors.map((c) => (
                  <button key={c.name} onClick={() => setColor(c.name)}
                    className={`w-9 h-9 border-2 ${color === c.name ? "border-gold" : "border-ink-500"}`}
                    style={{ background: c.hex }} title={c.name} data-testid={`color-${c.name}`} />
                ))}
              </div>
            </div>
          )}

          <div className="mt-6">
            <div className="flex items-center justify-between mb-2"><span className="label-tiny">Size</span><a href="#" className="label-tiny hover:text-gold">Size Guide</a></div>
            <div className="flex flex-wrap gap-2">
              {p.sizes.map((s) => (
                <button key={s} onClick={() => setSize(s)}
                  className={`mono text-sm px-4 py-3 min-w-[52px] border ${size === s ? "border-gold text-gold" : "border-ink-500 hover:border-white"}`}
                  data-testid={`size-${s}`}>{s}</button>
              ))}
            </div>
          </div>

          <div className="mt-3 label-tiny text-neutral-500">
            Stock: <span className={p.stock < 20 ? "text-gold" : "text-green-400"}>{p.stock < 20 ? `Only ${p.stock} left` : "In stock"}</span>
          </div>

          <div className="flex items-center gap-3 mt-6">
            <div className="inline-flex items-center border border-ink-500">
              <button onClick={() => setQty(Math.max(1, qty - 1))} className="px-4 py-3" data-testid="qty-dec">−</button>
              <span className="mono px-3" data-testid="qty">{qty}</span>
              <button onClick={() => setQty(qty + 1)} className="px-4 py-3" data-testid="qty-inc">+</button>
            </div>
            <button onClick={() => handleAdd(false)} className="btn-primary flex-1" data-testid="add-to-cart">ADD TO CART</button>
          </div>
          <div className="flex items-center gap-3 mt-3">
            <button onClick={() => handleAdd(true)} className="btn-outline flex-1" data-testid="buy-now">BUY NOW</button>
            <button onClick={() => user ? toggleWishlist(p.id) : toast.error("Login to save items")}
              className={`p-4 border ${fav ? "border-gold text-gold" : "border-ink-500"} hover:border-gold`} data-testid="wishlist-btn">
              <Heart size={18} fill={fav ? "currentColor" : "none"} />
            </button>
          </div>

          <div className="mt-8 grid grid-cols-3 gap-3 text-xs">
            <div className="card-oc p-3 flex items-start gap-2"><Truck size={16} className="text-gold mt-0.5" /><div><div className="font-semibold">Free Shipping</div><div className="text-neutral-500">Over ₹1999</div></div></div>
            <div className="card-oc p-3 flex items-start gap-2"><RotateCcw size={16} className="text-gold mt-0.5" /><div><div className="font-semibold">7-Day Returns</div><div className="text-neutral-500">No questions</div></div></div>
            <div className="card-oc p-3 flex items-start gap-2"><ShieldCheck size={16} className="text-gold mt-0.5" /><div><div className="font-semibold">Authentic</div><div className="text-neutral-500">Direct from brand</div></div></div>
          </div>

          <div className="mt-10">
            <h3 className="label-tiny text-gold mb-3">Description</h3>
            <p className="text-neutral-300 text-sm leading-relaxed">{p.description}</p>
          </div>

          <div className="mt-8">
            <h3 className="label-tiny text-gold mb-3">Specifications</h3>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              {Object.entries(p.specs || {}).map(([k, v]) => (
                <div key={k} className="border-b border-ink-500 py-2">
                  <dt className="label-tiny text-neutral-500">{k}</dt>
                  <dd className="mt-0.5">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>

      {/* Reviews */}
      <section className="mt-20" data-testid="reviews">
        <h2 className="display text-3xl md:text-4xl">CUSTOMER REPORTS</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {(p.reviews || []).map((r, i) => (
            <div key={i} className="card-oc p-5">
              <div className="flex items-center gap-2 text-gold">
                {Array.from({ length: r.rating }).map((_, j) => <Star key={j} size={14} fill="currentColor" />)}
              </div>
              <p className="mt-3 text-sm text-neutral-300">"{r.comment}"</p>
              <div className="mt-3 label-tiny">— {r.user_name}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Similar */}
      <section className="mt-20">
        <h2 className="display text-3xl md:text-4xl mb-6">RUNS WITH</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {data.similar.map((sp) => <ProductCard key={sp.id} p={sp} />)}
        </div>
      </section>
    </div>
  );
}
