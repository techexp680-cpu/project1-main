import { useEffect, useState } from "react";
import api from "../lib/api";
import ProductCard from "../components/ProductCard";
import CountdownTimer from "../components/CountdownTimer";
import Marquee from "../components/Marquee";

export function NewDrop() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    api
      .get("http://localhost:8001/api/products/new-drops")
      .then(({ data }) => setItems(data));
  }, []);

  const featured = items[0];

  return (
    <div data-testid="newdrop-page">
      <section className="relative h-[60vh] min-h-[400px] overflow-hidden">
        <img src="https://images.pexels.com/photos/3933967/pexels-photo-3933967.jpeg?w=2000" alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/30" />
        <div className="relative container-oc h-full flex flex-col justify-end pb-14">
          <div className="label-tiny text-gold">// LIMITED RELEASE</div>
          <h1 className="display text-6xl md:text-7xl mt-2">THE NEW DROP</h1>
          {featured?.drop_ends_at && <div className="mt-6"><CountdownTimer target={featured.drop_ends_at} /></div>}
        </div>
      </section>

      <Marquee items={["ONE TIME DROP", "DONT MISS OUT", "ONCE GONE, GONE", "FORGED FOR THE FEARLESS"]} />

      <div className="container-oc py-16">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {items.map((p) => <ProductCard key={p.id} p={p} />)}
        </div>
      </div>
    </div>
  );
}

export function BestSellers() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    api
      .get("http://localhost:8001/api/products/best-sellers?limit=24")
      .then(({ data }) => setItems(data));
  }, []);

  return (
    <div className="container-oc py-12" data-testid="best-page">
      <div className="label-tiny text-gold">// MOST WANTED</div>
      <h1 className="display text-5xl md:text-6xl mt-2 mb-10">BEST SELLERS</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {items.map((p) => <ProductCard key={p.id} p={p} />)}
      </div>
    </div>
  );
}