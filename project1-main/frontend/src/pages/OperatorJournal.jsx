import { useState } from "react";
import { Link } from "react-router-dom";

const categories = [
  "All",
  "War Heroes",
  "Operations",
  "Quick Facts",
  "Operator Notes",
];

const journalEntries = [
  {
    id: "001",
    category: "War Heroes",
    title: "Captain Vikram Batra: Courage Under Fire",
    label: "Param Vir Chakra · 13 JAK Rifles",
    excerpt:
      "A journal entry on courage, leadership, and the mindset of moving forward when the ground itself becomes the enemy.",
    readTime: "4 min read",
    image:
      "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1400&q=80",
  },
  {
    id: "002",
    category: "War Heroes",
    title: "Captain Manoj Kumar Pandey: The Will to Lead",
    label: "Param Vir Chakra · 1/11 Gorkha Rifles",
    excerpt:
      "A short note on initiative, aggression with purpose, and leading from the front when every second matters.",
    readTime: "4 min read",
    image:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1400&q=80",
  },
  {
    id: "003",
    category: "Operations",
    title: "Kargil 1999: Holding Impossible Ground",
    label: "Mountain Warfare · Discipline",
    excerpt:
      "A tactical-style briefing on terrain, altitude, patience, and why discipline becomes the strongest weapon in extreme conditions.",
    readTime: "5 min read",
    image:
      "https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=1400&q=80",
  },
  {
    id: "004",
    category: "Quick Facts",
    title: "Why Altitude Changes Everything",
    label: "Quick Fact · Endurance",
    excerpt:
      "At high altitude, movement becomes harder, recovery becomes slower, and mental control becomes just as important as strength.",
    readTime: "2 min read",
    image:
      "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1400&q=80",
  },
  {
    id: "005",
    category: "Operator Notes",
    title: "Comfort Fades. Discipline Stays.",
    label: "Mindset · Daily Execution",
    excerpt:
      "A practical note on why discipline is not motivation. Discipline is repeatable action when comfort disappears.",
    readTime: "3 min read",
    image:
      "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=1400&q=80",
  },
  {
    id: "006",
    category: "Operator Notes",
    title: "Why Black Tactical Wear Works",
    label: "Gear Intelligence · Design",
    excerpt:
      "Black is not only a color. It represents restraint, utility, confidence, and a clean visual identity.",
    readTime: "3 min read",
    image:
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1400&q=80",
  },
];

const quickFacts = [
  {
    title: "Mountain warfare demands patience.",
    text:
      "Terrain, weather, visibility, and oxygen levels can become as difficult as the opponent.",
  },
  {
    title: "Discipline is repeatable execution.",
    text:
      "Real discipline is not intensity for one day. It is showing up when the mood is gone.",
  },
  {
    title: "Every design should carry meaning.",
    text:
      "Operator’s Choice products should connect to identity, story, and mindset — not just graphics.",
  },
];

