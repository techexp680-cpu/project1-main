import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api, { inr } from "../lib/api";
import { CheckCircle2 } from "lucide-react";

export default function OrderSuccess() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  useEffect(() => { api.get(`/orders/track/${id}`).then(({ data }) => setOrder(data)); }, [id]);
  if (!order) return <div className="container-oc py-20">Loading...</div>;
  return (
    <div className="container-oc py-16 max-w-3xl" data-testid="order-success">
      <div className="text-center">
        <CheckCircle2 size={64} className="text-gold mx-auto" />
        <h1 className="display text-5xl mt-4">MISSION CONFIRMED</h1>
        <p className="text-neutral-400 mt-2">Order <span className="mono text-gold">{order.order_number}</span> placed successfully.</p>
        <p className="text-neutral-500 text-sm mt-1">A confirmation has been sent to {order.shipping_address.email}.</p>
      </div>
      <div className="card-oc p-6 mt-10">
        <h3 className="label-tiny text-gold">Order Total</h3>
        <div className="mono text-3xl text-white mt-1">{inr(order.total)}</div>
        <div className="grid grid-cols-2 gap-3 mt-5 text-sm">
          {order.items.map((it, i) => (
            <div key={i} className="flex gap-2"><img src={it.image} className="w-12 h-14 object-cover" alt="" /><div><div className="font-semibold">{it.name}</div><div className="label-tiny">× {it.qty}</div></div></div>
          ))}
        </div>
      </div>
      <div className="flex gap-3 mt-8">
        <Link to={`/track?order=${order.order_number}`} className="btn-primary flex-1" data-testid="track-link">TRACK ORDER</Link>
        <Link to="/shop" className="btn-outline flex-1">CONTINUE SHOPPING</Link>
      </div>
    </div>
  );
}
