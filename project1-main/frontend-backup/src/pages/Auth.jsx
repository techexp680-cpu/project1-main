import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { X, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import api from "../lib/api";

const API_BASE = "http://localhost:8001/api";

function getErrorMessage(data, fallback = "Something went wrong.") {
  if (!data) return fallback;

  if (typeof data === "string") return data;

  if (typeof data?.detail === "string") return data.detail;

  if (Array.isArray(data?.detail)) {
    return data.detail
      .map((item) => item.msg || item.message || JSON.stringify(item))
      .join(", ");
  }

  if (typeof data?.message === "string") return data.message;

  if (typeof data?.error === "string") return data.error;

  return fallback;
}

async function readJsonSafe(response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
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

export function Login() {
  const nav = useNavigate();

  const [mode, setMode] = useState("login");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);

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
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const selectedMode = params.get("mode");

    if (selectedMode === "signup") {
      setMode("signup");
    }

    if (selectedMode === "login") {
      setMode("login");
    }
  }, []);

  const closePage = () => {
    nav("/");
  };

  const handleLogin = async (event) => {
    event.preventDefault();

    if (!loginForm.identifier.trim() || !loginForm.password.trim()) {
      toast.error("Please enter login details.");
      return;
    }

    setBusy(true);

    try {
      const identifier = loginForm.identifier.trim();

      const response = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: identifier,
          phone: identifier,
          username: identifier,
          identifier: identifier,
          password: loginForm.password,
        }),
      });

      const data = await readJsonSafe(response);

      if (!response.ok) {
        throw new Error(getErrorMessage(data, "Login failed."));
      }

      const user = saveSession(data);

      toast.success(
        `Welcome back${user?.name ? ", " + user.name.split(" ")[0] : ""}`
      );

      window.location.href = user?.is_admin ? "/admin" : "/account";
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Login failed. Check your details.");
    } finally {
      setBusy(false);
    }
  };

  const handleRegister = async (event) => {
    event.preventDefault();

    if (
      !registerForm.name.trim() ||
      !registerForm.email.trim() ||
      !registerForm.phone.trim() ||
      !registerForm.username.trim() ||
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

    setBusy(true);

    try {
      const response = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: registerForm.name.trim(),
          email: registerForm.email.trim(),
          phone: registerForm.phone.trim(),
          username: registerForm.username.trim(),
          password: registerForm.password,
        }),
      });

      const data = await readJsonSafe(response);

      if (!response.ok) {
        throw new Error(getErrorMessage(data, "Registration failed."));
      }

      const user = saveSession(data);

      toast.success(
        `Welcome${user?.name ? ", " + user.name.split(" ")[0] : ""}`
      );

      window.location.href = "/account";
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Registration failed. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const handleGoogleDemo = async () => {
    setBusy(true);

    try {
      const response = await fetch(`${API_BASE}/auth/google`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "demo@operatorchoice.com",
          name: "Demo Operator",
        }),
      });

      const data = await readJsonSafe(response);

      if (!response.ok) {
        throw new Error(getErrorMessage(data, "Google demo login failed."));
      }

      saveSession(data);

      toast.success("Welcome, Demo Operator");

      window.location.href = "/account";
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Google demo login failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-black text-white relative"
      data-testid="auth-page"
    >
      <button
        onClick={closePage}
        className="fixed top-5 right-5 z-50 w-11 h-11 border border-white/20 bg-black/80 hover:bg-gold hover:text-black flex items-center justify-center transition"
        aria-label="Close"
        data-testid="auth-close"
      >
        <X size={22} />
      </button>

      <div className="min-h-screen grid lg:grid-cols-2">
        <div className="hidden lg:block relative">
          <img
            src="https://images.unsplash.com/photo-1523398002811-999ca8dec234?w=1600&q=80"
            alt="Operator Choice"
            className="absolute inset-0 w-full h-full object-cover"
          />

          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-black/20" />

          <div className="relative z-10 h-full flex flex-col justify-end p-12">
            <p className="text-gold tracking-[0.35em] text-xs uppercase mb-3">
              Operator&apos;s Choice
            </p>

            <h1 className="display text-6xl leading-none">
              ACCESS YOUR <br /> COMMAND CENTER
            </h1>

            <p className="text-neutral-400 max-w-md mt-5">
              Save your orders, wishlist, delivery details, shopping history and
              exclusive drop access.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-center px-5 py-16">
          <div className="w-full max-w-md">
            <Link to="/" className="display text-3xl tracking-wider block mb-8">
              OPERATOR<span className="text-gold">&apos;</span>S CHOICE
            </Link>

            <div className="border border-white/10 bg-white/[0.04] p-6 md:p-8">
              <div className="grid grid-cols-2 border border-white/10 mb-7">
                <button
                  type="button"
                  onClick={() => setMode("signup")}
                  className={`py-3 text-xs tracking-[0.2em] uppercase font-bold ${
                    mode === "signup"
                      ? "bg-gold text-black"
                      : "bg-transparent text-white/70 hover:text-white"
                  }`}
                >
                  Sign In
                </button>

                <button
                  type="button"
                  onClick={() => setMode("login")}
                  className={`py-3 text-xs tracking-[0.2em] uppercase font-bold ${
                    mode === "login"
                      ? "bg-gold text-black"
                      : "bg-transparent text-white/70 hover:text-white"
                  }`}
                >
                  Login
                </button>
              </div>

              {mode === "signup" ? (
                <>
                  <p className="text-gold text-xs tracking-[0.25em] uppercase mb-2">
                    New Customer
                  </p>

                  <h2 className="display text-4xl mb-2">Create Account</h2>

                  <p className="text-neutral-400 text-sm mb-6">
                    Sign in for the first time and create your Operator&apos;s
                    Choice account.
                  </p>

                  <form onSubmit={handleRegister} className="space-y-4">
                    <input
                      value={registerForm.name}
                      onChange={(event) =>
                        setRegisterForm({
                          ...registerForm,
                          name: event.target.value,
                        })
                      }
                      placeholder="FULL NAME"
                      className="input-oc tracking-widest"
                      required
                    />

                    <input
                      value={registerForm.email}
                      onChange={(event) =>
                        setRegisterForm({
                          ...registerForm,
                          email: event.target.value,
                        })
                      }
                      type="email"
                      placeholder="GMAIL / EMAIL ID"
                      className="input-oc tracking-widest"
                      required
                    />

                    <input
                      value={registerForm.phone}
                      onChange={(event) =>
                        setRegisterForm({
                          ...registerForm,
                          phone: event.target.value,
                        })
                      }
                      placeholder="PHONE NUMBER"
                      className="input-oc tracking-widest"
                      required
                    />

                    <input
                      value={registerForm.username}
                      onChange={(event) =>
                        setRegisterForm({
                          ...registerForm,
                          username: event.target.value,
                        })
                      }
                      placeholder="CREATE USERNAME"
                      className="input-oc tracking-widest"
                      required
                    />

                    <div className="relative">
                      <input
                        value={registerForm.password}
                        onChange={(event) =>
                          setRegisterForm({
                            ...registerForm,
                            password: event.target.value,
                          })
                        }
                        type={showPassword ? "text" : "password"}
                        placeholder="CREATE PASSWORD"
                        className="input-oc tracking-widest pr-12"
                        required
                      />

                      <button
                        type="button"
                        onClick={() => setShowPassword((state) => !state)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-gold"
                      >
                        {showPassword ? (
                          <EyeOff size={18} />
                        ) : (
                          <Eye size={18} />
                        )}
                      </button>
                    </div>

                    <button
                      type="submit"
                      disabled={busy}
                      className="btn-primary w-full justify-center disabled:opacity-60"
                    >
                      {busy ? "CREATING..." : "SIGN IN"}
                    </button>
                  </form>

                  <div className="text-xs text-neutral-400 mt-6 text-center">
                    Already have an account?{" "}
                    <button
                      type="button"
                      onClick={() => setMode("login")}
                      className="hover:text-gold"
                    >
                      Login →
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-gold text-xs tracking-[0.25em] uppercase mb-2">
                    Existing Customer
                  </p>

                  <h2 className="display text-4xl mb-2">Login</h2>

                  <p className="text-neutral-400 text-sm mb-6">
                    Login using your email, phone number or username.
                  </p>

                  <form onSubmit={handleLogin} className="space-y-4">
                    <input
                      value={loginForm.identifier}
                      onChange={(event) =>
                        setLoginForm({
                          ...loginForm,
                          identifier: event.target.value,
                        })
                      }
                      placeholder="EMAIL / PHONE / USERNAME"
                      className="input-oc tracking-widest"
                      required
                    />

                    <div className="relative">
                      <input
                        value={loginForm.password}
                        onChange={(event) =>
                          setLoginForm({
                            ...loginForm,
                            password: event.target.value,
                          })
                        }
                        type={showPassword ? "text" : "password"}
                        placeholder="PASSWORD"
                        className="input-oc tracking-widest pr-12"
                        required
                      />

                      <button
                        type="button"
                        onClick={() => setShowPassword((state) => !state)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-gold"
                      >
                        {showPassword ? (
                          <EyeOff size={18} />
                        ) : (
                          <Eye size={18} />
                        )}
                      </button>
                    </div>

                    <button
                      type="submit"
                      disabled={busy}
                      className="btn-primary w-full justify-center disabled:opacity-60"
                    >
                      {busy ? "LOGGING IN..." : "LOGIN"}
                    </button>
                  </form>

                  <button
                    type="button"
                    onClick={handleGoogleDemo}
                    disabled={busy}
                    className="btn-outline w-full mt-3 justify-center disabled:opacity-60"
                  >
                    CONTINUE WITH GOOGLE DEMO
                  </button>

                  <div className="flex justify-between text-xs text-neutral-400 mt-6">
                    <Link to="/forgot" className="hover:text-gold">
                      Forgot password?
                    </Link>

                    <button
                      type="button"
                      onClick={() => setMode("signup")}
                      className="hover:text-gold"
                    >
                      Create account →
                    </button>
                  </div>
                </>
              )}
            </div>

            <p className="text-[11px] text-neutral-600 mt-5 text-center">
              Your session automatically expires after 24 hours for account
              security.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Register() {
  return <Login />;
}

export function Forgot() {
  const nav = useNavigate();

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPw, setNewPw] = useState("");
  const [step, setStep] = useState(1);
  const [demoOtp, setDemoOtp] = useState("");

  const sendOtp = async (event) => {
    event.preventDefault();

    try {
      const { data } = await api.post("/auth/forgot", { email });
      setDemoOtp(data.demo_otp || "");
      setStep(2);
      toast.success(
        data.demo_otp
          ? `OTP sent. Demo OTP: ${data.demo_otp}`
          : "OTP sent if email exists."
      );
    } catch (error) {
      console.error(error);
      toast.error(
        getErrorMessage(error.response?.data, "Could not send OTP.")
      );
    }
  };

  const reset = async (event) => {
    event.preventDefault();

    try {
      await api.post("/auth/reset", {
        email,
        otp,
        new_password: newPw,
      });

      toast.success("Password reset. Login now.");
      nav("/login?mode=login");
    } catch (error) {
      console.error(error);
      toast.error(getErrorMessage(error.response?.data, "Reset failed."));
    }
  };

  return (
    <div className="min-h-screen bg-black text-white relative">
      <button
        onClick={() => nav("/")}
        className="fixed top-5 right-5 z-50 w-11 h-11 border border-white/20 bg-black/80 hover:bg-gold hover:text-black flex items-center justify-center transition"
        aria-label="Close"
      >
        <X size={22} />
      </button>

      <div className="container-oc py-20 max-w-md">
        <h1 className="display text-5xl mb-3">RESET PASSWORD</h1>

        <p className="text-neutral-400 text-sm mb-8">
          Reset access to your Operator&apos;s Choice account.
        </p>

        {step === 1 ? (
          <form onSubmit={sendOtp} className="space-y-4">
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              type="email"
              placeholder="EMAIL"
              className="input-oc tracking-widest"
              required
            />

            <button className="btn-primary w-full justify-center">
              SEND OTP
            </button>
          </form>
        ) : (
          <form onSubmit={reset} className="space-y-4">
            {demoOtp && (
              <div className="label-tiny text-gold">Demo OTP: {demoOtp}</div>
            )}

            <input
              value={otp}
              onChange={(event) => setOtp(event.target.value)}
              placeholder="OTP"
              className="input-oc tracking-widest"
              required
            />

            <input
              value={newPw}
              onChange={(event) => setNewPw(event.target.value)}
              type="password"
              placeholder="NEW PASSWORD"
              className="input-oc tracking-widest"
              required
            />

            <button className="btn-primary w-full justify-center">
              RESET PASSWORD
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default Login;