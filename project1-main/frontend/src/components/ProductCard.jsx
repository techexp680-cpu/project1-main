import { Link, useNavigate } from "react-router-dom";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { inr } from "../lib/api";
import { useStore } from "../lib/store";

export default function ProductCard({ p }) {
  const { wishlist, toggleWishlist, user } = useStore();
  const navigate = useNavigate();

  if (!p) return null;

  const productId = p.id || p._id;
  const productSlug = p.slug || productId;

  const images = Array.isArray(p.images)
    ? p.images.filter(Boolean)
    : p.image
    ? [p.image]
    : [];

  const mainImage = images[0];
  const hoverImage = images[1];

  const price = Number(p.price || 0);
  const comparePrice = Number(p.compare_at_price || 0);

  const isFav = wishlist?.includes(productId);
  const hasDiscount = comparePrice > price && price > 0;

  const discountPercent = hasDiscount
    ? Math.round(((comparePrice - price) / comparePrice) * 100)
    : 0;

  const isOutOfStock =
    p.in_stock === false ||
    p.stock === 0 ||
    p.stock_quantity === 0 ||
    p.inventory === 0;

  const badges = Array.isArray(p.badges) ? p.badges.filter(Boolean) : [];

  const productUrl = `/product/${productSlug}`;

  const handleWishlist = async (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (!user) {
      toast.error("Login to save products to wishlist.");
      navigate("/login?mode=login");
      return;
    }

    try {
      await toggleWishlist(productId);

      if (isFav) {
        toast.message("Removed from wishlist.");
      } else {
        toast.success("Added to wishlist.");
      }
    } catch {
      toast.error("Could not update wishlist.");
    }
  };

  return (
    <article
      className="group relative bg-ink-800 border border-ink-500 hover:border-gold/70 transition-all duration-300 hover:-translate-y-1"
      data-testid={`product-card-${productSlug}`}
    >
      <Link to={productUrl} className="block" aria-label={`View ${p.name}`}>
        <div className="relative bg-ink-700 aspect-[3/4] overflow-hidden">
          {mainImage ? (
            <img
              src={mainImage}
              alt={p.name || "Product image"}
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-black text-neutral-600 text-xs tracking-[0.2em] uppercase">
              No Image
            </div>
          )}

          {hoverImage && (
            <img
              src={hoverImage}
              alt=""
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-700"
            />
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-80" />

          {badges.length > 0 && (
            <div className="absolute top-3 left-3 flex flex-col gap-1">
              {badges.slice(0, 2).map((badge) => {
                const lowerBadge = String(badge).toLowerCase();

                return (
                  <span
                    key={badge}
                    className={`label-tiny px-2 py-1 ${
                      lowerBadge === "bestseller" ||
                      lowerBadge === "best seller"
                        ? "bg-gold text-black"
                        : "bg-black/80 text-gold border border-gold/40"
                    }`}
                  >
                    {badge}
                  </span>
                );
              })}
            </div>
          )}

          {hasDiscount && (
            <div className="absolute bottom-3 left-3 bg-red-600 text-white text-[10px] tracking-[0.18em] uppercase px-2 py-1 font-bold">
              {discountPercent}% Off
            </div>
          )}

          {isOutOfStock && (
            <div className="absolute inset-0 bg-black/65 flex items-center justify-center">
              <span className="border border-white/30 bg-black/80 px-4 py-2 text-xs tracking-[0.22em] uppercase text-white">
                Out of Stock
              </span>
            </div>
          )}
        </div>

        <div className="p-4">
          <div className="label-tiny text-neutral-500">
            {p.category || "Product"}
          </div>

          <h3 className="display text-xl mt-1 leading-tight group-hover:text-gold transition-colors line-clamp-2">
            {p.name || "Unnamed Product"}
          </h3>

          <div className="mt-2 flex items-baseline gap-2 flex-wrap">
            <span className="mono text-base text-white">
              {inr(price)}
            </span>

            {hasDiscount && (
              <span className="text-xs text-neutral-500 line-through mono">
                {inr(comparePrice)}
              </span>
            )}
          </div>

          <div className="mt-3 flex items-center justify-between gap-3">
            <span className="text-[10px] tracking-[0.2em] uppercase text-neutral-500 group-hover:text-gold transition-colors">
              View Product →
            </span>

            {p.rating && (
              <span className="text-[10px] tracking-[0.15em] uppercase text-neutral-500">
                ★ {Number(p.rating).toFixed(1)}
              </span>
            )}
          </div>
        </div>
      </Link>

      <button
        type="button"
        onClick={handleWishlist}
        className={`absolute top-3 right-3 p-2 border transition-colors ${
          isFav
            ? "bg-gold text-black border-gold"
            : "bg-black/75 text-white border-white/10 hover:bg-gold hover:text-black hover:border-gold"
        }`}
        data-testid={`fav-${productSlug}`}
        aria-label={isFav ? "Remove from wishlist" : "Add to wishlist"}
      >
        <Heart size={16} fill={isFav ? "currentColor" : "none"} />
      </button>
    </article>
  );
}
