export default function Marquee({ items = ["FORGED FOR THE FEARLESS", "XIII KARGIL DROP", "LIMITED EDITION", "MADE IN INDIA"] }) {
  const doubled = [...items, ...items, ...items, ...items];
  return (
    <div className="relative overflow-hidden border-y border-white/10 bg-ink-800 py-4" data-testid="marquee">
      <div className="marquee-track gap-12 whitespace-nowrap">
        {doubled.map((t, i) => (
          <span key={i} className="display text-2xl md:text-3xl tracking-wider text-white/60 flex items-center gap-12">
            {t}
            <span className="inline-block w-2 h-2 bg-gold" />
          </span>
        ))}
      </div>
    </div>
  );
}
