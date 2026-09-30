import { Link } from "react-router-dom";
import { Instagram, Send } from "lucide-react";
import { useState } from "react";
import api from "../lib/api";
import { toast } from "sonner";

export default function Footer() {
  const [email, setEmail] = useState("");
  const submit = async (e) => {
    e.preventDefault();
    if (!email) return;
    try {
      await api.post("/newsletter", { email });
      toast.success("Welcome to the squad.");
      setEmail("");
    } catch {
      toast.error("Could not subscribe. Try again.");
    }
  };

  return (
    <footer className="bg-ink-900 border-t border-white/10 mt-24" data-testid="site-footer">
      <div className="container-oc py-16 grid md:grid-cols-12 gap-10">
        <div className="md:col-span-4">
          <div className="display text-3xl">OPERATOR<span className="text-gold">'</span>S CHOICE</div>
          <p className="text-neutral-400 mt-3 max-w-sm">Premium tactical streetwear, forged for those who refuse to back down. Made in India. Built for the world.</p>
          <form onSubmit={submit} className="mt-6 flex" data-testid="newsletter-form">
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required
                   placeholder="ENTER EMAIL" className="input-oc tracking-widest flex-1" data-testid="newsletter-input" />
            <button className="px-5 bg-gold text-black hover:bg-white transition-colors" data-testid="newsletter-submit"><Send size={18} /></button>
          </form>
        </div>

        <div className="md:col-span-2">
          <h4 className="label-tiny text-gold mb-4">Shop</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/shop?category=tees" className="hover:text-gold">T-Shirts</Link></li>
            <li><Link to="/shop?category=hoodies" className="hover:text-gold">Hoodies</Link></li>
            <li><Link to="/shop?category=cargo" className="hover:text-gold">Cargo Pants</Link></li>
            <li><Link to="/shop?category=caps" className="hover:text-gold">Caps</Link></li>
            <li><Link to="/shop?category=accessories" className="hover:text-gold">Accessories</Link></li>
          </ul>
        </div>

        <div className="md:col-span-2">
          <h4 className="label-tiny text-gold mb-4">Support</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/track" className="hover:text-gold">Track Order</Link></li>
            <li><Link to="/contact" className="hover:text-gold">Contact</Link></li>
            <li><a href="#" className="hover:text-gold">Shipping Policy</a></li>
            <li><a href="#" className="hover:text-gold">Returns</a></li>
            <li><a href="#" className="hover:text-gold">FAQ</a></li>
          </ul>
        </div>

        <div className="md:col-span-2">
          <h4 className="label-tiny text-gold mb-4">Brand</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/about" className="hover:text-gold">About</Link></li>
            <li><Link to="/collections" className="hover:text-gold">Collections</Link></li>
            <li><a href="#" className="hover:text-gold">Privacy Policy</a></li>
            <li><a href="#" className="hover:text-gold">Terms</a></li>
          </ul>
        </div>

        <div className="md:col-span-2">
          <h4 className="label-tiny text-gold mb-4">Follow</h4>
          <a href="https://instagram.com" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 hover:text-gold" data-testid="instagram-link">
            <Instagram size={18} /> @operatorschoice
          </a>
          <a href="https://wa.me/919999999999" target="_blank" rel="noreferrer" className="block mt-3 hover:text-gold" data-testid="whatsapp-link">WhatsApp Support</a>
        </div>
      </div>
      <div className="border-t border-white/10 py-6 container-oc flex flex-col md:flex-row justify-between gap-3 text-xs text-neutral-500">
        <div>© {new Date().getFullYear()} Operator's Choice. All rights reserved.</div>
        <div className="mono tracking-widest">FORGED FOR THE FEARLESS</div>
      </div>
    </footer>
  );
}
