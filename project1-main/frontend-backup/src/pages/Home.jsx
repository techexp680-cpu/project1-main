import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../lib/api";
import ProductCard from "../components/ProductCard";
import Marquee from "../components/Marquee";
import CountdownTimer from "../components/CountdownTimer";
import { ArrowRight, ShieldCheck, Truck, Crown, Zap } from "lucide-react";

const HERO_BG = "https://images.unsplash.com/photo-1579883180654-695b7f038d4c?w=2200&q=85";
const COLLECTIONS = [
  { slug: "kargil", title: "XIII KARGIL", sub: "Honor the brave.", img: "https://images.unsplash.com/photo-1618924250456-0c7d405f2d53?w=1200&q=80" },
  { slug: "operator", title: "OPERATOR", sub: "Built for the mission.", img: "https://images.unsplash.com/photo-1552902875-9ac1f9fe0c07?w=1200&q=80" },
  { slug: "fearless", title: "FORGED FOR THE FEARLESS", sub: "The signature line.", img: "https://images.pexels.com/photos/3933967/pexels-photo-3933967.jpeg?w=1200" },
  { slug: "bravest", title: "BRAVEST OF THE BRAVE", sub: "For the few. The proud.", img: "https://images.unsplash.com/photo-1611691543849-9f37b3c4ea88?w=1200&q=80" },
];

export default function Home() {
  const [drops, setDrops] = useState([]);
  const [best, setBest] = useState([]);
  useEffect(() => {
  api
    .get("http://localhost:8001/api/products/new-drops")
    .then(({ data }) => {
      setDrops(data);
    });

  api
    .get("http://localhost:8001/api/products/best-sellers?limit=8")
    .then(({ data }) => {
      setBest(data);
    });
}, []);

  const featuredDrop = drops[0];

  return (
    <div data-testid="home-page">
      {/* HERO */}
      <section className="relative h-[92vh] min-h-[640px] overflow-hidden grain" data-testid="hero">
        <img src={HERO_BG} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/55 to-black" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/20 to-transparent" />
        <div className="relative container-oc h-full flex flex-col justify-end pb-20 md:pb-28">
          <div className="label-tiny text-gold mb-4 animate-fade-up">// COLLECTION 01 — XIII KARGIL</div>
          <h1 className="display text-6xl sm:text-7xl md:text-[110px] leading-[0.85] tracking-tight max-w-4xl animate-fade-up" style={{ animationDelay: "0.1s" }}>
            FORGED <br /> FOR THE <br /><span className="text-gold">FEARLESS.</span>
          </h1>
          <p className="text-neutral-300 max-w-md mt-6 text-sm md:text-base animate-fade-up" style={{ animationDelay: "0.2s" }}>
            Premium tactical streetwear engineered for those who don't ask for permission.
            Made in India. Built for the world.
          </p>
          <div className="flex flex-wrap gap-4 mt-8 animate-fade-up" style={{ animationDelay: "0.3s" }}>
            <Link to="/shop" className="btn-primary" data-testid="hero-shop-now">SHOP NOW <ArrowRight className="ml-2" size={16} /></Link>
            <Link to="/new-drop" className="btn-outline" data-testid="hero-new-drop">NEW DROP</Link>
          </div>
        </div>
      </section>

      <Marquee />

      {/* Featured drop banner */}
      {featuredDrop && (
        <section className="bg-ink-900 border-b border-white/10" data-testid="drop-banner">
          <div className="container-oc grid md:grid-cols-2 gap-10 py-16 md:py-24 items-center">
            <div className="img-zoom-wrap aspect-[4/5]">
              <img src={featuredDrop.images[0]} alt={featuredDrop.name} className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="label-tiny text-gold">ONE TIME DROP</div>
              <h2 className="display text-5xl md:text-6xl mt-3">{featuredDrop.name.toUpperCase()}</h2>
              <p className="text-neutral-300 mt-4 max-w-md">{featuredDrop.description}</p>
              {featuredDrop.drop_ends_at && (
                <div className="mt-8"><CountdownTimer target={featuredDrop.drop_ends_at} /></div>
              )}
              <Link to={`/product/${featuredDrop.slug}`} className="btn-primary mt-8" data-testid="drop-cta">SECURE YOURS <ArrowRight className="ml-2" size={16} /></Link>
            </div>
          </div>
        </section>
      )}

      {/* Best sellers */}
      <section className="container-oc py-20 md:py-28" data-testid="best-section">
        <div className="flex items-end justify-between mb-10">
          <div>
            <div className="label-tiny text-gold">// BEST SELLERS</div>
            <h2 className="display text-4xl md:text-5xl mt-2">THE MOST WANTED</h2>
          </div>
          <Link to="/best-sellers" className="hidden md:inline-flex label-tiny hover:text-gold">VIEW ALL →</Link>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {best.slice(0, 8).map((p) => <ProductCard key={p.id} p={p} />)}
        </div>
      </section>

      {/* Collections Bento */}
      <section className="bg-ink-900 py-20 md:py-28 border-y border-white/10" data-testid="collections-section">
        <div className="container-oc">
          <div className="label-tiny text-gold">// THE LINEUP</div>
          <h2 className="display text-4xl md:text-5xl mt-2 mb-10">COLLECTIONS BUILT WITH PURPOSE</h2>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4">
            {COLLECTIONS.map((c, i) => (
              <Link key={c.slug} to={`/collections/${c.slug}`}
                className={`group relative img-zoom-wrap overflow-hidden aspect-[3/4] md:aspect-auto ${i === 0 ? "md:col-span-7 md:row-span-2" : "md:col-span-5"}`}
                style={{ minHeight: i === 0 ? 520 : 240 }}
                data-testid={`collection-${c.slug}`}>
                <img src={c.img} alt={c.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
                <div className="absolute inset-0 p-6 md:p-8 flex flex-col justify-end">
                  <div className="label-tiny text-gold">// COLLECTION</div>
                  <div className="display text-3xl md:text-5xl mt-1 group-hover:text-gold transition-colors">{c.title}</div>
                  <div className="text-neutral-300 text-sm mt-1">{c.sub}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Value props */}
      <section className="container-oc py-16 grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4" data-testid="value-props">
        {[
          { i: <ShieldCheck size={28} />, t: "Premium Build", s: "Heavyweight fabrics, military-grade stitching." },
          { i: <Truck size={28} />, t: "Fast Shipping", s: "2-5 day delivery across India." },
          { i: <Crown size={28} />, t: "Limited Drops", s: "One-time releases. Once they're gone, they're gone." },
          { i: <Zap size={28} />, t: "Easy Returns", s: "7-day no-questions-asked exchange policy." },
        ].map((b) => (
          <div key={b.t} className="card-oc p-6">
            <div className="text-gold">{b.i}</div>
            <div className="display text-2xl mt-3">{b.t}</div>
            <div className="text-neutral-400 text-sm mt-1">{b.s}</div>
          </div>
        ))}
      </section>

      <Marquee items={["MADE IN INDIA", "FORGED FOR THE FEARLESS", "TACTICAL STREETWEAR", "OPERATOR'S CHOICE"]} />
    </div>
  );
}
