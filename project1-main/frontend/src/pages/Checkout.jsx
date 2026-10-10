import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api, { inr } from "@/lib/api";
import { useStore } from "@/lib/store";
import { toast } from "sonner";

const RAZORPAY_SCRIPT =
  "https://checkout.razorpay.com/v1/checkout.js";

const BACKEND_URL = "https://project1-main.onrender.com";

function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    let script = document.querySelector(
      `script[src="${RAZORPAY_SCRIPT}"]`
    );

    if (script?.dataset.loaded === "true" && !window.Razorpay) {
      script.remove();
      script = null;
    }

    if (!script) {
      script = document.createElement("script");
      script.src = RAZORPAY_SCRIPT;
      script.async = true;
      script.dataset.loaded = "false";
      document.body.appendChild(script);
    }

    const handleLoad = () => {
      script.dataset.loaded = "true";
      resolve(Boolean(window.Razorpay));
    };

    const handleError = () => {
      script.remove();
      resolve(false);
    };

    script.addEventListener("load", handleLoad, { once: true });
    script.addEventListener("error", handleError, { once: true });
  });
}

const initialForm = {
  name: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  state: "",
  pincode: "",
};

export default function Checkout() {
  const navigate = useNavigate();
  const store = useStore();

  const cartItems =
    store.cartItems || store.cart || store.items || [];

  const clearCart =
    store.clearCart || store.clear_cart || (() => {});

  const [form, setForm] = useState(initialForm);
  const [payCfg, setPayCfg] = useState({
    key_id: "",
    is_live: false,
    currency: "INR",
  });

  const [scriptReady, setScriptReady] = useState(
    Boolean(window.Razorpay)
  );
  const [loading, setLoading] = useState(false);
  const [configLoading, setConfigLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function setupPayment() {
      setConfigLoading(true);
      setError("");

      try {
        const [scriptLoaded, configResponse] = await Promise.all([
          loadRazorpayScript(),
          api.get(`${BACKEND_URL}/api/payments/config`),
        ]);

        if (!active) return;

        setScriptReady(scriptLoaded);

        const config = configResponse.data || {};

        setPayCfg({
          key_id: config.key_id || "",
          is_live: Boolean(config.is_live),
          currency: config.currency || "INR",
        });

        if (!scriptLoaded) {
          setError(
            "Razorpay checkout could not load. Check your internet connection, browser extensions, or content blockers, then refresh."
          );
        } else if (!config.key_id) {
          setError(
            "Razorpay Key ID is missing. Configure RAZORPAY_KEY_ID in your backend hosting environment."
          );
        }
      } catch (err) {
        if (!active) return;

        setError(
          err.response?.data?.detail ||
            "Unable to connect to the payment service. Check that your Render backend is running."
        );
      } finally {
        if (active) setConfigLoading(false);
      }
    }

    setupPayment();

    return () => {
      active = false;
    };
  }, []);

  const subtotal = cartItems.reduce((sum, item) => {
    const price = Number(item.price ?? item.sale_price ?? 0);
    const quantity = Number(item.quantity ?? 1);
    return sum + price * quantity;
  }, 0);

  const shipping = subtotal > 0 ? 0 : 0;
  const total = subtotal + shipping;

  function updateField(event) {
    const { name, value } = event.target;
    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  function validateForm() {
    if (!cartItems.length) {
      return "Your cart is empty.";
    }

    if (
      !form.name.trim() ||
      !form.email.trim() ||
      !form.phone.trim() ||
      !form.address.trim() ||
      !form.city.trim() ||
      !form.state.trim() ||
      !form.pincode.trim()
    ) {
      return "Please complete all shipping address fields.";
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      return "Please enter a valid email address.";
    }

    if (!/^[6-9]\d{9}$/.test(form.phone.trim())) {
      return "Enter a valid 10-digit Indian mobile number.";
    }

    if (!/^\d{6}$/.test(form.pincode.trim())) {
      return "Enter a valid 6-digit PIN code.";
    }

    return "";
  }

  async function placeOrder(event) {
    event.preventDefault();

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      toast.error(validationError);
      return;
    }

    if (!window.Razorpay || !scriptReady) {
      setError(
        "Razorpay checkout script is not loaded. Click Retry Payment Setup below."
      );
      return;
    }

    if (!payCfg.key_id) {
      setError("Razorpay configuration is missing from the backend.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const shippingAddress = {
        ...form,
        phone: form.phone.trim(),
        pincode: form.pincode.trim(),
      };

      // Send the cart and shipping address to the backend.
      // The backend must calculate the final payable amount.
      const orderResponse = await api.post(
        `${BACKEND_URL}/api/payments/create-order`,
        {
          items: cartItems,
          shipping_address: shippingAddress,
          coupon_code: null,
        }
      );

      const order = orderResponse.data;

      if (!order?.id || !Number(order?.amount)) {
        throw new Error(
          "The backend did not return a valid Razorpay order. Check the backend logs."
        );
      }

      const options = {
        key: payCfg.key_id,
        amount: order.amount,
        currency: order.currency || payCfg.currency,
        name: "Operator Choice",
        description: "Order payment",
        order_id: order.id,
        prefill: {
          name: form.name,
          email: form.email,
          contact: form.phone,
        },
        notes: {
          shipping_city: form.city,
        },
        theme: {
          color: "#111827",
        },

        handler: async function (response) {
          try {
            setError("");

            await api.post(
              `${BACKEND_URL}/api/payments/verify`,
              {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                items: cartItems,
                shipping_address: shippingAddress,
                coupon_code: null,
              }
            );

            clearCart();
            toast.success("Payment verified successfully.");
            navigate("/order-success", { replace: true });
          } catch (verificationError) {
            const message =
              verificationError.response?.data?.detail ||
              "Payment was received, but verification failed. Contact support with your Razorpay payment ID.";

            setError(
              `${message} Payment ID: ${response.razorpay_payment_id}`
            );
            toast.error(message);
          } finally {
            setLoading(false);
          }
        },

        modal: {
          ondismiss: function () {
            setLoading(false);
          },
        },
      };

      const checkout = new window.Razorpay(options);

      checkout.on("payment.failed", function (response) {
        const message =
          response.error?.description ||
          "Payment failed. Please try again.";

        setError(message);
        toast.error(message);
        setLoading(false);
      });

      checkout.open();
    } catch (err) {
      const message =
        err.response?.data?.detail ||
        err.message ||
        "Unable to start payment. Please try again.";

      setError(
        typeof message === "string"
          ? message
          : JSON.stringify(message)
      );

      toast.error("Could not start Razorpay payment.");
      setLoading(false);
    }
  }

  async function retryPaymentSetup() {
    setError("");
    setConfigLoading(true);

    try {
      const scriptLoaded = await loadRazorpayScript();
      const response = await api.get(
        `${BACKEND_URL}/api/payments/config`
      );

      setScriptReady(scriptLoaded);
      setPayCfg({
        key_id: response.data?.key_id || "",
        is_live: Boolean(response.data?.is_live),
        currency: response.data?.currency || "INR",
      });

      if (!scriptLoaded) {
        throw new Error(
          "Razorpay script is still blocked. Try another browser or network."
        );
      }

      if (!response.data?.key_id) {
        throw new Error("Razorpay Key ID is missing on the backend.");
      }

      toast.success("Payment setup is ready.");
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          err.message ||
          "Could not initialize Razorpay."
      );
    } finally {
      setConfigLoading(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8">
      <div className="mb-6">
        <Link to="/cart" className="text-sm underline">
          ← Back to cart
        </Link>

        <h1 className="mt-4 text-3xl font-bold">
          Secure Checkout
        </h1>

        <p className="mt-2 text-sm text-gray-600">
          UPI · Cards · Net Banking · Wallets
        </p>

        <p className="mt-2 text-sm font-medium">
          Razorpay Secure Checkout{" "}
          {payCfg.is_live ? "LIVE MODE" : "TEST MODE"}
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="mb-5 rounded border border-red-300 bg-red-50 p-4 text-sm text-red-800"
        >
          {error}
        </div>
      )}

      <div className="grid gap-8 md:grid-cols-2">
        <form onSubmit={placeOrder} className="space-y-4">
          <h2 className="text-xl font-semibold">
            Shipping information
          </h2>

          {[
            ["name", "Full name", "text"],
            ["email", "Email address", "email"],
            ["phone", "10-digit mobile number", "tel"],
            ["address", "Full address", "text"],
            ["city", "City", "text"],
            ["state", "State", "text"],
            ["pincode", "6-digit PIN code", "text"],
          ].map(([name, label, type]) => (
            <div key={name}>
              <label
                htmlFor={name}
                className="mb-1 block text-sm font-medium"
              >
                {label}
              </label>

              <input
                id={name}
                name={name}
                type={type}
                value={form[name]}
                onChange={updateField}
                required
                autoComplete={
                  name === "name"
                    ? "name"
                    : name === "email"
                      ? "email"
                      : name === "phone"
                        ? "tel"
                        : name === "address"
                          ? "street-address"
                          : "off"
                }
                className="w-full rounded border border-gray-300 px-3 py-2"
              />
            </div>
          ))}

          <button
            type="submit"
            disabled={loading || configLoading || !cartItems.length}
            className="w-full rounded bg-black px-4 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? "Processing..."
              : configLoading
                ? "Loading payment..."
                : `Pay ${inr(total)}`}
          </button>

          <button
            type="button"
            onClick={retryPaymentSetup}
            disabled={configLoading}
            className="w-full rounded border px-4 py-2 disabled:opacity-50"
          >
            {configLoading ? "Checking..." : "Retry Payment Setup"}
          </button>
        </form>

        <aside className="h-fit rounded border p-5">
          <h2 className="mb-4 text-xl font-semibold">
            Order summary
          </h2>

          {!cartItems.length ? (
            <p className="text-sm text-gray-600">
              Your cart is empty.{" "}
              <Link to="/shop" className="underline">
                Continue shopping
              </Link>
            </p>
          ) : (
            <div className="space-y-4">
              {cartItems.map((item, index) => (
                <div
                  key={item.id || item._id || index}
                  className="flex justify-between gap-3 text-sm"
                >
                  <span>
                    {item.name || item.title || "Product"} ×{" "}
                    {Number(item.quantity || 1)}
                  </span>

                  <span>
                    {inr(
                      Number(item.price ?? item.sale_price ?? 0) *
                        Number(item.quantity || 1)
                    )}
                  </span>
                </div>
              ))}

              <hr />

              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{inr(subtotal)}</span>
              </div>

              <div className="flex justify-between">
                <span>Shipping</span>
                <span>{shipping === 0 ? "Free" : inr(shipping)}</span>
              </div>

              <hr />

              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>{inr(total)}</span>
              </div>
            </div>
          )}
        </aside>
      </div>
    </main>
  );
}
