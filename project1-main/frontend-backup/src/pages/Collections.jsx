import { Link, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../lib/api";
import ProductCard from "../components/ProductCard";

const COLLECTIONS = {
  kargil: { title: "XIII KARGIL", tag: "Honor the Brave",
    desc: "A tribute to the regiments who held the line. Heritage prints, heavyweight fabrics, no compromises.",
    img: "https://images.unsplash.com/photo-1618924250456-0c7d405f2d53?w=1800&q=85" },
  operator: { title: "OPERATOR", tag: "Built for the Mission",
    desc: "The everyday tactical line. Reinforced, refined, ready.",
    img: "https://images.unsplash.com/photo-1552902875-9ac1f9fe0c07?w=1800&q=85" },
  fearless: { title: "FORGED FOR THE FEARLESS", tag: "The Signature Line",
    desc: "Bold graphics. Statement silhouettes. Unmistakably ours.",
    img: "https://images.pexels.com/photos/3933967/pexels-photo-3933967.jpeg?w=1800" },
  bravest: { title: "BRAVEST OF THE BRAVE", tag: "For the Few. The Proud.",
    desc: "Limited edition pieces with embroidered detailing and metallic gold accents.",
    img: "https://images.unsplash.com/photo-1611691543849-9f37b3c4ea88?w=1800&q=85" },
  patriot: { title: "PATRIOT", tag: "National Pride",
    desc: "Parade-inspired pieces with refined detailing and dignity.",
    img: "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=1800&q=85" },
};

export function CollectionsIndex() {
  return (
    <div className="container-oc py-12" data-testid="collections-index">
      <div className="label-tiny text-gold">// THE LINEUP</div>
      <h1 className="display text-5xl md:text-6xl mt-2 mb-10">COLLECTIONS</h1>
      <div className="grid md:grid-cols-2 gap-3 md:gap-4">
        {Object.entries(COLLECTIONS).map(([k, c]) => (
          <Link key={k} to={`/collections/${k}`} className="group relative img-zoom-wrap aspect-[16/10]" data-testid={`col-${k}`}>
            <img src={c.img} alt={c.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
            <div className="absolute inset-0 p-8 flex flex-col justify-end">
              <div className="label-tiny text-gold">{c.tag}</div>
              <div className="display text-4xl md:text-5xl mt-1 group-hover:text-gold">{c.title}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function CollectionDetail() {
  const { slug } = useParams();
  const c = COLLECTIONS[slug];
  const [items, setItems] = useState([]);
  useEffect(() => {
    api.get("/products", { params: { collection: slug } }).then(({ data }) => setItems(data));
  }, [slug]);
  if (!c) return <div className="container-oc py-20">Collection not found.</div>;

  return (
    <div data-testid="collection-detail">
      <section className="relative h-[60vh] min-h-[420px] overflow-hidden">
        <img src={c.img} alt={c.title} className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-black" />
        <div className="relative container-oc h-full flex flex-col justify-end pb-14">
          <div className="label-tiny text-gold">// COLLECTION</div>
          <h1 className="display text-6xl md:text-7xl mt-2">{c.title}</h1>
          <p className="text-neutral-300 max-w-xl mt-3">{c.desc}</p>
        </div>
      </section>
      <div className="container-oc py-16">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {items.map((p) => <ProductCard key={p.id} p={p} />)}
        </div>
      </div>
    </div>
  );
}
