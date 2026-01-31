import React, { useEffect, useState } from "react";
import api from "../../api/api";

export default function Reports() {
  const [date, setDate] = useState(() => {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [summary, setSummary] = useState(null);
  const [orders, setOrders] = useState([]);
  const [openOrderId, setOpenOrderId] = useState(null);

  const fetch_report = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get(`/api/reports/daily?date=${date}`);
      setSummary(res.data.summary || null);
      setOrders(res.data.orders || []);
      setOpenOrderId(null);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to load report");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch_report();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleOrder = (order_id) => {
    setOpenOrderId((prev) => (prev === order_id ? null : order_id));
  };

  return (
    <div className="container page">
      <div className="pageTitle">Daily Shift Report</div>
      <div className="subTitle">Pick a working day start date to view totals and orders.</div>

      {/* Controls */}
      <div className="panel" style={{ marginBottom: 14 }}>
        <div
          className="cardPad"
          style={{
            display: "flex",
            gap: 12,
            alignItems: "end",
            flexWrap: "wrap",
            justifyContent: "space-between",
          }}
        >
          <div className="field" style={{ marginBottom: 0, minWidth: 260 }}>
            <div className="label">Working day start date</div>
            <input
              className="input"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <button className="btn btnPrimary" onClick={fetch_report} disabled={loading}>
            {loading ? "Loading..." : "Load"}
          </button>
        </div>
      </div>

      {error ? <div className="alert alertError">{error}</div> : null}
      {loading ? <div className="alert">Loading report…</div> : null}

      {/* Summary cards */}
      {summary ? (
        <div className="grid" style={{ marginTop: 14, marginBottom: 14 }}>
          <div className="col-4">
            <div className="card cardPad">
              <div className="label">Total Revenue</div>
              <div style={{ fontSize: 22, fontWeight: 900, marginTop: 6 }}>
                {format_omr(summary.total_revenue_omr)} OMR
              </div>
            </div>
          </div>

          <div className="col-4">
            <div className="card cardPad">
              <div className="label">Cash</div>
              <div style={{ fontSize: 22, fontWeight: 900, marginTop: 6 }}>
                {format_omr(summary.total_cash_omr)} OMR
              </div>
            </div>
          </div>

          <div className="col-4">
            <div className="card cardPad">
              <div className="label">Visa</div>
              <div style={{ fontSize: 22, fontWeight: 900, marginTop: 6 }}>
                {format_omr(summary.total_visa_omr)} OMR
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Orders Table */}
      <div className="tableWrap">
        <table>
          <thead>
            <tr>
              <th>Order</th>
              <th>Created At</th>
              <th>Payment</th>
              <th>Total (OMR)</th>
              <th>Cashier</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => {
              const isOpen = openOrderId === o.order_id;

              return (
                <React.Fragment key={o.order_id}>
                  <tr
                    onClick={() => toggleOrder(o.order_id)}
                    style={{ cursor: "pointer" }}
                    title="Click to show items"
                  >
                    <td style={{ fontWeight: 900 }}>#{o.order_id}</td>
                    <td>{new Date(o.created_at).toLocaleString()}</td>
                    <td>{o.payment_method}</td>
                    <td>{format_omr(o.total_amount_omr)}</td>
                    <td>{o.cashier_name || o.cashier_id}</td>
                  </tr>

                  {isOpen && (
                    <tr>
                      <td colSpan={5}>
                        <div className="card cardPad" style={{ margin: "10px 0" }}>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              gap: 12,
                              marginBottom: 10,
                            }}
                          >
                            <div style={{ fontWeight: 900 }}>Order Items</div>
                            <button className="btn btnGhost" onClick={() => setOpenOrderId(null)}>
                              Close
                            </button>
                          </div>

                          {!Array.isArray(o.items) || o.items.length === 0 ? (
                            <div className="alert">
                              No items found for this order. (Make sure reports API returns items)
                            </div>
                          ) : (
                            <div className="tableWrap">
                              <table style={{ minWidth: 520 }}>
                                <thead>
                                  <tr>
                                    <th>Item</th>
                                    <th>Category</th>
                                    <th>Qty</th>
                                    <th>Price (OMR)</th>
                                    <th>Note</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {o.items.map((it, idx) => (
                                    <tr key={idx}>
                                      <td style={{ fontWeight: 800 }}>{it.name}</td>
                                      <td>{it.category}</td>
                                      <td>{it.quantity}</td>
                                      <td>{format_omr(it.price_at_sale_omr)}</td>
                                      <td>{it.note?.trim() ? it.note : "-"}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {orders.length === 0 && !loading ? <div className="alert">No orders.</div> : null}
    </div>
  );
}

function format_omr(n) {
  return Number(n || 0).toFixed(3);
}
