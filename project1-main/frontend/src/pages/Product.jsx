import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Heart,
  Minus,
  Plus,
  RotateCcw,
  ShieldCheck,
  Star,
  Truck,
} from "lucide-react";
import { toast } from "sonner";

import api, { inr } from "../lib/api";
import { useStore } from "../lib/store";
import ProductCard from "../components/ProductCard";
import CountdownTimer from "../components/CountdownTimer";

export default function Product() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const { addToCart, toggleWishlist, wishlist, user } = useStore();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [imageIndex, setImageIndex] = useState(0);
  const [size, setSize] = useState("");
  const [color, setColor] = useState("");
  const [qty, setQty] = useState(1);

  useEffect(() => {
    async function loadProduct() {
      try {
        setLoading(true);
        setErr("");
        setData(null);

        const response = await api.get(
          `http://localhost:8000/api/products/${slug}`
        );

        const productData = response.data;
        const product = productData.product;

        setData(productData);
        setImageIndex(0);
        setSize(product?.sizes?.[0] || "");
        setColor(product?.colors?.[0]?.name || "");
        setQty(1);
      } catch {
        setErr("Product could not be loaded.");
      } finally {
        setLoading(false);
      }
    }

    loadProduct();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="container-oc py-20 text-neutral-400">
          Loading product...
        </div>
      </div>
    );
  }

  if (err || !data?.product) {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="container-oc py-20">
          <p className="display text-4xl mb-4">PRODUCT NOT FOUND</p>

          <p className="text-neutral-400 mb-6">
            {err || "This product is not available right now."}
          </p>

          <Link to="/shop" className="btn-primary">
            BACK TO SHOP
          </Link>
        </div>
      </div>
    );
  }

  const product = data.product;
  const images = Array.isArray(product.images) ? product.images : [];
  const selectedImage = images[imageIndex] || images[0];

  const isFav = wishlist?.includes(product.id);
  const hasDiscount =
    product.compare_at_price && product.compare_at_price > product.price;

  const discountPercent = hasDiscount
    ? Math.round((1 - product.price / product.compare_at_price) * 100)
    : 0;

  const similarProducts = Array.isArray(data.similar) ? data.similar : [];

  const maxQty = product.stock || 99;

  function handleAddToCart(buyNow = false) {
    if (!size) {
      toast.error("Please select a size.");
      return;
    }

    if (product.stock <= 0) {
      toast.error("This product is out of stock.");
      return;
    }

    addToCart({
      product_id: product.id,
      name: product.name,
      image: images[0],
      price: product.price,
      size,
      color: color || undefined,
      qty,
    });

    toast.success("Added to cart.");

    if (buyNow) {
      navigate("/checkout");
    }
  }

  async function handleWishlist() {
    if (!user) {
      toast.error("Login to save this product.");
      navigate("/login?mode=login");
      return;
    }

    try {
      await toggleWishlist(product.id);
    } catch {
      toast.error("Could not update wishlist.");
    }
  }

  return (
    <div
      className="min-h-screen bg-black text-white"
      data-testid="product-page"
    >
      <section className="container-oc py-10 md:py-14">
        <div className="grid lg:grid-cols-[1.15fr_0.85fr] gap-10 xl:gap-14">
          {/* Gallery */}
          <div data-testid="gallery">
            <div className="relative aspect-[4/5] bg-ink-800 border border-white/10 overflow-hidden">
              {selectedImage ? (
                <img
                  src={selectedImage}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-neutral-600 text-xs tracking-[0.2em] uppercase">
                  No Image
                </div>
              )}

              {product.badges?.length > 0 && (
                <div className="absolute top-4 left-4 flex flex-col gap-2">
                  {product.badges.slice(0, 2).map((badge) => (
                    <span
                      key={badge}
                      className="label-tiny px-3 py-2 bg-black/80 border border-gold/50 text-gold"
                    >
                      {badge}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-2 mt-3">
                {images.map((src, index) => (
                  <button
                    type="button"
                    key={index}
                    onClick={() => setImageIndex(index)}
                    className={`aspect-square bg-ink-800 border transition ${
                      index === imageIndex
                        ? "border-gold"
                        : "border-white/10 hover:border-white"
                    }`}
                    data-testid={`thumb-${index}`}
                  >
                    <img
                      src={src}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="lg:sticky lg:top-28 lg:self-start">
            <div className="flex items-start justify-between gap-5 mb-4">
              <div>
                <p className="label-tiny text-gold mb-3">
                  // PRODUCT DETAILS
                </p>

                <h1
                  className="display text-4xl md:text-5xl leading-tight"
                  data-testid="product-name"
                >
                  {product.name}
                </h1>
              </div>

              <button
                type="button"
                onClick={() => navigate(-1)}
                className="shrink-0 inline-flex items-center gap-2 border border-white/10 px-4 py-3 text-xs tracking-[0.2em] uppercase text-neutral-300 hover:border-gold hover:text-gold transition"
              >
                <ArrowLeft size={16} />
                Back
              </button>
            </div>

            <div className="flex items-center gap-3 mt-3">
              <div className="flex items-center gap-1 text-gold">
                <Star size={14} fill="currentColor" />

                <span className="mono text-sm">
                  {product.rating || 0}
                </span>
              </div>

              <span className="text-neutral-500 text-xs">
                · {product.reviews?.length || 0} reviews ·{" "}
                {product.sold_count || 0}+ sold
              </span>
            </div>

            <div className="flex flex-wrap items-baseline gap-3 mt-5">
              <span className="mono text-3xl">
                {inr(product.price)}
              </span>

              {hasDiscount && (
                <span className="text-neutral-500 line-through mono">
                  {inr(product.compare_at_price)}
                </span>
              )}

              {hasDiscount && (
                <span className="label-tiny px-2 py-1 bg-gold text-black">
                  {discountPercent}% OFF
                </span>
              )}
            </div>

            <div className="label-tiny text-neutral-400 mt-2">
              Incl. GST. Shipping calculated at checkout.
            </div>

            {product.is_new_drop && product.drop_ends_at && (
              <div className="mt-6 p-4 border border-gold/30 bg-white/[0.03]">
                <CountdownTimer target={product.drop_ends_at} />
              </div>
            )}

            {product.colors?.length > 0 && (
              <div className="mt-6">
                <div className="label-tiny mb-2">
                  Color: <span className="text-white">{color}</span>
                </div>

                <div className="flex gap-2">
                  {product.colors.map((item) => (
                    <button
                      type="button"
                      key={item.name}
                      onClick={() => setColor(item.name)}
                      className={`w-10 h-10 border-2 transition ${
                        color === item.name
                          ? "border-gold"
                          : "border-white/10 hover:border-white"
                      }`}
                      style={{ background: item.hex }}
                      title={item.name}
                      data-testid={`color-${item.name}`}
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="label-tiny">Size</span>

                <button
                  type="button"
                  onClick={() =>
                    toast.info("Size guide will be added before launch.")
                  }
                  className="label-tiny hover:text-gold transition"
                >
                  Size Guide
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {(product.sizes || []).map((item) => (
                  <button
                    type="button"
                    key={item}
                    onClick={() => setSize(item)}
                    className={`mono text-sm px-4 py-3 min-w-[52px] border transition ${
                      size === item
                        ? "border-gold text-gold bg-gold/10"
                        : "border-white/10 hover:border-white"
                    }`}
                    data-testid={`size-${item}`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4 label-tiny text-neutral-500">
              Stock:{" "}
              <span
                className={
                  product.stock < 20 ? "text-gold" : "text-green-400"
                }
              >
                {product.stock <= 0
                  ? "Out of stock"
                  : product.stock < 20
                  ? `Only ${product.stock} left`
                  : "In stock"}
              </span>
            </div>

            <div className="flex items-center gap-3 mt-6">
              <div className="inline-flex items-center border border-white/10">
                <button
                  type="button"
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  className="px-4 py-3 hover:bg-white/10 transition"
                  data-testid="qty-dec"
                >
                  <Minus size={15} />
                </button>

                <span className="mono px-4" data-testid="qty">
                  {qty}
                </span>

                <button
                  type="button"
                  onClick={() => setQty(Math.min(maxQty, qty + 1))}
                  className="px-4 py-3 hover:bg-white/10 transition"
                  data-testid="qty-inc"
                >
                  <Plus size={15} />
                </button>
              </div>

              <button
                type="button"
                onClick={() => handleAddToCart(false)}
                className="btn-primary flex-1 justify-center"
                data-testid="add-to-cart"
              >
                ADD TO CART
              </button>
            </div>

            <div className="flex items-center gap-3 mt-3">
              <button
                type="button"
                onClick={() => handleAddToCart(true)}
                className="btn-outline flex-1 justify-center"
                data-testid="buy-now"
              >
                BUY NOW
              </button>

              <button
                type="button"
                onClick={handleWishlist}
                className={`p-4 border transition ${
                  isFav
                    ? "border-gold text-gold"
                    : "border-white/10 hover:border-gold"
                }`}
                data-testid="wishlist-btn"
                aria-label="Wishlist"
              >
                <Heart size={18} fill={isFav ? "currentColor" : "none"} />
              </button>
            </div>

            <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <InfoCard
                icon={<Truck size={16} />}
                title="Shipping"
                subtitle="Calculated at checkout"
              />

              <InfoCard
                icon={<RotateCcw size={16} />}
                title="7-Day Support"
                subtitle="Easy exchange help"
              />

              <InfoCard
                icon={<ShieldCheck size={16} />}
                title="Authentic"
                subtitle="Direct from brand"
              />
            </div>

            <div className="mt-10">
              <h3 className="label-tiny text-gold mb-3">
                Description
              </h3>

              <p className="text-neutral-300 text-sm leading-relaxed">
                {product.description ||
                  "Premium tactical streetwear from Operator’s Choice."}
              </p>
            </div>

            {Object.keys(product.specs || {}).length > 0 && (
              <div className="mt-8">
                <h3 className="label-tiny text-gold mb-3">
                  Specifications
                </h3>

                <dl className="grid grid-cols-2 gap-3 text-sm">
                  {Object.entries(product.specs || {}).map(([key, value]) => (
                    <div key={key} className="border-b border-white/10 py-2">
                      <dt className="label-tiny text-neutral-500">
                        {key}
                      </dt>

                      <dd className="mt-0.5">
                        {value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}
          </div>
        </div>

        {/* Reviews */}
        <section className="mt-20" data-testid="reviews">
          <h2 className="display text-3xl md:text-4xl">
            CUSTOMER REPORTS
          </h2>

          {product.reviews?.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
              {product.reviews.map((review, index) => (
                <div
                  key={index}
                  className="border border-white/10 bg-white/[0.03] p-5"
                >
                  <div className="flex items-center gap-2 text-gold">
                    {Array.from({
                      length: Math.round(review.rating || 0),
                    }).map((_, starIndex) => (
                      <Star
                        key={starIndex}
                        size={14}
                        fill="currentColor"
                      />
                    ))}
                  </div>

                  <p className="mt-3 text-sm text-neutral-300">
                    “{review.comment}”
                  </p>

                  <div className="mt-3 label-tiny">
                    — {review.user_name}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="border border-white/10 bg-white/[0.03] p-6 mt-6 text-neutral-400">
              No customer reports yet.
            </div>
          )}
        </section>

        {/* Similar Products */}
        {similarProducts.length > 0 && (
          <section className="mt-20">
            <div className="flex items-end justify-between mb-6">
              <h2 className="display text-3xl md:text-4xl">
                RUNS WITH
              </h2>

              <Link
                to="/shop"
                className="label-tiny hover:text-gold transition"
              >
                VIEW ALL →
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {similarProducts.map((similarProduct) => (
                <ProductCard
                  key={similarProduct.id}
                  p={similarProduct}
                />
              ))}
            </div>
          </section>
        )}
      </section>
    </div>
  );
}

function InfoCard({ icon, title, subtitle }) {
  return (
    <div className="border border-white/10 bg-white/[0.03] p-3 flex items-start gap-2">
      <div className="text-gold mt-0.5">
        {icon}
      </div>

      <div>
        <div className="font-semibold">
          {title}
        </div>

        <div className="text-neutral-500">
          {subtitle}
        </div>
      </div>
    </div>
  );
}
