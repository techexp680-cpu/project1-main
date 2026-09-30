export default function Marquee({
  items = [
    "OPERATOR'S CHOICE",
    "TACTICAL STREETWEAR",
    "XIII KARGIL DROP",
    "LIMITED EDITION",
    "MADE IN INDIA",
    "BUILT FOR THE FEARLESS",
  ],
}) {
  const repeatedItems = [...items, ...items, ...items, ...items];

  return (
    <section
      className="relative overflow-hidden border-y border-white/10 bg-black py-4"
      data-testid="marquee"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-black via-transparent to-black pointer-events-none z-10" />

      <div className="marquee-track flex gap-12 whitespace-nowrap">
        {repeatedItems.map((text, index) => (
          <div
            key={`${text}-${index}`}
            className="flex items-center gap-12 shrink-0"
          >
            <span className="display text-2xl md:text-4xl tracking-wider text-white/55 hover:text-gold transition-colors">
              {text}
            </span>

            <span className="inline-block w-2 h-2 bg-gold rotate-45" />
          </div>
        ))}
      </div>
    </section>
  );
}
