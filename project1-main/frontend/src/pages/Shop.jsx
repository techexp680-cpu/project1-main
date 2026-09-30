import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import api from "../lib/api";
import ProductCard from "../components/ProductCard";

const CATEGORIES = [
  { type: "shop", v: "", l: "All" },
  { type: "shop", v: "tees", l: "T-Shirts" },
  { type: "shop", v: "hoodies", l: "Hoodies" },
  { type: "page", path: "/best-sellers", l: "Best Sellers" },
  { type: "page", path: "/new-drop", l: "New Drop" },
];

const SIZES = ["S", "M", "L", "XL", "XXL"];

export default function Shop() {
  const [sp, setSp] = useSearchParams();
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const category = sp.get("category") || "";
  const collection = sp.get("collection") || "";
  const sort = sp.get("sort") || "newest";
  const minP = sp.get("min_price") || "";
  const maxP = sp.get("max_price") || "";
  const sizeF = sp.get("size") || "";
  const q = sp.get("q") || "";

  useEffect(() => {
    setLoading(true);

    const params = {};

    if (category) params.category = category;
    if (collection) params.collection = collection;
    if (sort) params.sort = sort;
    if (minP) params.min_price = minP;
    if (maxP) params.max_price = maxP;
    if (sizeF) params.size = sizeF;
    if (q) params.q = q;

    api
      .get("http://localhost:8000/api/products", { params })
      .then(({ data }) => {
        setProducts(data);
        setLoading(false);
      })
      .catch(() => {
        setProducts([]);
        setLoading(false);
      });
  }, [category, collection, sort, minP, maxP, sizeF, q]);

  const setFilter = (key, value) => {
    const next = new URLSearchParams(sp);

    if (value) {
      next.set(key, value);
    } else {
      next.delete(key);
    }

    setSp(next);
  };

  const setCategory = (value) => {
    const next = new URLSearchParams(sp);

    if (value) {
      next.set("category", value);
    } else {
      next.delete("category");
    }

    next.delete("collection");
    setSp(next);
  };

  const clearFilters = () => {
    setSp({});
  };

  const title = useMemo(() => {
    if (q) return `RESULTS FOR "${q.toUpperCase()}"`;
    if (category === "tees") return "T-SHIRTS";
    if (category === "hoodies") return "HOODIES";
    return "ALL PRODUCTS";
  }, [category, q]);

  return (
    <div className="min-h-screen bg-black text-white" data-testid="shop-page">
      <section className="px-4 md:px-8 pt-12 pb-6 max-w-[1600px] mx-auto">
        <div className="mb-8">
          <div className="label-tiny text-gold">// THE INVENTORY</div>

          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mt-2">
            <div>
              <h1 className="display text-5xl md:text-7xl">
                {title}
              </h1>

              <p className="mono text-xs text-neutral-500 mt-2">
                {products.length} ITEMS AVAILABLE
              </p>
            </div>

            <button
              onClick={clearFilters}
              className="text-xs tracking-[0.2em] uppercase border border-white/10 px-4 py-3 hover:border-gold hover:text-gold transition w-fit"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Horizontal category bar */}
        <div className="sticky top-16 md:top-20 z-30 bg-black/90 backdrop-blur-xl border-y border-white/10 py-4 mb-6">
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
            {CATEGORIES.map((item) => {
              const active = item.type === "shop" && category === item.v;

              return (
                <button
                  key={item.l}
                  onClick={() => {
                    if (item.type === "page") {
                      navigate(item.path);
                    } else {
                      setCategory(item.v);
                    }
                  }}
                  className={`shrink-0 px-5 py-3 text-xs tracking-[0.22em] uppercase border transition-all duration-300 ${
                    active
                      ? "bg-gold text-black border-gold translate-y-[-2px]"
                      : "bg-white/[0.04] text-white/75 border-white/10 hover:border-gold hover:text-gold hover:translate-y-[-2px]"
                  }`}
                >
                  {item.l}
                </button>
              );
            })}
          </div>
        </div>

        {/* Compact filters */}
        <div className="grid md:grid-cols-[1fr_auto] gap-4 items-end mb-7">
          <div className="flex flex-wrap gap-3">
            <div className="flex gap-2">
              <input
                value={minP}
                onChange={(e) => setFilter("min_price", e.target.value)}
                placeholder="Min ₹"
                className="bg-ink-900 border border-white/10 px-4 py-3 text-sm outline-none focus:border-gold w-28"
                data-testid="filter-min"
              />

              <input
                value={maxP}
                onChange={(e) => setFilter("max_price", e.target.value)}
                placeholder="Max ₹"
                className="bg-ink-900 border border-white/10 px-4 py-3 text-sm outline-none focus:border-gold w-28"
                data-testid="filter-max"
              />
            </div>

            <div className="flex gap-2 overflow-x-auto">
              {SIZES.map((size) => (
                <button
                  key={size}
                  onClick={() => setFilter("size", sizeF === size ? "" : size)}
                  className={`mono text-xs px-4 py-3 border transition ${
                    sizeF === size
                      ? "border-gold text-gold bg-gold/10"
                      : "border-white/10 text-neutral-300 hover:border-white"
                  }`}
                  data-testid={`filter-size-${size}`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          <select
            value={sort}
            onChange={(e) => setFilter("sort", e.target.value)}
            className="bg-ink-900 border border-white/10 px-4 py-3 text-sm outline-none focus:border-gold"
            data-testid="sort-select"
          >
            <option value="newest">Newest</option>
            <option value="bestselling">Best Selling</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
          </select>
        </div>

        {/* Product grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="bg-ink-800 aspect-[3/4] animate-pulse border border-white/10"
              />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div
            className="text-center py-24 border border-white/10 bg-white/[0.03]"
            data-testid="no-results"
          >
            <p className="display text-3xl mb-3">NO PRODUCTS FOUND</p>
            <p className="text-neutral-400">
              Try changing category, size, or price filter.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} p={product} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
