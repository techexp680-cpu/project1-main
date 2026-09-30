import { createContext, useContext, useEffect, useState } from "react";

const StoreCtx = createContext(null);

const API_BASE = "http://localhost:8000/api";
const SESSION_LIMIT = 24 * 60 * 60 * 1000;

function loadCart() {
  try {
    return JSON.parse(localStorage.getItem("oc_cart") || "[]");
  } catch {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem("oc_cart", JSON.stringify(cart));
}

function loadSavedUser() {
  try {
    const token = localStorage.getItem("oc_token");
    const userRaw = localStorage.getItem("oc_user");
    const loginTime = localStorage.getItem("oc_login_time");

    if (!token || !userRaw || !loginTime) return null;

    const now = Date.now();
    const savedTime = Number(loginTime);

    if (now - savedTime > SESSION_LIMIT) {
      localStorage.removeItem("oc_token");
      localStorage.removeItem("oc_user");
      localStorage.removeItem("oc_login_time");
      return null;
    }

    return JSON.parse(userRaw);
  } catch {
    return null;
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

async function request(path, options = {}) {
  const token = localStorage.getItem("oc_token");

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
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
    throw new Error(data.detail || data.message || "Request failed");
  }

  return data;
}

export function StoreProvider({ children }) {
  const [user, setUser] = useState(loadSavedUser());
  const [cart, setCart] = useState(loadCart());
  const [cartOpen, setCartOpen] = useState(false);
  const [wishlist, setWishlist] = useState(loadSavedUser()?.wishlist || []);

  useEffect(() => {
    const savedUser = loadSavedUser();

    if (savedUser) {
      setUser(savedUser);
      setWishlist(savedUser.wishlist || []);
    } else {
      setUser(null);
      setWishlist([]);
    }
  }, []);

  useEffect(() => {
    saveCart(cart);
  }, [cart]);

  const refreshUser = () => {
    const savedUser = loadSavedUser();

    if (savedUser) {
      setUser(savedUser);
      setWishlist(savedUser.wishlist || []);
    } else {
      setUser(null);
      setWishlist([]);
    }
  };

  const addToCart = (item) => {
    setCart((prev) => {
      const key = (i) => `${i.product_id}|${i.size}|${i.color || ""}`;
      const idx = prev.findIndex((p) => key(p) === key(item));

      if (idx >= 0) {
        const next = [...prev];
        next[idx] = {
          ...next[idx],
          qty: next[idx].qty + item.qty,
        };
        return next;
      }

      return [...prev, item];
    });

    setCartOpen(true);
  };

  const updateQty = (idx, qty) => {
    setCart((currentCart) =>
      currentCart.map((item, index) =>
        index === idx ? { ...item, qty: Math.max(1, qty) } : item
      )
    );
  };

  const removeItem = (idx) => {
    setCart((currentCart) => currentCart.filter((_, index) => index !== idx));
  };

  const clearCart = () => {
    setCart([]);
  };

  const login = async (identifier, password) => {
    const data = await request("/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: identifier,
        phone: identifier,
        username: identifier,
        identifier,
        password,
      }),
    });

    const loggedUser = saveSession(data);
    setUser(loggedUser);
    setWishlist(loggedUser.wishlist || []);

    return loggedUser;
  };

  const register = async (payload) => {
    const data = await request("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    const registeredUser = saveSession(data);
    setUser(registeredUser);
    setWishlist(registeredUser.wishlist || []);

    return registeredUser;
  };

  const googleLogin = async () => {
    const demoEmail = `operator${Math.floor(Math.random() * 9000 + 1000)}@gmail.com`;

    const data = await request("/auth/google", {
      method: "POST",
      body: JSON.stringify({
        name: "Operator User",
        email: demoEmail,
      }),
    });

    const loggedUser = saveSession(data);
    setUser(loggedUser);
    setWishlist(loggedUser.wishlist || []);

    return loggedUser;
  };

  const logout = () => {
    localStorage.removeItem("oc_token");
    localStorage.removeItem("oc_user");
    localStorage.removeItem("oc_login_time");

    setUser(null);
    setWishlist([]);
  };

  const toggleWishlist = async (productId) => {
    if (!user) return null;

    const data = await request(`/account/wishlist/${productId}`, {
      method: "POST",
    });

    setWishlist(data.wishlist || []);
    return data.wishlist || [];
  };

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const itemCount = cart.reduce((sum, item) => sum + item.qty, 0);

  return (
    <StoreCtx.Provider
      value={{
        user,
        setUser,
        refreshUser,
        login,
        register,
        googleLogin,
        logout,

        cart,
        addToCart,
        updateQty,
        removeItem,
        clearCart,
        cartOpen,
        setCartOpen,

        wishlist,
        toggleWishlist,
        subtotal,
        itemCount,
      }}
    >
      {children}
    </StoreCtx.Provider>
  );
}

export const useStore = () => useContext(StoreCtx);
