import React, { useEffect, useMemo, useState } from "react";
import api from "../../api/api";
import { useApp } from "../../context/AppContext";
import ProductCard from "../../components/ProductCard";

export default function Menu() {
  const { add_to_cart } = useApp();

  const [products, setProducts] = useState([]);
  const [tab, setTab] = useState("hot");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetch_active = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/api/products/active");
      setProducts(res.data.products || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to load menu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch_active();
  }, []);

  const grouped = useMemo(() => {
    const out = { hot: [], cold: [], snack: [] };
    for (const p of products) {
      if (out[p.category]) out[p.category].push(p);
    }
    return out;
  }, [products]);

  const activeList = grouped[tab] || [];

  return (
    <div className="container page">
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <div className="pageTitle">Menu</div>
          <div className="subTitle">Tap an item to add it to the cart.</div>
        </div>

        <button className="btn btnGhost" onClick={fetch_active} disabled={loading}>
          Refresh
        </button>
      </div>

      <div className="tabs" style={{ marginBottom: 14 }}>
        <button
          type="button"
          className={tab === "hot" ? "tab tabActive" : "tab"}
          onClick={() => setTab("hot")}
        >
          Hot Drinks
        </button>

        <button
          type="button"
          className={tab === "cold" ? "tab tabActive" : "tab"}
          onClick={() => setTab("cold")}
        >
          Cold Drinks
        </button>

        <button
          type="button"
          className={tab === "snack" ? "tab tabActive" : "tab"}
          onClick={() => setTab("snack")}
        >
          Snacks
        </button>
      </div>

      {loading ? <div className="alert">Loading...</div> : null}

      {error ? <div className="alert alertError">{error}</div> : null}

      {!loading && !error && activeList.length === 0 ? (
        <div className="alert">No items in this category.</div>
      ) : null}

      <div className="grid" style={{ marginTop: 14 }}>
        {activeList.map((p) => (
          <div className="col-4" key={p.product_id}>
            <ProductCard product={p} on_add={add_to_cart} />
          </div>
        ))}
      </div>
    </div>
  );
}
