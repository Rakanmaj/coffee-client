import React, { useMemo, useState } from "react";
import api from "../../api/api";
import { useApp } from "../../context/AppContext";
import { useNavigate } from "react-router-dom";

export default function Checkout() {
  const { user, cart, subtotal_omr, clear_cart } = useApp();
  const navigate = useNavigate();

  const [payment_method, set_payment_method] = useState("Cash");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const payload = useMemo(() => {
    return {
      cashier_id: user?.user_id,
      payment_method,
      items: cart.map((x) => ({
        product_id: x.product_id,
        quantity: x.quantity,
        note: x.note || "",
      })),
    };
  }, [user, payment_method, cart]);

  const handle_confirm = async () => {
    setError("");
    setSuccess("");

    if (cart.length === 0) {
      setError("Cart is empty.");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/api/orders", payload);
      setSuccess(`Order saved! Order #${res.data.order?.order_id}`);
      clear_cart();
      setTimeout(() => navigate("/menu"), 700);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Checkout failed";
      const details = err.response?.data?.insufficient_items;

      if (Array.isArray(details) && details.length > 0) {
        const lines = details
          .map((d) => `• ${d.name}: need ${d.need}, available ${d.available}`)
          .join("\n");
        setError(`${msg}\n${lines}`);
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container page">
      <div className="pageTitle">Checkout</div>
      <div className="subTitle">Confirm payment method and save the order.</div>

      <div className="panel" style={{ maxWidth: 520 }}>
        <div className="cardPad">
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
            <span className="label">Total</span>
            <b style={{ fontSize: 18 }}>{format_omr(subtotal_omr)} OMR</b>
          </div>

          <div className="field">
            <div className="label">Payment Method</div>

            <div className="tabs">
              <button
                type="button"
                className={payment_method === "Cash" ? "tab tabActive" : "tab"}
                onClick={() => set_payment_method("Cash")}
              >
                Cash
              </button>
              <button
                type="button"
                className={payment_method === "Visa" ? "tab tabActive" : "tab"}
                onClick={() => set_payment_method("Visa")}
              >
                Visa
              </button>
            </div>
          </div>

          {error ? (
            <pre className="alert alertError" style={{ whiteSpace: "pre-wrap" }}>
              {error}
            </pre>
          ) : null}

          {success ? <div className="alert">{success}</div> : null}

          <button className="btn btnPrimary" disabled={loading} onClick={handle_confirm}>
            {loading ? "Saving..." : "Confirm Order"}
          </button>
        </div>
      </div>
    </div>
  );
}

function format_omr(n) {
  return Number(n || 0).toFixed(3);
}
