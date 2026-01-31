import React, { createContext, useContext, useMemo, useState } from "react";

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  });

  // cart items:
  // { product_id, name, price_omr, quantity, note, category }
  const [cart, setCart] = useState([]);

  const login = (user_obj) => {
    setUser(user_obj);
    localStorage.setItem("user", JSON.stringify(user_obj));
  };

  const logout = () => {
    setUser(null);
    setCart([]);
    localStorage.removeItem("user");
  };

  const add_to_cart = (product) => {
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
  };

  const remove_from_cart = (product_id) => {
    setCart((prev) => prev.filter((x) => x.product_id !== product_id));
  };

  const set_qty = (product_id, quantity) => {
    const q = Number(quantity);
    if (Number.isNaN(q)) return;

    setCart((prev) =>
      prev
        .map((x) => (x.product_id === product_id ? { ...x, quantity: q } : x))
        .filter((x) => x.quantity > 0)
    );
  };

  const set_note = (product_id, note) => {
    setCart((prev) =>
      prev.map((x) => (x.product_id === product_id ? { ...x, note } : x))
    );
  };

  const clear_cart = () => setCart([]);

  const subtotal_omr = useMemo(() => {
    const sum = cart.reduce(
      (acc, item) => acc + Number(item.price_omr) * Number(item.quantity),
      0
    );
    return round_omr(sum);
  }, [cart]);

  const value = {
    user,
    cart,
    subtotal_omr,
    login,
    logout,
    add_to_cart,
    remove_from_cart,
    set_qty,
    set_note,
    clear_cart,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}

function round_omr(n) {
  // numeric(10,3) style
  return Math.round(Number(n) * 1000) / 1000;
}
