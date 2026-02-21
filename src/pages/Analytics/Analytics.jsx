import React, { useEffect, useMemo, useState } from "react";
import api from "../../api/api";

function fmtOMR(n) {
  const x = Number(n || 0);
  return x.toFixed(3);
}

function ymd(d) {
  // yyyy-mm-dd
  const dt = new Date(d);
  const yyyy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function startOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay(); // 0 Sun
  const diff = (day + 6) % 7; // Monday start
  d.setDate(d.getDate() - diff);
  return d;
}

function endOfWeek(date) {
  const s = startOfWeek(date);
  const e = new Date(s);
  e.setDate(e.getDate() + 6);
  return e;
}

export default function Analytics() {
  // Filter mode: quick | range | month | all
  const [mode, setMode] = useState("today"); // today | week | month | all | range | monthPick
  const [startDate, setStartDate] = useState(() => ymd(new Date()));
  const [endDate, setEndDate] = useState(() => ymd(new Date()));
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const query = useMemo(() => {
    const today = new Date();

    if (mode === "today") {
      const d = ymd(today);
      return { start: d, end: d };
    }

    if (mode === "week") {
      const s = ymd(startOfWeek(today));
      const e = ymd(endOfWeek(today));
      return { start: s, end: e };
    }

    if (mode === "month") {
      // month picker based on current month
      return { month };
    }

    if (mode === "monthPick") {
      return { month };
    }

    if (mode === "all") {
      // backend should interpret all-time (we’ll pass a very early date)
      return { start: "2000-01-01", end: ymd(today) };
    }

    // custom range
    return { start: startDate, end: endDate };
  }, [mode, startDate, endDate, month]);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError("");
    try {
      let url = "/api/analytics?";
      if (query.month) {
        url += `month=${encodeURIComponent(query.month)}`;
      } else {
        url += `start=${encodeURIComponent(query.start)}&end=${encodeURIComponent(query.end)}`;
      }

      const res = await api.get(url);
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to load analytics");
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, startDate, endDate, month]);

  const summary = data?.summary;
  const payments = data?.payments;
  const top = data?.top_products;
  const cat = data?.category_performance;
  const peak = data?.peak;
  const daily = data?.daily;

  return (
    <div className="container page">
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <div className="pageTitle">Analytics</div>
          <div className="subTitle">Sales insights without charts.</div>
        </div>

        <button className="btn btnGhost" onClick={fetchAnalytics} disabled={loading}>
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="panel">
        <div className="cardPad">
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <div className="tabs">
              <button className={mode === "today" ? "tab tabActive" : "tab"} onClick={() => setMode("today")}>
                Today
              </button>
              <button className={mode === "week" ? "tab tabActive" : "tab"} onClick={() => setMode("week")}>
                This Week
              </button>
              <button className={mode === "month" ? "tab tabActive" : "tab"} onClick={() => setMode("month")}>
                This Month
              </button>
              <button className={mode === "all" ? "tab tabActive" : "tab"} onClick={() => setMode("all")}>
                All Time
              </button>
              <button className={mode === "range" ? "tab tabActive" : "tab"} onClick={() => setMode("range")}>
                Custom Range
              </button>
              <button className={mode === "monthPick" ? "tab tabActive" : "tab"} onClick={() => setMode("monthPick")}>
                Month Picker
              </button>
            </div>

            {mode === "range" ? (
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <div className="field" style={{ marginBottom: 0 }}>
                  <div className="label">Start Date</div>
                  <input className="input" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </div>
                <div className="field" style={{ marginBottom: 0 }}>
                  <div className="label">End Date</div>
                  <input className="input" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </div>
              </div>
            ) : null}

            {(mode === "month" || mode === "monthPick") ? (
              <div className="field" style={{ marginBottom: 0 }}>
                <div className="label">Month (YYYY-MM)</div>
                <input className="input" type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {loading ? <div className="alert" style={{ marginTop: 14 }}>Loading...</div> : null}
      {error ? <div className="alert alertError" style={{ marginTop: 14 }}>{error}</div> : null}

      {!loading && !error && data ? (
        <>
          {/* KPI Row */}
          <div className="grid" style={{ marginTop: 14 }}>
            <div className="col-6">
              <div className="card">
                <div className="cardPad">
                  <div className="subTitle" style={{ marginBottom: 10 }}>Revenue Summary</div>
                  <div style={{ display: "grid", gap: 8 }}>
                    <div><b>Total Revenue:</b> {fmtOMR(summary?.total_revenue_omr)} OMR</div>
                    <div><b>Orders:</b> {summary?.orders_count ?? 0}</div>
                    <div><b>Average Order Value (AOV):</b> {fmtOMR(summary?.aov_omr)} OMR</div>
                    <div><b>Daily Avg Revenue:</b> {fmtOMR(daily?.avg_revenue_omr)} OMR/day</div>
                    <div><b>Best Day (Max):</b> {daily?.best_day ? `${daily.best_day.day} — ${fmtOMR(daily.best_day.revenue_omr)} OMR` : "—"}</div>
                    <div><b>Worst Day (Min):</b> {daily?.worst_day ? `${daily.worst_day.day} — ${fmtOMR(daily.worst_day.revenue_omr)} OMR` : "—"}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-6">
              <div className="card">
                <div className="cardPad">
                  <div className="subTitle" style={{ marginBottom: 10 }}>Payments</div>
                  <div style={{ display: "grid", gap: 8 }}>
                    <div>
                      <b>Cash:</b> {fmtOMR(payments?.cash_omr)} OMR ({Number(payments?.cash_pct || 0).toFixed(2)}%)
                    </div>
                    <div>
                      <b>Visa:</b> {fmtOMR(payments?.visa_omr)} OMR ({Number(payments?.visa_pct || 0).toFixed(2)}%)
                    </div>
                    <div>
                      <b>Avg Items/Order:</b> {Number(data?.avg_items_per_order || 0).toFixed(2)} items
                    </div>
                    <div>
                      <b>Peak Hour:</b> {peak?.peak_hour || "—"}
                    </div>
                    <div>
                      <b>Peak Day:</b> {peak?.peak_day || "—"}
                    </div>
                  </div>

                  {/* Month comparison if available */}
                  {data?.month_compare ? (
                    <div style={{ marginTop: 14 }} className="alert">
                      <b>Comparison vs Previous Month:</b>{" "}
                      Previous Revenue: {fmtOMR(data.month_compare.prev_revenue_omr)} OMR
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          {/* Top Products (no charts) */}
          <div className="grid" style={{ marginTop: 14 }}>
            <div className="col-6">
              <div className="card">
                <div className="cardPad">
                  <div className="subTitle" style={{ marginBottom: 10 }}>Top Product (Units)</div>
                  {top?.top_by_units ? (
                    <div style={{ display: "grid", gap: 8 }}>
                      <div><b>Product:</b> {top.top_by_units.name} ({top.top_by_units.category})</div>
                      <div><b>Units Sold:</b> {top.top_by_units.units}</div>
                      <div><b>Revenue:</b> {fmtOMR(top.top_by_units.revenue_omr)} OMR</div>
                    </div>
                  ) : (
                    <div className="alert">No sales in this period.</div>
                  )}
                </div>
              </div>
            </div>

            <div className="col-6">
              <div className="card">
                <div className="cardPad">
                  <div className="subTitle" style={{ marginBottom: 10 }}>Top Product (Revenue)</div>
                  {top?.top_by_revenue ? (
                    <div style={{ display: "grid", gap: 8 }}>
                      <div><b>Product:</b> {top.top_by_revenue.name} ({top.top_by_revenue.category})</div>
                      <div><b>Units Sold:</b> {top.top_by_revenue.units}</div>
                      <div><b>Revenue:</b> {fmtOMR(top.top_by_revenue.revenue_omr)} OMR</div>
                    </div>
                  ) : (
                    <div className="alert">No sales in this period.</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Top product averages */}
          <div className="grid" style={{ marginTop: 14 }}>
            <div className="col-6">
              <div className="card">
                <div className="cardPad">
                  <div className="subTitle" style={{ marginBottom: 10 }}>All-time Best Seller (within range)</div>
                  {top?.all_time_best_seller ? (
                    <div style={{ display: "grid", gap: 8 }}>
                      <div><b>Product:</b> {top.all_time_best_seller.name} ({top.all_time_best_seller.category})</div>
                      <div><b>Total Units:</b> {top.all_time_best_seller.units}</div>
                      <div><b>Total Revenue:</b> {fmtOMR(top.all_time_best_seller.revenue_omr)} OMR</div>
                    </div>
                  ) : (
                    <div className="alert">No data.</div>
                  )}
                </div>
              </div>
            </div>

            <div className="col-6">
              <div className="card">
                <div className="cardPad">
                  <div className="subTitle" style={{ marginBottom: 10 }}>Top-Product Daily Average</div>
                  <div style={{ display: "grid", gap: 8 }}>
                    <div>
                      <b>Average units of the daily #1 product:</b>{" "}
                      {Number(top?.top_product_daily_avg_units || 0).toFixed(2)}
                    </div>
                    <div className="subTitle" style={{ margin: 0 }}>
                      Each day we take the best-selling product of that day, then average it over the selected range.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Category performance */}
          <div className="card" style={{ marginTop: 14 }}>
            <div className="cardPad">
              <div className="subTitle" style={{ marginBottom: 10 }}>Category Performance</div>

              <div className="tableWrap">
                <table>
                  <thead>
                    <tr>
                      <th>Category</th>
                      <th>Units Sold</th>
                      <th>Revenue (OMR)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(cat?.rows || []).map((r) => (
                      <tr key={r.category}>
                        <td>{r.category}</td>
                        <td>{r.units}</td>
                        <td>{fmtOMR(r.revenue_omr)}</td>
                      </tr>
                    ))}
                    {!cat?.rows?.length ? (
                      <tr>
                        <td colSpan={3}>No data.</td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>

              <div style={{ marginTop: 10, display: "flex", gap: 18, flexWrap: "wrap" }}>
                <div><b>Best Category by Revenue:</b> {cat?.best_by_revenue || "—"}</div>
                <div><b>Best Category by Units:</b> {cat?.best_by_units || "—"}</div>
              </div>
            </div>
          </div>

          {/* Top 5 products */}
          <div className="card" style={{ marginTop: 14 }}>
            <div className="cardPad">
              <div className="subTitle" style={{ marginBottom: 10 }}>Top 5 Products</div>
              <div className="tableWrap">
                <table>
                  <thead>
                    <tr>
                      <th>Rank</th>
                      <th>Product</th>
                      <th>Category</th>
                      <th>Units</th>
                      <th>Revenue (OMR)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(top?.top5 || []).map((r, idx) => (
                      <tr key={r.product_id}>
                        <td>{idx + 1}</td>
                        <td>{r.name}</td>
                        <td>{r.category}</td>
                        <td>{r.units}</td>
                        <td>{fmtOMR(r.revenue_omr)}</td>
                      </tr>
                    ))}
                    {!top?.top5?.length ? (
                      <tr>
                        <td colSpan={5}>No data.</td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Slow movers */}
          <div className="card" style={{ marginTop: 14 }}>
            <div className="cardPad">
              <div className="subTitle" style={{ marginBottom: 10 }}>Slow Movers</div>
              <div className="tableWrap">
                <table>
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Category</th>
                      <th>Units</th>
                      <th>Revenue (OMR)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(top?.slow_movers || []).map((r) => (
                      <tr key={r.product_id}>
                        <td>{r.name}</td>
                        <td>{r.category}</td>
                        <td>{r.units}</td>
                        <td>{fmtOMR(r.revenue_omr)}</td>
                      </tr>
                    ))}
                    {!top?.slow_movers?.length ? (
                      <tr>
                        <td colSpan={4}>No data.</td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Busiest Hours */}
          <div className="card" style={{ marginTop: 14 }}>
            <div className="cardPad">
              <div className="subTitle" style={{ marginBottom: 10 }}>Busiest Hours (Orders Count)</div>
              <div className="tableWrap">
                <table>
                  <thead>
                    <tr>
                      <th>Hour</th>
                      <th>Orders</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(peak?.busiest_hours || []).map((r) => (
                      <tr key={r.hour}>
                        <td>{r.hour}</td>
                        <td>{r.orders}</td>
                      </tr>
                    ))}
                    {!peak?.busiest_hours?.length ? (
                      <tr>
                        <td colSpan={2}>No data.</td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Sales by Day */}
          <div className="card" style={{ marginTop: 14 }}>
            <div className="cardPad">
              <div className="subTitle" style={{ marginBottom: 10 }}>Sales by Day</div>
              <div className="tableWrap">
                <table>
                  <thead>
                    <tr>
                      <th>Day</th>
                      <th>Orders</th>
                      <th>Revenue (OMR)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data?.peak?.sales_by_day || []).map((r) => (
                      <tr key={r.day}>
                        <td>{r.day}</td>
                        <td>{r.orders}</td>
                        <td>{fmtOMR(r.revenue_omr)}</td>
                      </tr>
                    ))}
                    {!data?.peak?.sales_by_day?.length ? (
                      <tr>
                        <td colSpan={3}>No data.</td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Daily revenue list */}
          <div className="card" style={{ marginTop: 14 }}>
            <div className="cardPad">
              <div className="subTitle" style={{ marginBottom: 10 }}>Daily Revenue List</div>
              <div className="tableWrap">
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Revenue (OMR)</th>
                      <th>Orders</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(daily?.list || []).map((r) => (
                      <tr key={r.day}>
                        <td>{r.day}</td>
                        <td>{fmtOMR(r.revenue_omr)}</td>
                        <td>{r.orders}</td>
                      </tr>
                    ))}
                    {!daily?.list?.length ? (
                      <tr>
                        <td colSpan={3}>No data.</td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}