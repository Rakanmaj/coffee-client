import React, { useEffect, useState } from "react";
import api from "../../api/api";

export default function ManageMenu() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    price_omr: "",
    category: "hot",
  });

  const [edit, setEdit] = useState(null);

  useEffect(() => {
    fetch_all();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetch_all = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/api/products");
      setProducts(res.data.products || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  const handle_add = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await api.post("/api/products", {
        name: form.name,
        price_omr: form.price_omr,
        category: form.category,
      });
      setForm({ name: "", price_omr: "", category: "hot" });
      fetch_all();
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Add failed");
    }
  };

  const start_edit = (p) => {
    setEdit({
      ...p,
      price_omr: String(p.price_omr),
    });
  };

  const save_edit = async () => {
    setError("");
    try {
      await api.put(`/api/products/${edit.product_id}`, {
        name: edit.name,
        price_omr: edit.price_omr,
        category: edit.category,
        is_active: edit.is_active,
      });
      setEdit(null);
      fetch_all();
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Update failed");
    }
  };

  const remove_product = async (product_id) => {
    setError("");
    if (!window.confirm("Delete this product?")) return;

    try {
      await api.delete(`/api/products/${product_id}`);
      fetch_all();
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Delete failed");
    }
  };

  const toggle_active = async (p) => {
    setError("");
    try {
      await api.put(`/api/products/${p.product_id}`, {
        name: p.name,
        price_omr: p.price_omr,
        category: p.category,
        is_active: !p.is_active,
      });
      fetch_all();
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Update failed");
    }
  };

  return (
    <div className="container page">
      <div className="pageTitle">Manage Menu</div>
      <div className="subTitle">Add, edit, activate/deactivate, and delete products.</div>

      {error ? <div className="alert alertError">{error}</div> : null}

      <div className="grid">
        {/* Add Product */}
        <div className="col-6">
          <div className="panel">
            <div className="cardPad">
              <div style={{ fontWeight: 900, fontSize: 16, marginBottom: 12 }}>Add Product</div>

              <form onSubmit={handle_add}>
                <div className="field">
                  <div className="label">Name</div>
                  <input
                    className="input"
                    value={form.name}
                    onChange={(e) => setForm((x) => ({ ...x, name: e.target.value }))}
                    required
                  />
                </div>

                <div className="field">
                  <div className="label">Price (OMR)</div>
                  <input
                    className="input"
                    value={form.price_omr}
                    onChange={(e) => setForm((x) => ({ ...x, price_omr: e.target.value }))}
                    placeholder="1.250"
                    required
                  />
                </div>

                <div className="field">
                  <div className="label">Category</div>
                  <select
                    className="select"
                    value={form.category}
                    onChange={(e) => setForm((x) => ({ ...x, category: e.target.value }))}
                  >
                    <option value="hot">hot</option>
                    <option value="cold">cold</option>
                    <option value="snack">snack</option>
                  </select>
                </div>

                <button className="btn btnPrimary" type="submit">
                  Add
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* All Products */}
        <div className="col-6">
          <div className="panel">
            <div className="cardPad">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                <div style={{ fontWeight: 900, fontSize: 16 }}>All Products</div>
                <button className="btn btnGhost" onClick={fetch_all} disabled={loading} type="button">
                  Refresh
                </button>
              </div>

              {loading ? (
                <div className="subTitle" style={{ marginTop: 10 }}>
                  Loading...
                </div>
              ) : null}

              <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
                {products.map((p) => (
                  <div className="card cardPad" key={p.product_id}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                      <div>
                        <div style={{ fontWeight: 800 }}>
                          {p.name}{" "}
                          <span className="badge">{p.is_active ? "active" : "inactive"}</span>
                        </div>
                        <div style={{ color: "var(--muted)", marginTop: 4 }}>
                          {format_omr(p.price_omr)} OMR • {p.category}
                        </div>
                      </div>

                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "flex-end" }}>
                        <button className="btn" onClick={() => start_edit(p)} type="button">
                          Edit
                        </button>
                        <button className="btn" onClick={() => toggle_active(p)} type="button">
                          {p.is_active ? "Deactivate" : "Activate"}
                        </button>
                        <button
                          className="btn btnDanger"
                          onClick={() => remove_product(p.product_id)}
                          type="button"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {!loading && products.length === 0 ? <div className="alert">No products found.</div> : null}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal (uses global modalOverlay/modalCard) */}
      {edit ? (
        <div className="modalOverlay" onClick={() => setEdit(null)}>
          <div className="modalCard cardPad" onClick={(e) => e.stopPropagation()}>
            <div style={{ fontWeight: 900, fontSize: 16, marginBottom: 12 }}>Edit Product</div>

            <div className="field">
              <div className="label">Name</div>
              <input
                className="input"
                value={edit.name}
                onChange={(e) => setEdit((x) => ({ ...x, name: e.target.value }))}
                required
              />
            </div>

            <div className="field">
              <div className="label">Price (OMR)</div>
              <input
                className="input"
                value={edit.price_omr}
                onChange={(e) => setEdit((x) => ({ ...x, price_omr: e.target.value }))}
                required
              />
            </div>

            <div className="field">
              <div className="label">Category</div>
              <select
                className="select"
                value={edit.category}
                onChange={(e) => setEdit((x) => ({ ...x, category: e.target.value }))}
              >
                <option value="hot">hot</option>
                <option value="cold">cold</option>
                <option value="snack">snack</option>
              </select>
            </div>

            <div className="field" style={{ marginTop: 8 }}>
              <label style={{ display: "flex", gap: 10, alignItems: "center", color: "var(--muted)" }}>
                <input
                  type="checkbox"
                  checked={!!edit.is_active}
                  onChange={(e) => setEdit((x) => ({ ...x, is_active: e.target.checked }))}
                />
                is_active
              </label>
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 14 }}>
              <button className="btn btnPrimary" onClick={save_edit} type="button">
                Save
              </button>
              <button className="btn btnGhost" onClick={() => setEdit(null)} type="button">
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function format_omr(n) {
  return Number(n || 0).toFixed(3);
}
