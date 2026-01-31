import React from "react";

export default function ProductCard({ product, on_add }) {
  return (
    <div className="card cardPad">
      
      <div style={{ fontWeight: 800, fontSize: 16 }}>
        {product.name}
      </div>

      <div style={{ color: "var(--muted)", margin: "6px 0 12px" }}>
        {format_omr(product.price_omr)} OMR
      </div>

      <button
        className="btn btnPrimary"
        onClick={() => on_add(product)}
      >
        Add
      </button>
    </div>
  );
}

function format_omr(n) {
  const num = Number(n || 0);
  return num.toFixed(3);
}
