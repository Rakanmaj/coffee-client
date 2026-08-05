import React, { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import api from "../../api/api";
import { useDriveThrough } from "../../context/DriveThroughContext";
import "./DriveThroughOrders.css";

const RAILWAY_CLIENT_URL = "https://coffee-client-production.up.railway.app";
const CUSTOMER_QR_URL = `${RAILWAY_CLIENT_URL}/drive-thru`;

export default function DriveThroughOrders() {
  const [orderingEnabled, setOrderingEnabled] = useState(null);
  const [availabilitySaving, setAvailabilitySaving] = useState(false);
  const [availabilityError, setAvailabilityError] = useState("");
  const {
    orders,
    pendingCount,
    loading,
    savingId,
    error,
    audioReady,
    enableAudio,
    fetchOrders,
    updateOrder,
  } = useDriveThrough();
  const publicUrl = CUSTOMER_QR_URL;

  useEffect(() => {
    let mounted = true;

    api.get("/api/drive-through/availability")
      .then((response) => {
        if (mounted) setOrderingEnabled(Boolean(response.data.enabled));
      })
      .catch(() => {
        if (mounted) setAvailabilityError("Could not load the ordering setting.");
      });

    return () => {
      mounted = false;
    };
  }, []);

  async function toggleAvailability() {
    if (orderingEnabled === null || availabilitySaving) return;

    const next_enabled = !orderingEnabled;
    setAvailabilitySaving(true);
    setAvailabilityError("");

    try {
      const response = await api.put("/api/drive-through/availability", {
        enabled: next_enabled,
      });
      setOrderingEnabled(Boolean(response.data.enabled));
    } catch {
      setAvailabilityError("Could not update the ordering setting.");
    } finally {
      setAvailabilitySaving(false);
    }
  }

  return (
    <div className="container page">
      <div className="driveAdminHeader">
        <div>
          <div className="pageTitle">Drive Through</div>
          <div className="subTitle">Live car orders from the public QR menu.</div>
        </div>

        <div className="driveAdminHeaderActions">
          {!audioReady ? (
            <button className="btn btnPrimary" onClick={enableAudio} type="button">
              Enable sound
            </button>
          ) : null}
          <button className="btn btnGhost" onClick={fetchOrders} disabled={loading} type="button">
            Refresh
          </button>
        </div>
      </div>

      {error ? <div className="alert alertError">{error}</div> : null}

      <div className="grid" style={{ marginTop: 14 }}>
        <div className="col-4">
          <div className="panel">
            <div className="cardPad driveAvailabilityControl">
              <div>
                <div className="driveAvailabilityTitle">Drive-through ordering</div>
                <div className="subTitle">
                  When disabled, customers will see an unavailable page instead of the ordering menu.
                </div>
              </div>
              <button
                className={`driveAvailabilitySwitch ${orderingEnabled ? "enabled" : ""}`}
                aria-checked={Boolean(orderingEnabled)}
                aria-label="Drive-through ordering"
                disabled={orderingEnabled === null || availabilitySaving}
                onClick={toggleAvailability}
                role="switch"
                type="button"
              >
                <span aria-hidden="true" />
                <b>{orderingEnabled ? "Enabled" : "Disabled"}</b>
              </button>
              {availabilityError ? <div className="alert alertError">{availabilityError}</div> : null}
            </div>
          </div>

          <div className="panel" style={{ marginTop: 14 }}>
            <div className="cardPad driveQrPanel">
              <div>
                <div style={{ fontWeight: 900, fontSize: 16 }}>Customer QR</div>
                <div className="subTitle" style={{ marginTop: 6 }}>
                  {publicUrl}
                </div>
              </div>
              <div className="driveQrBox">
                <QRCodeSVG value={publicUrl} size={210} level="M" includeMargin />
              </div>
            </div>
          </div>

          <div className="panel" style={{ marginTop: 14 }}>
            <div className="cardPad">
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <div>
                  <div style={{ fontWeight: 900, fontSize: 16 }}>Pending Orders</div>
                  <div className="subTitle" style={{ marginTop: 6, marginBottom: 0 }}>
                    Drive-through queue
                  </div>
                </div>
                <span className="badge">{pendingCount}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="col-8">
          {loading ? <div className="alert">Loading orders...</div> : null}

          {!loading && orders.length === 0 ? (
            <div className="alert">No drive-through orders right now.</div>
          ) : null}

          <div className="driveOrderStack">
            {orders.map((order) => (
              <DriveOrderCard
                key={order.id}
                order={order}
                savingId={savingId}
                onAction={updateOrder}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function DriveOrderCard({ order, savingId, onAction }) {
  const total_items = order.items.reduce((acc, item) => acc + Number(item.quantity), 0);
  const is_saving = savingId.startsWith(`${order.id}:`);

  return (
    <div className={`card cardPad driveAdminOrder status-${order.status}`}>
      <div className="driveAdminOrderTop">
        <div>
          <div className="driveAdminStatus">{status_label(order.status)}</div>
          <div style={{ fontWeight: 900, fontSize: 20 }}>
            {order.order_id ? `POS #${order.order_id}` : `QR ${order.id.slice(0, 8)}`}
          </div>
          <div className="subTitle" style={{ marginTop: 4, marginBottom: 0 }}>
            {new Date(order.created_at).toLocaleString()}
          </div>
        </div>

        <div className="driveAdminTotal">
          <span>{total_items} item{total_items === 1 ? "" : "s"}</span>
          <strong>{format_omr(order.total_amount_omr)} OMR</strong>
        </div>
      </div>

      <div className="driveAdminMeta">
        <div>
          <span>Car</span>
          <strong>{order.car_type}</strong>
        </div>
        <div>
          <span>Payment</span>
          <strong>{order.payment_method}</strong>
        </div>
      </div>

      <div className="driveAdminItems">
        {order.items.map((item) => (
          <div className="driveAdminItem" key={item.product_id}>
            <div>
              <strong>{item.name}</strong>
              {item.note ? <span>{item.note}</span> : null}
            </div>
            <b>x{item.quantity}</b>
          </div>
        ))}
      </div>

      <div className="driveAdminActions">
        {order.status === "pending" ? (
          <button
            className="btn btnPrimary"
            disabled={is_saving}
            onClick={() => onAction(order.id, "accept")}
            type="button"
          >
            {savingId === `${order.id}:accept` ? "Accepting..." : "Accept"}
          </button>
        ) : null}

        {order.status === "working" ? (
          <button
            className="btn btnPrimary"
            disabled={is_saving}
            onClick={() => onAction(order.id, "ready")}
            type="button"
          >
            {savingId === `${order.id}:ready` ? "Saving..." : "Ready"}
          </button>
        ) : null}

        {order.status === "ready" ? (
          <button
            className="btn btnPrimary"
            disabled={is_saving}
            onClick={() => onAction(order.id, "delivered")}
            type="button"
          >
            {savingId === `${order.id}:delivered` ? "Saving..." : "Delivered"}
          </button>
        ) : null}

        {["pending", "working", "ready"].includes(order.status) ? (
          <button
            className="btn btnGhost"
            disabled={is_saving}
            onClick={() => onAction(order.id, "not-delivered")}
            type="button"
          >
            {savingId === `${order.id}:not-delivered` ? "Saving..." : "Not Delivered"}
          </button>
        ) : null}
      </div>
    </div>
  );
}

function status_label(status) {
  if (status === "pending") return "Pending";
  if (status === "working") return "Working on it";
  if (status === "ready") return "Ready";
  if (status === "not_delivered") return "Not delivered";
  return status;
}

function format_omr(n) {
  return Number(n || 0).toFixed(3);
}
