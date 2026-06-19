import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import api from "../api/api";
import { useApp } from "./AppContext";
import { startCashierLoop, stopCashierLoop, unlockAudio } from "../utils/sounds";

const DriveThroughContext = createContext(null);

export function DriveThroughProvider({ children, enabled }) {
  const { user } = useApp();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState("");
  const [error, setError] = useState("");
  const [audioReady, setAudioReady] = useState(false);

  const pendingCount = useMemo(
    () => orders.filter((order) => order.status === "pending").length,
    [orders]
  );

  async function fetchOrders() {
    if (!enabled || !user?.user_id) return;

    setLoading(true);
    setError("");

    try {
      const res = await api.get("/api/drive-through/orders");
      setOrders(res.data.orders || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to load drive-through orders");
    } finally {
      setLoading(false);
    }
  }

  async function updateOrder(order_id, action) {
    setSavingId(`${order_id}:${action}`);
    setError("");

    try {
      const res = await api.post(`/api/drive-through/orders/${order_id}/${action}`);
      setOrders((prev) => {
        const next_order = res.data.order;
        if (["delivered", "not_delivered"].includes(next_order.status)) {
          return prev.filter((item) => item.id !== order_id);
        }

        return prev.map((item) => (item.id === order_id ? next_order : item));
      });
      return { ok: true };
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Update failed";
      const details = err.response?.data?.insufficient_items;

      if (Array.isArray(details) && details.length > 0) {
        setError(
          `${msg}: ${details
            .map((item) => `${item.name} needs ${item.need}, available ${item.available}`)
            .join("; ")}`
        );
      } else {
        setError(msg);
      }

      return { ok: false };
    } finally {
      setSavingId("");
    }
  }

  useEffect(() => {
    if (!enabled || !user?.user_id) {
      setOrders([]);
      stopCashierLoop();
      return;
    }

    fetchOrders();

    let socket;
    let cancelled = false;

    const handle_orders = ({ orders: next_orders }) => {
      setOrders(next_orders || []);
    };

    const handle_new_order = ({ order }) => {
      if (!order) return;

      setOrders((prev) => {
        const exists = prev.some((item) => item.id === order.id);
        if (exists) {
          return prev.map((item) => (item.id === order.id ? order : item));
        }
        return [...prev, order];
      });
    };

    async function connect_socket() {
      const { getSocket } = await import("../api/socket");
      if (cancelled) return;

      socket = getSocket();
      socket.emit("cashier:join", { token: localStorage.getItem("authToken") });
      socket.on("orders-changed", handle_orders);
      socket.on("new-order", handle_new_order);
    }

    connect_socket();

    return () => {
      cancelled = true;
      socket?.emit("cashier:leave");
      socket?.off("orders-changed", handle_orders);
      socket?.off("new-order", handle_new_order);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, user?.user_id]);

  useEffect(() => {
    if (!enabled || !user?.user_id) return;

    let done = false;
    const prime_audio = async () => {
      if (done) return;
      done = true;
      const ok = await unlockAudio();
      setAudioReady(ok);
    };

    const options = { capture: true, passive: true };
    window.addEventListener("pointerdown", prime_audio, options);
    window.addEventListener("touchstart", prime_audio, options);
    window.addEventListener("keydown", prime_audio, options);
    window.addEventListener("click", prime_audio, options);

    return () => {
      window.removeEventListener("pointerdown", prime_audio, options);
      window.removeEventListener("touchstart", prime_audio, options);
      window.removeEventListener("keydown", prime_audio, options);
      window.removeEventListener("click", prime_audio, options);
    };
  }, [enabled, user?.user_id]);

  useEffect(() => {
    if (enabled && user?.user_id && pendingCount > 0) {
      startCashierLoop();
    } else {
      stopCashierLoop();
    }

    return () => {
      stopCashierLoop();
    };
  }, [enabled, user?.user_id, pendingCount, audioReady]);

  const value = {
    orders,
    pendingCount,
    loading,
    savingId,
    error,
    audioReady,
    fetchOrders,
    updateOrder,
  };

  return (
    <DriveThroughContext.Provider value={value}>
      {children}
    </DriveThroughContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useDriveThrough() {
  const ctx = useContext(DriveThroughContext);
  if (!ctx) {
    return {
      orders: [],
      pendingCount: 0,
      loading: false,
      savingId: "",
      error: "",
      audioReady: false,
      fetchOrders: () => {},
      updateOrder: async () => ({ ok: false }),
    };
  }
  return ctx;
}
