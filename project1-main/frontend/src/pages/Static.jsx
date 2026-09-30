import { useState } from "react";
import api from "../lib/api";
import { toast } from "sonner";
import { MessageCircle, Mail, Instagram, Clock, MapPin } from "lucide-react";

export function Contact() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const submit = async (e) => {
    e.preventDefault();
    try { await api.post("/contact", form); toast.success("Message received."); setForm({ name: "", email: "", message: "" }); }
    catch { toast.error("Send failed"); }
  };
  return (
    <div className="container-oc py-12" data-testid="contact-page">
      <div className="label-tiny text-gold">// SUPPORT</div>
      <h1 className="display text-5xl md:text-6xl mt-2 mb-10">GET IN TOUCH</h1>
      <div className="grid lg:grid-cols-[1fr_1fr] gap-10">
        <form onSubmit={submit} className="space-y-4 card-oc p-6">
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="YOUR NAME" className="input-oc tracking-widest" required data-testid="contact-name" />
          <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} type="email" placeholder="EMAIL" className="input-oc tracking-widest" required data-testid="contact-email" />
          <textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="MESSAGE" rows={5} className="input-oc tracking-widest" required data-testid="contact-message" />
          <button className="btn-primary w-full" data-testid="contact-submit">SEND MESSAGE</button>
        </form>

        <div className="space-y-4">
          <div className="card-oc p-5 flex items-start gap-3"><MessageCircle className="text-gold" /><div><div className="font-semibold">WhatsApp Support</div><a href="https://wa.me/919999999999" className="text-neutral-400 text-sm hover:text-gold">+91 99999 99999</a></div></div>
          <div className="card-oc p-5 flex items-start gap-3"><Mail className="text-gold" /><div><div className="font-semibold">Email</div><a href="mailto:support@operatorschoice.com" className="text-neutral-400 text-sm hover:text-gold">support@operatorschoice.com</a></div></div>
          <div className="card-oc p-5 flex items-start gap-3"><Instagram className="text-gold" /><div><div className="font-semibold">Instagram</div><a href="https://instagram.com" className="text-neutral-400 text-sm hover:text-gold">@operatorschoice</a></div></div>
          <div className="card-oc p-5 flex items-start gap-3"><Clock className="text-gold" /><div><div className="font-semibold">Hours</div><div className="text-neutral-400 text-sm">Mon–Sat · 10am to 7pm IST</div></div></div>
          <div className="card-oc p-5 flex items-start gap-3"><MapPin className="text-gold" /><div><div className="font-semibold">HQ</div><div className="text-neutral-400 text-sm">Bengaluru, India</div></div></div>
        </div>
      </div>
    </div>
  );
}

export function About() {
  return (
    <div data-testid="about-page">
      <section className="relative h-[60vh] overflow-hidden">
        <img src="https://images.unsplash.com/photo-1579883180654-695b7f038d4c?w=2000&q=85" alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/30" />
        <div className="relative container-oc h-full flex flex-col justify-end pb-14">
          <div className="label-tiny text-gold">// OUR STORY</div>
          <h1 className="display text-6xl md:text-7xl mt-2">BUILT BY THE BOLD.</h1>
        </div>
      </section>
      <div className="container-oc py-16 max-w-3xl space-y-6 text-neutral-300">
        <p>Operator's Choice was born from a single conviction: that streetwear should mean something. That what you wear should reflect what you stand for. We craft tactical streetwear for those who refuse to back down — fitness athletes, motorcycle riders, military families, and anyone who believes in discipline, strength, and quiet excellence.</p>
        <p>Every piece is engineered with heavyweight fabrics, military-grade stitching, and prints inspired by the regiments who taught us what courage looks like. From the XIII Kargil tribute to the Operator collection built for everyday missions — we make gear that earns its place in your rotation.</p>
        <p className="display text-4xl text-gold pt-4">FORGED FOR THE FEARLESS.</p>
      </div>
    </div>
  );
}
