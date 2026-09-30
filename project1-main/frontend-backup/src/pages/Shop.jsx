import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../lib/api";
import ProductCard from "../components/ProductCard";

const CATEGORIES = [
  { v: "", l: "All" },
  { v: "tees", l: "T-Shirts" },
  { v: "hoodies", l: "Hoodies" },
  { v: "cargo", l: "Cargo Pants" },
  { v: "caps", l: "Caps" },
  { v: "accessories", l: "Accessories" },
];

const SIZES = ["S", "M", "L", "XL", "XXL"];

export default function Shop() {
  const [sp, setSp] = useSearchParams();
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
    api.get("http://localhost:8001/api/products", { params }).then(({ data }) => { setProducts(data); setLoading(false); });
  }, [category, collection, sort, minP, maxP, sizeF, q]);

  const setFilter = (k, v) => {
    const next = new URLSearchParams(sp);
    if (v) next.set(k, v); else next.delete(k);
    setSp(next);
  };

  const title = useMemo(() => {
    if (q) return `RESULTS FOR "${q.toUpperCase()}"`;
    if (collection) return collection.toUpperCase() + " COLLECTION";
    if (category) return (CATEGORIES.find(c => c.v === category)?.l || category).toUpperCase();
    return "ALL GEAR";
  }, [category, collection, q]);

  return (
    <div className="container-oc py-12" data-testid="shop-page">
      <div className="mb-8">
        <div className="label-tiny text-gold">// THE INVENTORY</div>
        <h1 className="display text-5xl md:text-6xl mt-2">{title}</h1>
        <p className="mono text-xs text-neutral-500 mt-2">{products.length} ITEMS</p>
      </div>

      <div className="grid lg:grid-cols-[260px_1fr] gap-8">
        {/* Filters */}
        <aside className="space-y-8" data-testid="filters">
          <div>
            <h3 className="label-tiny text-gold mb-3">Category</h3>
            <ul className="space-y-2">
              {CATEGORIES.map((c) => (
                <li key={c.v}>
                  <button onClick={() => setFilter("category", c.v)}
                    className={`text-sm w-full text-left py-1 ${category === c.v ? "text-gold" : "text-neutral-300 hover:text-white"}`}
                    data-testid={`filter-cat-${c.v || "all"}`}>{c.l}</button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="label-tiny text-gold mb-3">Price (₹)</h3>
            <div className="flex gap-2">
              <input value={minP} onChange={(e) => setFilter("min_price", e.target.value)} placeholder="Min" className="input-oc py-2 text-sm" data-testid="filter-min" />
              <input value={maxP} onChange={(e) => setFilter("max_price", e.target.value)} placeholder="Max" className="input-oc py-2 text-sm" data-testid="filter-max" />
            </div>
          </div>

          <div>
            <h3 className="label-tiny text-gold mb-3">Size</h3>
            <div className="flex flex-wrap gap-2">
              {SIZES.map((s) => (
                <button key={s} onClick={() => setFilter("size", sizeF === s ? "" : s)}
                  className={`mono text-xs px-3 py-2 border ${sizeF === s ? "border-gold text-gold" : "border-ink-500 text-neutral-300 hover:border-white"}`}
                  data-testid={`filter-size-${s}`}>{s}</button>
              ))}
            </div>
          </div>
        </aside>

        {/* Grid */}
        <div>
          <div className="flex items-center justify-between mb-5">
            <div className="hidden md:block label-tiny text-neutral-500">SORT BY</div>
            <select value={sort} onChange={(e) => setFilter("sort", e.target.value)}
              className="input-oc py-2 text-sm w-auto" data-testid="sort-select">
              <option value="newest">Newest</option>
              <option value="bestselling">Best Selling</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
              {Array.from({ length: 6 }).map((_, i) => <div key={i} className="bg-ink-800 aspect-[3/4]" />)}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20 text-neutral-400" data-testid="no-results">No products match the filters.</div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
              {products.map((p) => <ProductCard key={p.id} p={p} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
