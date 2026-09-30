import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

function money(value) {
  return "₹" + Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  });
}

export function TrackOrder() {
  const navigate = useNavigate();

  const [orderNo, setOrderNo] = useState("");
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function fetchOrder(number) {
    const cleanNumber = number.trim();

    if (!cleanNumber) {
      setError("Please enter order number.");
      return;
    }

    setLoading(true);
    setError("");
    setOrder(null);

    const xhr = new XMLHttpRequest();

    xhr.open(
      "GET",
      "http://localhost:8000/api/orders/track/" + encodeURIComponent(cleanNumber),
      true
    );

    xhr.timeout = 8000;

    xhr.onload = function () {
      setLoading(false);

      if (xhr.status === 200) {
        try {
          const data = JSON.parse(xhr.responseText);
          setOrder(data);
        } catch {
          setError("Order found but could not read order data.");
        }
      } else {
        setError("Order not found. Please check your order number.");
      }
    };

    xhr.onerror = function () {
      setLoading(false);
      setError("Browser could not connect to backend.");
    };

    xhr.ontimeout = function () {
      setLoading(false);
      setError("Request timed out. Backend did not reply.");
    };

    xhr.send();
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const orderFromUrl = params.get("order");

    if (orderFromUrl) {
      setOrderNo(orderFromUrl);
      fetchOrder(orderFromUrl);
    }
  }, []);

  function handleSubmit(e) {
    e.preventDefault();
    fetchOrder(orderNo);
  }

  return (
    <div className="min-h-screen bg-black text-white py-14 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-5 mb-8">
          <div>
            <p className="text-gold text-xs tracking-[0.3em] uppercase mb-3">
              // ORDER STATUS
            </p>

            <h1 className="display text-5xl md:text-6xl">
              TRACK ORDER
            </h1>
          </div>

          <button
            type="button"
            onClick={() => navigate(-1)}
            className="md:mt-3 inline-flex items-center justify-center gap-2 border border-white/10 px-4 py-3 text-xs tracking-[0.2em] uppercase text-neutral-300 hover:border-gold hover:text-gold transition w-fit"
          >
            <ArrowLeft size={16} />
            Back
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="border border-white/10 bg-white/[0.04] p-6 mb-8"
        >
          <label className="label-tiny text-neutral-400">
            Order Number
          </label>

          <input
            value={orderNo}
            onChange={(e) => setOrderNo(e.target.value)}
            placeholder="Example: OC2607053406"
            className="input-oc mt-2 mb-4"
          />

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full justify-center"
          >
            {loading ? "CHECKING..." : "TRACK ORDER"}
          </button>

          {error && (
            <p className="text-red-400 text-sm mt-4">
              {error}
            </p>
          )}
        </form>

        {order && (
          <div className="border border-white/10 bg-white/[0.04] p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <p className="label-tiny text-neutral-400">
                  Order Number
                </p>

                <h2 className="mono text-gold text-xl">
                  {order.order_number}
                </h2>
              </div>

              <div className="border border-gold text-gold px-4 py-2 text-xs tracking-[0.2em] uppercase">
                {order.status}
              </div>
            </div>

            <div>
              <h3 className="display text-2xl mb-3">
                Customer
              </h3>

              <p>Name: {order.shipping_address?.full_name}</p>

              <p className="text-neutral-400">
                Email: {order.shipping_address?.email}
              </p>

              <p className="text-neutral-400">
                Phone: {order.shipping_address?.phone}
              </p>
            </div>

            <div>
              <h3 className="display text-2xl mb-3">
                Items
              </h3>

              {(order.items || []).map((item, index) => (
                <div
                  key={index}
                  className="border-b border-white/10 pb-4 mb-4 flex justify-between gap-4"
                >
                  <div>
                    <p>{item.name}</p>

                    <p className="text-neutral-500 text-sm">
                      Qty: {item.qty} · Size: {item.size} · Color: {item.color}
                    </p>
                  </div>

                  <p className="mono">
                    {money(item.price)}
                  </p>
                </div>
              ))}
            </div>

            <div className="border-t border-white/10 pt-5">
              <div className="flex justify-between text-neutral-400">
                <span>Subtotal</span>
                <span>{money(order.subtotal)}</span>
              </div>

              <div className="flex justify-between text-neutral-400 mt-2">
                <span>GST</span>
                <span>{money(order.gst)}</span>
              </div>

              <div className="flex justify-between text-neutral-400 mt-2">
                <span>Shipping</span>
                <span>{money(order.shipping_fee)}</span>
              </div>

              <div className="flex justify-between text-xl text-gold mt-4 font-bold">
                <span>Total</span>
                <span>{money(order.total)}</span>
              </div>
            </div>

            <div>
              <h3 className="display text-2xl mb-3">
                Tracking
              </h3>

              <div className="space-y-3">
                {(order.tracking_steps || []).map((step, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <span>{step.done ? "✅" : "⬜"}</span>

                    <span
                      className={step.done ? "text-white" : "text-neutral-500"}
                    >
                      {step.step}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default TrackOrder;
