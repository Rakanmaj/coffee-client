import React, { useEffect, useState } from "react";
import api from "../../api/api";

export default function Storage() {
  const [items, setItems] = useState([]);
  const [snacks, setSnacks] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [product_id, set_product_id] = useState("");
  const [qty, set_qty] = useState("");

  const load_all = async () => {
    setLoading(true);
    setError("");
    try {
      const inv = await api.get("/api/inventory");
      setItems(inv.data.items || []);

      const prod = await api.get("/api/products");
      const snack_products = (prod.data.products || []).filter((p) => p.category === "snack");
      setSnacks(snack_products);

      if (!product_id && snack_products.length > 0) {
        set_product_id(String(snack_products[0].product_id));
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to load storage");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load_all();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const adjust = async (e) => {
    e.preventDefault();
    setError("");

    try {
      await api.post("/api/inventory/adjust", {
        product_id: Number(product_id),
        delta: Number(qty),
      });
      set_qty("");
      load_all();
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Update failed");
    }
  };

  return (
    <div className="container page">
      <div className="pageTitle">Snack Storage</div>
      <div className="subTitle">Adjust snack inventory using a positive or negative delta.</div>

      {error ? <div className="alert alertError">{error}</div> : null}

      <div className="grid">
        {/* Left: Manage Storage */}
        <div className="col-6">
          <div className="panel">
            <div className="cardPad">
              <div style={{ fontWeight: 900, fontSize: 18, marginBottom: 12 }}>
                Manage Storage
              </div>

              <form onSubmit={adjust}>
                <div className="field">
                  <div className="label">Snack Product</div>
                  <select
                    className="select"
                    value={product_id}
                    onChange={(e) => set_product_id(e.target.value)}
                    disabled={loading || snacks.length === 0}
                  >
                    {snacks.map((p) => (
                      <option key={p.product_id} value={p.product_id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="field">
                  <div className="label">Quantity change (delta)</div>
                  <input
                    className="input"
                    value={qty}
                    onChange={(e) => set_qty(e.target.value)}
                    placeholder="e.g. 10 or -3"
                    required
                  />
                </div>

                <button className="btn btnPrimary" disabled={loading}>
                  Update
                </button>

                <div className="subTitle" style={{ marginTop: 12 }}>
                  Use positive to add stock, negative to reduce.
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Right: Inventory Table */}
        <div className="col-6">
          <div className="panel">
            <div className="cardPad">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  marginBottom: 12,
                }}
              >
                <div style={{ fontWeight: 900, fontSize: 18 }}>
                  Inventory (Snacks only)
                </div>

                <button className="btn btnGhost" onClick={load_all} disabled={loading}>
                  Refresh
                </button>
              </div>

              {loading ? <div className="alert">Loading...</div> : null}

              <div className="tableWrap" style={{ marginTop: 12 }}>
                <table>
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Qty</th>
                      <th>Updated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((x) => (
                      <tr key={x.product_id}>
                        <td>{x.name}</td>
                        <td>{x.quantity}</td>
                        <td>{x.updated_at ? new Date(x.updated_at).toLocaleString() : "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {items.length === 0 && !loading ? (
                <div className="alert" style={{ marginTop: 12 }}>
                  No snack inventory yet.
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
