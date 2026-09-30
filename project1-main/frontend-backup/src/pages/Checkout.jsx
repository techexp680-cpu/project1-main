import { useEffect, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import api, { inr } from "../lib/api";
import { useStore } from "../lib/store";
import { toast } from "sonner";

const RAZORPAY_SCRIPT = "https://checkout.razorpay.com/v1/checkout.js";

/*
  TEMPORARY ₹2 TEST MODE

  true  = Product ₹1 + Shipping ₹1 + GST ₹0 = Total ₹2
  false = Normal real checkout calculation

  IMPORTANT:
  After Razorpay testing is complete, change this back to false.
*/
const TEST_PAYMENT_MODE = true;
const TEST_PRODUCT_PRICE = 1;
const TEST_SHIPPING = 1;
const TEST_GST = 0;

function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const existingScript = document.querySelector(
      `script[src="${RAZORPAY_SCRIPT}"]`
    );

    if (existingScript) {
      existingScript.onload = () => resolve(true);
      existingScript.onerror = () => resolve(false);
      return;
    }

    const script = document.createElement("script");
    script.src = RAZORPAY_SCRIPT;
    script.async = true;

    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);

    document.body.appendChild(script);
  });
}

export default function Checkout() {
  const { cart, subtotal, clearCart, user } = useStore();

  const loc = useLocation();
  const nav = useNavigate();

  const [coupon] = useState(loc.state?.coupon || null);

  const [payCfg, setPayCfg] = useState({
    is_live: false,
    key_id: "",
    currency: "INR",
  });

  const [razorpayReady, setRazorpayReady] = useState(false);
  const [paying, setPaying] = useState(false);

  const [form, setForm] = useState({
    full_name: user?.name || "",
    phone: user?.phone || "",
    email: user?.email || "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    pincode: "",
    landmark: "",
  });

  useEffect(() => {
    async function setupPayment() {
      try {
        const scriptLoaded = await loadRazorpayScript();
        setRazorpayReady(scriptLoaded);

        const { data } = await api.get(
          "http://localhost:8001/api/payments/config"
        );

        setPayCfg({
          is_live: Boolean(data.is_live),
          key_id: data.key_id || "",
          currency: data.currency || "INR",
        });
      } catch {
        setPayCfg({
          is_live: false,
          key_id: "",
          currency: "INR",
        });

        setRazorpayReady(false);
      }
    }

    setupPayment();
  }, []);

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="container-oc py-20 text-center">
          <h1 className="display text-4xl">CART IS EMPTY</h1>

          <Link to="/shop" className="btn-primary mt-6 inline-flex">
            SHOP NOW
          </Link>
        </div>
      </div>
    );
  }

  const normalDiscount = coupon
    ? coupon.discount_type === "percent"
      ? (subtotal * coupon.value) / 100
      : coupon.value
    : 0;

  const discount = TEST_PAYMENT_MODE ? 0 : normalDiscount;

  const afterDisc = TEST_PAYMENT_MODE
    ? TEST_PRODUCT_PRICE
    : Math.max(subtotal - discount, 0);

  const shipping = TEST_PAYMENT_MODE
    ? TEST_SHIPPING
    : coupon?.code === "FREESHIP" || afterDisc >= 1999
    ? 0
    : 99;

  const gst = TEST_PAYMENT_MODE
    ? TEST_GST
    : Math.round(afterDisc * 0.05);

  const total = afterDisc + shipping + gst;

  const paymentItems = TEST_PAYMENT_MODE
    ? cart.slice(0, 1).map((item) => ({
        ...item,
        price: TEST_PRODUCT_PRICE,
        qty: 1,
      }))
    : cart;

  const onChange = (key) => (event) => {
    setForm({
      ...form,
      [key]: event.target.value,
    });
  };

  const validate = () => {
    const requiredFields = [
      "full_name",
      "phone",
      "email",
      "line1",
      "city",
      "state",
      "pincode",
    ];

    for (const field of requiredFields) {
      if (!String(form[field] || "").trim()) {
        toast.error("Please fill all required fields.");
        return false;
      }
    }

    if (!/^\S+@\S+\.\S+$/.test(form.email)) {
      toast.error("Please enter a valid email address.");
      return false;
    }

    if (!/^[6-9]\d{9}$/.test(form.phone)) {
      toast.error("Please enter a valid 10 digit Indian phone number.");
      return false;
    }

    if (!/^\d{6}$/.test(form.pincode)) {
      toast.error("Please enter a valid 6 digit pincode.");
      return false;
    }

    return true;
  };

  const placeOrder = async (event) => {
    event.preventDefault();

    if (!validate()) return;

    if (!payCfg.key_id) {
      toast.error("Razorpay key is missing. Check backend payment config.");
      return;
    }

    if (!razorpayReady || !window.Razorpay) {
      toast.error("Razorpay checkout could not load. Refresh and try again.");
      return;
    }

    setPaying(true);

    try {
      const { data: razorpayOrder } = await api.post(
        "http://localhost:8001/api/payments/create-order",
        {
          items: paymentItems,
          shipping_address: form,
          coupon_code: coupon?.code || null,

          test_payment_mode: TEST_PAYMENT_MODE,
          test_product_price: TEST_PRODUCT_PRICE,
          test_shipping: TEST_SHIPPING,
          test_gst: TEST_GST,
          test_total: total,
        }
      );

      const options = {
        key: payCfg.key_id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency || "INR",
        order_id: razorpayOrder.id,

        name: "Operator's Choice",
        description: TEST_PAYMENT_MODE
          ? "₹2 Test Payment"
          : "Forged for the Fearless",

        image: "",

        prefill: {
          name: form.full_name,
          email: form.email,
          contact: form.phone,
        },

        notes: {
          brand: "Operator's Choice",
          city: form.city,
          pincode: form.pincode,
          test_payment_mode: TEST_PAYMENT_MODE ? "yes" : "no",
        },

        theme: {
          color: "#D4AF37",
        },

        retry: {
          enabled: true,
          max_count: 1,
        },

        handler: async function (response) {
          try {
            const { data: order } = await api.post(
              "http://localhost:8001/api/payments/verify",
              {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,

                items: paymentItems,
                shipping_address: form,
                coupon_code: coupon?.code || null,

                test_payment_mode: TEST_PAYMENT_MODE,
                test_product_price: TEST_PRODUCT_PRICE,
                test_shipping: TEST_SHIPPING,
                test_gst: TEST_GST,
                test_total: total,
              }
            );

            clearCart();

            toast.success("Payment successful. Order confirmed.");

            nav(`/track?order=${order.order_number}`, {
              replace: true,
            });
          } catch (error) {
            toast.error(
              error.response?.data?.detail ||
                "Payment done, but verification failed. Contact support."
            );

            setPaying(false);
          }
        },

        modal: {
          ondismiss: function () {
            setPaying(false);
            toast.message("Payment cancelled.");
          },
        },
      };

      const razorpay = new window.Razorpay(options);

      razorpay.on("payment.failed", function (response) {
        toast.error(
          response.error?.description || "Payment failed. Please try again."
        );

        setPaying(false);
      });

      razorpay.open();
    } catch (error) {
      toast.error(
        error.response?.data?.detail ||
          error.message ||
          "Could not start payment. Try again."
      );

      setPaying(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container-oc py-10" data-testid="checkout-page">
        <div className="mb-8">
          <p className="label-tiny text-gold mb-3">// SECURE CHECKOUT</p>

          <h1 className="display text-5xl">CHECKOUT</h1>

          <p className="text-neutral-500 text-sm mt-2">
            Complete shipping details and pay securely with Razorpay.
          </p>

          {TEST_PAYMENT_MODE && (
            <div className="mt-4 border border-gold/40 bg-gold/10 text-gold px-4 py-3 text-xs tracking-[0.18em] uppercase">
              Test mode active: Product ₹1 + Shipping ₹1 + GST ₹0 = ₹2
            </div>
          )}
        </div>

        <form
          onSubmit={placeOrder}
          className="grid lg:grid-cols-[1.4fr_1fr] gap-10"
        >
          <div className="space-y-6">
            <Section title="Contact">
              <Field
                label="Full Name"
                value={form.full_name}
                onChange={onChange("full_name")}
                testid="f-name"
                required
              />

              <Field
                label="Email"
                type="email"
                value={form.email}
                onChange={onChange("email")}
                testid="f-email"
                required
              />

              <Field
                label="Phone"
                value={form.phone}
                onChange={onChange("phone")}
                testid="f-phone"
                required
              />
            </Section>

            <Section title="Shipping Address">
              <Field
                label="Address Line 1"
                value={form.line1}
                onChange={onChange("line1")}
                testid="f-line1"
                required
              />

              <Field
                label="Address Line 2"
                value={form.line2}
                onChange={onChange("line2")}
                testid="f-line2"
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field
                  label="City"
                  value={form.city}
                  onChange={onChange("city")}
                  testid="f-city"
                  required
                />

                <Field
                  label="State"
                  value={form.state}
                  onChange={onChange("state")}
                  testid="f-state"
                  required
                />

                <Field
                  label="Pincode"
                  value={form.pincode}
                  onChange={onChange("pincode")}
                  testid="f-pincode"
                  required
                />

                <Field
                  label="Landmark"
                  value={form.landmark}
                  onChange={onChange("landmark")}
                  testid="f-landmark"
                />
              </div>
            </Section>

            <Section title="Payment">
              <div className="border border-white/10 bg-white/[0.03] p-4 flex items-center gap-3">
                <input
                  type="radio"
                  checked
                  readOnly
                  className="accent-gold"
                />

                <div>
                  <div className="font-semibold">
                    Razorpay Secure Checkout

                    {payCfg.is_live ? (
                      <span className="label-tiny text-green-400 ml-2">
                        LIVE
                      </span>
                    ) : (
                      <span className="label-tiny text-gold ml-2">
                        NOT LIVE
                      </span>
                    )}

                    {TEST_PAYMENT_MODE && (
                      <span className="label-tiny text-red-400 ml-2">
                        ₹2 TEST
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-neutral-500">
                    UPI · Cards · Net Banking · Wallets
                  </div>

                  {!razorpayReady && (
                    <div className="text-xs text-red-400 mt-2">
                      Razorpay checkout script is not loaded yet.
                    </div>
                  )}
                </div>
              </div>
            </Section>
          </div>

          <aside
            className="border border-white/10 bg-white/[0.03] p-6 self-start lg:sticky lg:top-28"
            data-testid="order-summary"
          >
            <h2 className="display text-2xl">ORDER SUMMARY</h2>

            <div className="mt-4 space-y-3 max-h-[260px] overflow-y-auto pr-2">
              {paymentItems.map((item, index) => (
                <div key={index} className="flex gap-3 text-sm">
                  <div className="w-14 h-16 bg-ink-800 border border-white/10 shrink-0 overflow-hidden">
                    {item.image ? (
                      <img
                        src={item.image}
                        className="w-full h-full object-cover"
                        alt=""
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[9px] text-neutral-600 uppercase">
                        No Image
                      </div>
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="font-semibold leading-tight">
                      {item.name}
                    </div>

                    <div className="label-tiny">
                      {item.size}
                      {item.color ? ` · ${item.color}` : ""} × {item.qty}
                    </div>

                    {TEST_PAYMENT_MODE && (
                      <div className="text-[10px] text-gold mt-1 uppercase tracking-[0.14em]">
                        Test item price
                      </div>
                    )}
                  </div>

                  <div className="mono">{inr(item.price * item.qty)}</div>
                </div>
              ))}
            </div>

            <div className="mt-5 space-y-3 text-sm border-t border-white/10 pt-4">
              <Row label="Subtotal" value={inr(afterDisc)} />

              {discount > 0 && (
                <Row
                  label={`Discount (${coupon?.code})`}
                  value={`− ${inr(discount)}`}
                />
              )}

              <Row label="Shipping" value={shipping ? inr(shipping) : "FREE"} />

              <Row
                label={TEST_PAYMENT_MODE ? "GST" : "GST (5%)"}
                value={inr(gst)}
              />

              <div className="h-px bg-white/10 my-3" />

              <Row label="Grand Total" value={inr(total)} bold />
            </div>

            <button
              type="submit"
              disabled={paying || !razorpayReady || !payCfg.key_id}
              className="btn-primary w-full mt-6 disabled:opacity-60 justify-center"
              data-testid="place-order"
            >
              {paying ? "PROCESSING..." : `PAY ${inr(total)}`}
            </button>

            <div className="label-tiny mt-3 text-neutral-500 text-center">
              256-bit secure payment via Razorpay
            </div>

            {payCfg.is_live && (
              <div className="mt-3 text-[11px] text-center text-gold">
                Live payment mode is active.
              </div>
            )}

            {TEST_PAYMENT_MODE && (
              <div className="mt-3 text-[11px] text-center text-red-400">
                Temporary testing mode. Turn off before launch.
              </div>
            )}
          </aside>
        </form>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="border border-white/10 bg-white/[0.03] p-6 space-y-4">
      <h3 className="label-tiny text-gold">{title}</h3>
      {children}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  testid,
  required,
}) {
  return (
    <div>
      <label className="label-tiny block mb-1">
        {label}
        {required && <span className="text-gold"> *</span>}
      </label>

      <input
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        className="input-oc"
        data-testid={testid}
      />
    </div>
  );
}

function Row({ label, value, bold }) {
  return (
    <div className="flex justify-between gap-4">
      <span className={bold ? "display text-base" : "text-neutral-400"}>
        {label}
      </span>

      <span className={`mono ${bold ? "text-gold text-lg" : ""}`}>
        {value}
      </span>
    </div>
  );
}