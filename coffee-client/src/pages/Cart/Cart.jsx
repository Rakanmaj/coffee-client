import React from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../../context/AppContext";

export default function Cart() {
  const { cart, subtotal_omr, set_qty, set_note, remove_from_cart } = useApp();
  const navigate = useNavigate();

  return (
    <div className="container page">
      <div className="pageTitle">Cart</div>
      <div className="subTitle">Review your items before checkout.</div>

      {cart.length === 0 ? (
        <div className="alert">
          Cart is empty.{" "}
          <button className="btn btnGhost" onClick={() => navigate("/menu")}>
            Go to menu
          </button>
        </div>
      ) : (
        <>
          <div className="grid">
            {cart.map((item) => (
              <div className="col-12" key={item.product_id}>
                <div className="card cardPad">
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 14 }}>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 16 }}>{item.name}</div>
                      <div style={{ color: "var(--muted)", marginTop: 4 }}>
                        {format_omr(item.price_omr)} OMR • {item.category}
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <input
                        className="input"
                        style={{ width: 110 }}
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => set_qty(item.product_id, e.target.value)}
                      />
                      <button className="btn btnDanger" onClick={() => remove_from_cart(item.product_id)}>
                        Remove
                      </button>
                    </div>
                  </div>

                  <div className="field" style={{ marginTop: 12 }}>
                    <div className="label">Note (optional)</div>
                    <input
                      className="input"
                      placeholder="Optional note..."
                      value={item.note || ""}
                      onChange={(e) => set_note(item.product_id, e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="panel" style={{ marginTop: 14 }}>
            <div className="cardPad" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div className="label">Subtotal</div>
                <div style={{ fontWeight: 900, fontSize: 18 }}>{format_omr(subtotal_omr)} OMR</div>
              </div>

              <button className="btn btnPrimary" onClick={() => navigate("/checkout")}>
                Go to checkout
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function format_omr(n) {
  return Number(n || 0).toFixed(3);
}
