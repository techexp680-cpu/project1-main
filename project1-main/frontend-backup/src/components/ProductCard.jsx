import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import { inr } from "../lib/api";
import { useStore } from "../lib/store";

export default function ProductCard({ p }) {
  const { wishlist, toggleWishlist, user } = useStore();
  const isFav = wishlist.includes(p.id);
  const onFav = (e) => { e.preventDefault(); if (user) toggleWishlist(p.id); };

  return (
    <Link to={`/product/${p.slug}`} className="group block bg-ink-800 border border-ink-500 hover:border-gold/60 transition-colors" data-testid={`product-card-${p.slug}`}>
      <div className="relative img-zoom-wrap bg-ink-700 aspect-[3/4] overflow-hidden">
        <img src={p.images[0]} alt={p.name} loading="lazy" className="w-full h-full object-cover" />
        {p.images[1] && (
          <img src={p.images[1]} alt="" className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        )}
        {p.badges?.length > 0 && (
          <div className="absolute top-3 left-3 flex flex-col gap-1">
            {p.badges.slice(0, 2).map((b) => (
              <span key={b} className={`label-tiny px-2 py-1 ${b === "Bestseller" ? "bg-gold text-black" : "bg-black/80 text-gold border border-gold/40"}`}>{b}</span>
            ))}
          </div>
        )}
        <button onClick={onFav} className="absolute top-3 right-3 p-2 bg-black/60 hover:bg-gold hover:text-black transition-colors" data-testid={`fav-${p.slug}`}>
          <Heart size={16} fill={isFav ? "currentColor" : "none"} />
        </button>
      </div>
      <div className="p-4">
        <div className="label-tiny">{p.category}</div>
        <h3 className="display text-xl mt-1 leading-tight group-hover:text-gold transition-colors">{p.name}</h3>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="mono text-base">{inr(p.price)}</span>
          {p.compare_at_price && p.compare_at_price > p.price && (
            <span className="text-xs text-neutral-500 line-through mono">{inr(p.compare_at_price)}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
