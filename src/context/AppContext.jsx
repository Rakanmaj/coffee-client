import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import api from "../api/api";

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(() => !localStorage.getItem("authToken"));

  // cart items:
  // { product_id, name, price_omr, quantity, note, category }
  const [cart, setCart] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) return;

    let active = true;
    api
      .get("/api/auth/session")
      .then((res) => {
        if (!active) return;
        setUser(res.data.user);
        localStorage.setItem("user", JSON.stringify(res.data.user));
      })
      .catch(() => {
        if (!active) return;
        setUser(null);
        localStorage.removeItem("authToken");
        localStorage.removeItem("user");
      })
      .finally(() => {
        if (active) setAuthReady(true);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const clearExpiredSession = () => {
      setUser(null);
      setCart([]);
      setAuthReady(true);
    };
    window.addEventListener("auth:expired", clearExpiredSession);
    return () => window.removeEventListener("auth:expired", clearExpiredSession);
  }, []);

  const login = useCallback((user_obj, token) => {
    setUser(user_obj);
    setAuthReady(true);
    localStorage.setItem("user", JSON.stringify(user_obj));
    localStorage.setItem("authToken", token);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setCart([]);
    setAuthReady(true);
    localStorage.removeItem("user");
    localStorage.removeItem("authToken");
  }, []);

  const add_to_cart = useCallback((product) => {
    setCart((prev) => {
      const found = prev.find((x) => x.product_id === product.product_id);
      if (found) {
        return prev.map((x) =>
          x.product_id === product.product_id
            ? { ...x, quantity: x.quantity + 1 }
            : x
        );
      }
      return [
        ...prev,
        {
          product_id: product.product_id,
          name: product.name,
          price_omr: product.price_omr,
          quantity: 1,
          note: "",
          category: product.category,
        },
      ];
    });
  }, []);

  const remove_from_cart = useCallback((product_id) => {
    setCart((prev) => prev.filter((x) => x.product_id !== product_id));
  }, []);

  const set_qty = useCallback((product_id, quantity) => {
    const q = Number(quantity);
    if (Number.isNaN(q)) return;

    setCart((prev) =>
      prev
        .map((x) => (x.product_id === product_id ? { ...x, quantity: q } : x))
        .filter((x) => x.quantity > 0)
    );
  }, []);

  const set_note = useCallback((product_id, note) => {
    setCart((prev) =>
      prev.map((x) => (x.product_id === product_id ? { ...x, note } : x))
    );
  }, []);

  const clear_cart = useCallback(() => setCart([]), []);

  const subtotal_omr = useMemo(() => {
    const sum = cart.reduce(
      (acc, item) => acc + Number(item.price_omr) * Number(item.quantity),
      0
    );
    return round_omr(sum);
  }, [cart]);

  const value = useMemo(
    () => ({
      user,
      authReady,
      cart,
      subtotal_omr,
      login,
      logout,
      add_to_cart,
      remove_from_cart,
      set_qty,
      set_note,
      clear_cart,
    }),
    [
      user,
      authReady,
      cart,
      subtotal_omr,
      login,
      logout,
      add_to_cart,
      remove_from_cart,
      set_qty,
      set_note,
      clear_cart,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}

function round_omr(n) {
  // numeric(10,3) style
  return Math.round(Number(n) * 1000) / 1000;
}
