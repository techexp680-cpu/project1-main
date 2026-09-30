import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { useStore } from "../lib/store";

const API_BASE = "http://localhost:8000/api";

function getErrorMessage(error) {
  const data = error?.response?.data || error?.data;

  if (typeof data?.detail === "string") {
    return data.detail;
  }

  if (Array.isArray(data?.detail)) {
    return data.detail
      .map((item) => item.msg || item.message || JSON.stringify(item))
      .join(", ");
  }

  if (typeof data?.message === "string") {
    return data.message;
  }

  if (typeof data === "string") {
    return data;
  }

  if (typeof error?.message === "string") {
    return error.message;
  }

  return "Something went wrong. Please try again.";
}

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const text = await response.text();

  let data = {};

  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = {};
  }

  if (!response.ok) {
    const error = new Error(getErrorMessage({ data }));
    error.data = data;
    throw error;
  }

  return data;
}

function saveSession(data) {
  const token = data.token || data.access_token || data.jwt || "";
  const user = data.user || data;

  if (token) {
    localStorage.setItem("oc_token", token);
  }

  localStorage.setItem("oc_user", JSON.stringify(user));
  localStorage.setItem("oc_login_time", Date.now().toString());

  return user;
}

function AuthPage({ defaultMode = "login" }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setUser } = useStore();

  const modeFromUrl = searchParams.get("mode");
  const [mode, setMode] = useState(
    modeFromUrl === "signup" || defaultMode === "signup" ? "signup" : "login"
  );

  const [loading, setLoading] = useState(false);

  const [loginForm, setLoginForm] = useState({
    identifier: "",
    password: "",
  });

  const [registerForm, setRegisterForm] = useState({
    name: "",
    email: "",
    phone: "",
    username: "",
    password: "",
    confirmPassword: "",
  });

  useEffect(() => {
    if (modeFromUrl === "signup") {
      setMode("signup");
    }

    if (modeFromUrl === "login") {
      setMode("login");
    }
  }, [modeFromUrl]);

  const goAfterLogin = (user) => {
    if (user?.is_admin) {
      navigate("/admin", { replace: true });
    } else {
      navigate("/account", { replace: true });
    }
  };

  const handleLogin = async (event) => {
    event.preventDefault();

    if (!loginForm.identifier.trim() || !loginForm.password.trim()) {
      toast.error("Please enter login details.");
      return;
    }

    setLoading(true);

    try {
      const data = await request("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          identifier: loginForm.identifier.trim(),
          email: loginForm.identifier.trim(),
          phone: loginForm.identifier.trim(),
          username: loginForm.identifier.trim(),
          password: loginForm.password,
        }),
      });

      const user = saveSession(data);

      if (setUser) {
        setUser(user);
      }

      toast.success("Login successful.");
      goAfterLogin(user);
    } catch (error) {
      console.error(error);
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (event) => {
    event.preventDefault();

    if (
      !registerForm.name.trim() ||
      !registerForm.email.trim() ||
      !registerForm.phone.trim() ||
      !registerForm.password.trim()
    ) {
      toast.error("Please fill all required fields.");
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(registerForm.email)) {
      toast.error("Please enter a valid email.");
      return;
    }

    if (!/^[6-9]\d{9}$/.test(registerForm.phone)) {
      toast.error("Please enter a valid 10 digit Indian phone number.");
      return;
    }

    if (registerForm.password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }

    if (registerForm.password !== registerForm.confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const data = await request("/auth/register", {
        method: "POST",
        body: JSON.stringify({
          name: registerForm.name.trim(),
          email: registerForm.email.trim(),
          phone: registerForm.phone.trim(),
          username:
            registerForm.username.trim() ||
            registerForm.email.trim().split("@")[0],
          password: registerForm.password,
        }),
      });

      const user = saveSession(data);

      if (setUser) {
        setUser(user);
      }

      toast.success("Account created.");
      goAfterLogin(user);
    } catch (error) {
      console.error(error);
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleDemo = async () => {
    setLoading(true);

    try {
      const demoEmail = `operator${Math.floor(
        Math.random() * 9000 + 1000
      )}@gmail.com`;

      const data = await request("/auth/google", {
        method: "POST",
        body: JSON.stringify({
          name: "Operator User",
          email: demoEmail,
        }),
      });

      const user = saveSession(data);

      if (setUser) {
        setUser(user);
      }

      toast.success("Google demo login successful.");
      goAfterLogin(user);
    } catch (error) {
      console.error(error);
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md border border-white/10 bg-white/[0.04] p-6 md:p-8">
        <div className="flex items-start justify-between gap-4 mb-8">
          <div>
            <p className="label-tiny text-gold mb-2">
              // OPERATOR ACCESS
            </p>

            <h1 className="display text-4xl">
              {mode === "login" ? "LOGIN" : "SIGN UP"}
            </h1>
          </div>

          <Link
            to="/"
            className="text-neutral-500 hover:text-gold text-sm"
            aria-label="Close"
          >
            ✕
          </Link>
        </div>

        <div className="grid grid-cols-2 border border-white/10 mb-6">
          <button
            type="button"
            onClick={() => setMode("login")}
            className={`py-3 label-tiny ${
              mode === "login"
                ? "bg-gold text-black"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            LOGIN
          </button>

          <button
            type="button"
            onClick={() => setMode("signup")}
            className={`py-3 label-tiny ${
              mode === "signup"
                ? "bg-gold text-black"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            SIGN UP
          </button>
        </div>

        {mode === "login" ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <Field
              label="Email / Phone / Username"
              value={loginForm.identifier}
              onChange={(value) =>
                setLoginForm({ ...loginForm, identifier: value })
              }
              placeholder="admin@operatorchoice.com"
              required
            />

            <Field
              label="Password"
              type="password"
              value={loginForm.password}
              onChange={(value) =>
                setLoginForm({ ...loginForm, password: value })
              }
              placeholder="Enter password"
              required
            />

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center disabled:opacity-60"
            >
              {loading ? "LOGGING IN..." : "LOGIN"}
            </button>

            <div className="text-center">
              <Link
                to="/forgot"
                className="text-xs text-neutral-500 hover:text-gold"
              >
                Forgot password?
              </Link>
            </div>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-4">
            <Field
              label="Full Name"
              value={registerForm.name}
              onChange={(value) =>
                setRegisterForm({ ...registerForm, name: value })
              }
              required
            />

            <Field
              label="Email"
              type="email"
              value={registerForm.email}
              onChange={(value) =>
                setRegisterForm({ ...registerForm, email: value })
              }
              required
            />

            <Field
              label="Phone"
              value={registerForm.phone}
              onChange={(value) =>
                setRegisterForm({ ...registerForm, phone: value })
              }
              required
            />

            <Field
              label="Username"
              value={registerForm.username}
              onChange={(value) =>
                setRegisterForm({ ...registerForm, username: value })
              }
              placeholder="Optional"
            />

            <Field
              label="Password"
              type="password"
              value={registerForm.password}
              onChange={(value) =>
                setRegisterForm({ ...registerForm, password: value })
              }
              required
            />

            <Field
              label="Confirm Password"
              type="password"
              value={registerForm.confirmPassword}
              onChange={(value) =>
                setRegisterForm({
                  ...registerForm,
                  confirmPassword: value,
                })
              }
              required
            />

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center disabled:opacity-60"
            >
              {loading ? "CREATING..." : "CREATE ACCOUNT"}
            </button>
          </form>
        )}

        <button
          type="button"
          onClick={handleGoogleDemo}
          disabled={loading}
          className="btn-outline w-full justify-center mt-4 disabled:opacity-60"
        >
          CONTINUE WITH GOOGLE DEMO
        </button>

        <div className="mt-6 border-t border-white/10 pt-4 text-xs text-neutral-500 leading-5">
          Admin test login:
          <br />
          Email:{" "}
          <span className="text-gold">admin@operatorchoice.com</span>
          <br />
          Password: <span className="text-gold">admin123</span>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder = "",
  required = false,
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
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
        className="input-oc"
      />
    </div>
  );
}

export function Login() {
  return <AuthPage defaultMode="login" />;
}

export function Register() {
  return <AuthPage defaultMode="signup" />;
}

export function Forgot() {
  const navigate = useNavigate();

  const [step, setStep] = useState("request");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const requestReset = async (event) => {
    event.preventDefault();

    if (!email.trim()) {
      toast.error("Enter email first.");
      return;
    }

    setLoading(true);

    try {
      await request("/auth/forgot", {
        method: "POST",
        body: JSON.stringify({
          email: email.trim(),
        }),
      });

      toast.success("Reset OTP sent if email exists.");
      setStep("reset");
    } catch (error) {
      console.error(error);
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (event) => {
    event.preventDefault();

    if (!email.trim() || !otp.trim() || !password.trim()) {
      toast.error("Fill all fields.");
      return;
    }

    setLoading(true);

    try {
      await request("/auth/reset", {
        method: "POST",
        body: JSON.stringify({
          email: email.trim(),
          otp: otp.trim(),
          password,
          new_password: password,
        }),
      });

      toast.success("Password reset successful.");
      navigate("/login?mode=login", { replace: true });
    } catch (error) {
      console.error(error);
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md border border-white/10 bg-white/[0.04] p-6 md:p-8">
        <p className="label-tiny text-gold mb-2">// ACCOUNT RECOVERY</p>

        <h1 className="display text-4xl mb-6">RESET PASSWORD</h1>

        {step === "request" ? (
          <form onSubmit={requestReset} className="space-y-4">
            <Field
              label="Email"
              type="email"
              value={email}
              onChange={setEmail}
              required
            />

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center disabled:opacity-60"
            >
              {loading ? "SENDING..." : "SEND OTP"}
            </button>
          </form>
        ) : (
          <form onSubmit={resetPassword} className="space-y-4">
            <Field
              label="Email"
              type="email"
              value={email}
              onChange={setEmail}
              required
            />

            <Field label="OTP" value={otp} onChange={setOtp} required />

            <Field
              label="New Password"
              type="password"
              value={password}
              onChange={setPassword}
              required
            />

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center disabled:opacity-60"
            >
              {loading ? "RESETTING..." : "RESET PASSWORD"}
            </button>
          </form>
        )}

        <Link
          to="/login?mode=login"
          className="btn-outline w-full justify-center mt-4"
        >
          BACK TO LOGIN
        </Link>
      </div>
    </div>
  );
}

export default Login;