export default function OperatorJournal() {
  const [activeCategory, setActiveCategory] = useState("All");

  const filteredEntries =
    activeCategory === "All"
      ? journalEntries
      : journalEntries.filter((entry) => entry.category === activeCategory);

  const featured = journalEntries[0];

  return (
    <div className="min-h-screen bg-black text-white">
      <section className="relative border-b border-white/10 overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=1800&q=80"
            alt=""
            className="w-full h-full object-cover opacity-25"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/90 to-black/50" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
        </div>

        <div className="container-oc relative z-10 py-20 md:py-28">
          <p className="label-tiny text-gold mb-4">// BRAND INTELLIGENCE</p>

          <h1 className="display text-5xl md:text-7xl max-w-4xl leading-none">
            OPERATOR JOURNAL
          </h1>

          <p className="text-neutral-300 max-w-2xl mt-6 text-base md:text-lg leading-8">
            Real stories. Military-inspired briefings. Quick facts. Discipline
            notes. Gear intelligence. Built for people who read the meaning
            before they wear the product.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <a
              href="/downloads/operator-discipline-journal.pdf"
              download
              className="btn-primary justify-center"
            >
              DOWNLOAD DISCIPLINE JOURNAL
            </a>

            <Link to="/mission-board" className="btn-outline justify-center">
              OPEN MISSION BOARD
            </Link>
          </div>
        </div>
      </section>

      <section className="container-oc py-14">
        <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-5">
          <article className="border border-white/10 bg-white/[0.035] overflow-hidden">
            <div className="aspect-[16/9] bg-ink-800 overflow-hidden">
              <img
                src={featured.image}
                alt={featured.title}
                className="w-full h-full object-cover opacity-85"
              />
            </div>

            <div className="p-6 md:p-8">
              <p className="label-tiny text-gold">
                Featured Entry #{featured.id} · {featured.category}
              </p>

              <h2 className="display text-4xl md:text-5xl mt-4 leading-none">
                {featured.title}
              </h2>

              <p className="text-neutral-500 text-xs tracking-[0.2em] uppercase mt-3">
                {featured.label} · {featured.readTime}
              </p>

              <p className="text-neutral-300 mt-5 leading-8">
                {featured.excerpt}
              </p>

              <div className="mt-6 text-[10px] tracking-[0.22em] uppercase text-gold">
                Read Brief →
              </div>
            </div>
          </article>

          <div className="border border-gold/30 bg-gold/10 p-6 md:p-8 flex flex-col justify-between">
            <div>
              <p className="label-tiny text-gold mb-3">// FREE DOWNLOAD</p>

              <h2 className="display text-4xl leading-none">
                7-DAY DISCIPLINE JOURNAL
              </h2>

              <p className="text-neutral-300 mt-5 leading-8">
                A printable system for focus, habit tracking, daily mission
                planning, and weekly review.
              </p>

              <div className="mt-6 space-y-3 text-sm text-neutral-300">
                <div className="border-b border-white/10 pb-3">
                  Mission planning
                </div>
                <div className="border-b border-white/10 pb-3">
                  Daily habit tracking
                </div>
                <div className="border-b border-white/10 pb-3">
                  Weekly debrief
                </div>
                <div>Discipline score</div>
              </div>
            </div>

            <a
              href="/downloads/operator-discipline-journal.pdf"
              download
              className="btn-primary mt-8 justify-center"
            >
              DOWNLOAD PDF
            </a>
          </div>
        </div>
      </section>

      <section className="container-oc pb-8">
        <div className="flex gap-2 overflow-x-auto border-b border-white/10 pb-4">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setActiveCategory(category)}
              className={`px-4 py-3 text-xs tracking-[0.18em] uppercase border whitespace-nowrap transition-colors ${
                activeCategory === category
                  ? "bg-gold text-black border-gold"
                  : "border-white/10 text-neutral-400 hover:text-white hover:border-gold/50"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </section>

      <section className="container-oc pb-14">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEntries.map((entry) => (
            <article
              key={entry.id}
              className="border border-white/10 bg-white/[0.035] hover:border-gold/60 transition-colors overflow-hidden group"
            >
              <div className="aspect-[4/3] bg-ink-800 overflow-hidden">
                <img
                  src={entry.image}
                  alt={entry.title}
                  className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-700"
                />
              </div>

              <div className="p-5">
                <p className="label-tiny text-gold">
                  Entry #{entry.id} · {entry.category}
                </p>

                <h3 className="display text-2xl mt-3 leading-tight">
                  {entry.title}
                </h3>

                <p className="text-neutral-500 text-[10px] tracking-[0.16em] uppercase mt-2">
                  {entry.label}
                </p>

                <p className="text-neutral-400 text-sm leading-6 mt-4">
                  {entry.excerpt}
                </p>

                <div className="mt-5 flex items-center justify-between text-[10px] tracking-[0.18em] uppercase text-neutral-500">
                  <span>{entry.readTime}</span>
                  <span className="group-hover:text-gold">Read Brief →</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="container-oc pb-14">
        <div className="mb-6">
          <p className="label-tiny text-gold mb-2">// QUICK FACTS</p>
          <h2 className="display text-4xl">Signals Worth Remembering</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {quickFacts.map((fact) => (
            <div
              key={fact.title}
              className="border border-white/10 bg-white/[0.03] p-5"
            >
              <h3 className="display text-2xl">{fact.title}</h3>

              <p className="text-neutral-400 mt-4 leading-7">{fact.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container-oc pb-16">
        <div className="border border-white/10 bg-white/[0.035] p-6 md:p-8">
          <p className="label-tiny text-gold mb-3">// EDITORIAL CODE</p>

          <h2 className="display text-4xl">Respect First. Hype Never.</h2>

          <p className="text-neutral-400 max-w-3xl mt-4 leading-8">
            Operator Journal should treat real soldiers, operations, and history
            with respect. The goal is not loud drama. The goal is disciplined
            storytelling, useful facts, and meaningful product context.
          </p>

          <Link to="/shop" className="btn-outline mt-6 inline-flex">
            EXPLORE PRODUCTS
          </Link>
        </div>
      </section>
    </div>
  );
}
