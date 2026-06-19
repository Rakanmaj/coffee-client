import React, { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion as Motion } from "framer-motion";
import api from "../../api/api";
import { playCustomerTone, playReadyTone, unlockAudio } from "../../utils/sounds";
import { getCustomerMenuCategory } from "../../utils/displayCategory";
import MomentSplash from "../../components/MomentSplash";
import "./DriveThru.css";

const loadMomentCupScene = () => import("../../components/MomentCupScene");
const MomentCupScene = lazy(loadMomentCupScene);

const categories = [
  { id: "hot", label: "Hot", icon: "coffee" },
  { id: "cold", label: "Cold", icon: "ice" },
  { id: "snack", label: "Snacks", icon: "spark" },
];

export default function DriveThru() {
  const [products, setProducts] = useState([]);
  const [tab, setTab] = useState("hot");
  const [cart, setCart] = useState([]);
  const [carType, setCarType] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [order, setOrder] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [detailQuantity, setDetailQuantity] = useState(1);
  const [showSplash, setShowSplash] = useState(true);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function load_menu() {
      setLoading(true);
      setError("");

      try {
        const res = await api.get("/api/drive-through/menu");
        if (mounted) setProducts(res.data.products || []);
      } catch (err) {
        if (mounted) setError(err.response?.data?.message || err.message || "Failed to load menu");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load_menu();
    restore_order();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const preload = window.setTimeout(() => {
      loadMomentCupScene();
    }, 2100);
    const timer = window.setTimeout(() => setShowSplash(false), 4100);
    return () => {
      window.clearTimeout(preload);
      window.clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    if (!order?.id) return;

    let socket;
    let cancelled = false;

    const update = ({ order: next_order }) => {
      if (!next_order) return;
      setOrder((prev) => {
        if (prev?.status === "pending" && next_order.status === "working") {
          playCustomerTone();
        }

        if (prev?.status !== "ready" && next_order.status === "ready") {
          playReadyTone();
        }

        return next_order;
      });
    };

    async function connect_socket() {
      const { getSocket } = await import("../../api/socket");
      if (cancelled) return;

      socket = getSocket();
      socket.emit("drive-through:join", { orderId: order.id });
      socket.on("order-updated", update);
      socket.on("order-accepted", update);
      socket.on("order-ready", update);
      socket.on("order-delivered", update);
      socket.on("order-not-delivered", update);
    }

    connect_socket();

    return () => {
      cancelled = true;
      socket?.off("order-updated", update);
      socket?.off("order-accepted", update);
      socket?.off("order-ready", update);
      socket?.off("order-delivered", update);
      socket?.off("order-not-delivered", update);
    };
  }, [order?.id]);

  async function restore_order() {
    const existing_id = localStorage.getItem("driveThroughOrderId");
    if (!existing_id) return;

    try {
      const res = await api.get(`/api/drive-through/orders/${existing_id}`);
      setOrder(res.data.order);
    } catch {
      localStorage.removeItem("driveThroughOrderId");
    }
  }

  const grouped = useMemo(() => {
    const out = { hot: [], cold: [], snack: [] };
    for (const product of products) {
      const displayCategory = getCustomerMenuCategory(product);
      if (out[displayCategory]) out[displayCategory].push(product);
    }
    return out;
  }, [products]);

  const active_products = grouped[tab] || [];

  const total = useMemo(() => {
    const sum = cart.reduce(
      (acc, item) => acc + Number(item.price_omr) * Number(item.quantity),
      0
    );
    return Math.round(sum * 1000) / 1000;
  }, [cart]);

  function add_item(product, quantity = 1) {
    unlockAudio();
    const amount = Math.max(1, Number(quantity) || 1);

    setCart((prev) => {
      const found = prev.find((item) => item.product_id === product.product_id);
      if (found) {
        return prev.map((item) =>
          item.product_id === product.product_id
            ? { ...item, quantity: item.quantity + amount }
            : item
        );
      }

      return [
        ...prev,
        {
          product_id: product.product_id,
          name: product.name,
          price_omr: product.price_omr,
          quantity: amount,
          note: "",
        },
      ];
    });
  }

  function open_product(product) {
    setDetailQuantity(1);
    setSelectedProduct(product);
  }

  function close_product() {
    setSelectedProduct(null);
    setDetailQuantity(1);
  }

  function change_qty(product_id, delta) {
    setCart((prev) =>
      prev
        .map((item) =>
          item.product_id === product_id
            ? { ...item, quantity: item.quantity + delta }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  }

  function set_note(product_id, note) {
    setCart((prev) =>
      prev.map((item) => (item.product_id === product_id ? { ...item, note } : item))
    );
  }

  async function submit_order(e) {
    e.preventDefault();
    await unlockAudio();

    setError("");

    if (cart.length === 0) {
      setError("Choose at least one item.");
      return;
    }

    if (!carType.trim()) {
      setError("Tell us your car type so we can find you.");
      return;
    }

    setSubmitting(true);

    try {
      const res = await api.post("/api/drive-through/orders", {
        car_type: carType,
        payment_method: paymentMethod,
        items: cart.map((item) => ({
          product_id: item.product_id,
          quantity: item.quantity,
          note: item.note,
        })),
      });

      setOrder(res.data.order);
      localStorage.setItem("driveThroughOrderId", res.data.order.id);
      setCart([]);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Could not send order");
    } finally {
      setSubmitting(false);
    }
  }

  function start_new_order() {
    localStorage.removeItem("driveThroughOrderId");
    setOrder(null);
    setCart([]);
    setCarType("");
    setPaymentMethod("Cash");
    setError("");
  }

  if (order) {
    const orderItemCount = order.items.reduce((sum, item) => sum + Number(item.quantity), 0);

    return (
      <>
        <AnimatePresence>{showSplash ? <MomentSplash key="moment-splash" /> : null}</AnimatePresence>
        <main className="drivePage">
          <section className={`driveStatus status-${order.status}`}>
            <div className="driveStatusStage">
              <div className="driveBrandMark">Moment Drive-Through</div>
              {showSplash ? (
                <div className="momentCupCanvas momentCupCanvas-status" aria-hidden="true" />
              ) : (
                <Suspense fallback={<div className="momentSceneFallback status" aria-hidden="true" />}>
                  <MomentCupScene status={order.status} mode="status" />
                </Suspense>
              )}
              <div className="driveStatusCopy">
                <span className="driveStatusPill">{status_pill(order.status)}</span>
                <h1>{status_title(order.status)}</h1>
                <p>{status_body(order.status)}</p>
              </div>
              <StatusProgress status={order.status} />
            </div>

            <div className="driveStatusDetails">
              <div className="driveReceipt">
                <div>
                  <span>Order</span>
                  <strong>{order.order_id ? `#${order.order_id}` : order.id.slice(0, 8)}</strong>
                </div>
                <div>
                  <span>Car</span>
                  <strong>{order.car_type}</strong>
                </div>
                <div>
                  <span>Payment</span>
                  <strong>{order.payment_method}</strong>
                </div>
                <div>
                  <span>Total</span>
                  <strong>{format_omr(order.total_amount_omr)} OMR</strong>
                </div>
              </div>

              <div className="driveOrderItems">
                <div className="driveOrderItemsHeader">
                  <span>Items</span>
                  <strong>{orderItemCount}</strong>
                </div>
                {order.items.map((item) => (
                  <div className="driveOrderItem" key={item.product_id}>
                    <div>
                      <strong>{item.name}</strong>
                      {item.note ? <span>{item.note}</span> : null}
                    </div>
                    <b>x{item.quantity}</b>
                  </div>
                ))}
              </div>
            </div>

            {["delivered", "not_delivered"].includes(order.status) ? (
              <button className="drivePrimary" onClick={start_new_order} type="button">
                Start New Order
              </button>
            ) : null}
          </section>
        </main>
      </>
    );
  }

  return (
    <>
      <AnimatePresence>{showSplash ? <MomentSplash key="moment-splash" /> : null}</AnimatePresence>
      <main className="drivePage">
        <section className="momentHero">
        <div className="momentHeroCopy">
          <div className="driveBrandMark">Moment Drive-Through</div>
          <h1>Your moment, made fresh.</h1>
          <p>Order from your car and watch your cup come to life while we prepare it.</p>
        </div>
        {showSplash ? (
          <div className="momentCupCanvas momentCupCanvas-hero" aria-hidden="true" />
        ) : (
          <Suspense fallback={<div className="momentSceneFallback" aria-hidden="true" />}>
            <MomentCupScene status="showcase" mode="hero" />
          </Suspense>
        )}
        </section>

      <section className="driveShell">
        <div className="driveMenu">
          <div className="momentMenuHeading">
            <span>Brewed with love</span>
            <h2>Choose your moment.</h2>
            <p>Quick to browse, freshly prepared, and delivered to your car.</p>
          </div>

          <div className="driveTabs">
            {categories.map((category) => (
              <button
                className={tab === category.id ? "driveTab active" : "driveTab"}
                key={category.id}
                onClick={() => setTab(category.id)}
                type="button"
              >
                <CategoryIcon kind={category.icon} />
                {category.label}
              </button>
            ))}
          </div>

          {loading ? <div className="driveAlert">Loading menu...</div> : null}
          {error ? <div className="driveAlert error">{error}</div> : null}

          <AnimatePresence mode="wait">
            <Motion.div
              className="driveProductGrid"
              key={tab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22 }}
            >
            {active_products.map((product, index) => (
              <Motion.article
                className={`driveProduct driveProduct-${get_visual_kind(product)}`}
                key={product.product_id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.22, delay: Math.min(index * 0.035, 0.2) }}
                whileHover={{ y: -3 }}
              >
                <ProductDecoration product={product} />
                <div className="momentProductCopy">
                  <span className="momentAvailability">
                    <i /> {product.is_active === false ? "Unavailable" : "Available today"}
                  </span>
                  <h2>{product.name}</h2>
                  <p>{product_detail(product)}</p>
                </div>
                <div className="driveProductBottom">
                  <strong>{format_omr(product.price_omr)} OMR</strong>
                  <div className="momentProductActions">
                    <button
                      className="momentProductDetails"
                      onClick={() => open_product(product)}
                      type="button"
                    >
                      Details
                    </button>
                    <button
                      disabled={product.is_active === false}
                      onClick={() => add_item(product)}
                      type="button"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </Motion.article>
            ))}
            </Motion.div>
          </AnimatePresence>
        </div>

        <form className={`driveCart ${cart.length > 0 ? "has-items" : "is-empty"}`} onSubmit={submit_order}>
          <div className="driveCartHead">
            <div>
              <h2>Your order</h2>
              <p>{cart.length} selected item{cart.length === 1 ? "" : "s"}</p>
            </div>
            <strong className="driveCartCount">{cart.length}</strong>
          </div>

          <div className="driveCartItems">
            {cart.length === 0 ? (
              <div className="driveEmpty">Your cart is empty.</div>
            ) : (
              cart.map((item) => (
                <div className="driveCartItem" key={item.product_id}>
                  <div className="driveCartLine">
                    <div>
                      <strong>{item.name}</strong>
                      <span>{format_omr(item.price_omr)} OMR</span>
                    </div>
                    <div className="driveStepper">
                      <button onClick={() => change_qty(item.product_id, -1)} type="button">
                        -
                      </button>
                      <b>{item.quantity}</b>
                      <button onClick={() => change_qty(item.product_id, 1)} type="button">
                        +
                      </button>
                    </div>
                  </div>
                  <textarea
                    placeholder="Optional note for this item"
                    value={item.note}
                    onChange={(e) => set_note(item.product_id, e.target.value)}
                  />
                </div>
              ))
            )}
          </div>

          <div className="driveCheckoutBlock">
            <label className="driveField">
              <span>Car type</span>
              <input
                placeholder="White Toyota Camry, plate 1234"
                value={carType}
                onChange={(e) => setCarType(e.target.value)}
                required
              />
            </label>

            <div className="drivePay">
              <span>Payment</span>
              <div>
                <button
                  className={paymentMethod === "Cash" ? "selected" : ""}
                  onClick={() => setPaymentMethod("Cash")}
                  type="button"
                >
                  Cash
                </button>
                <button
                  className={paymentMethod === "Visa" ? "selected" : ""}
                  onClick={() => setPaymentMethod("Visa")}
                  type="button"
                >
                  Visa
                </button>
              </div>
            </div>
          </div>

          <div className="driveCartFooter">
            <div className="driveTotal">
              <span>Total</span>
              <strong>{format_omr(total)} OMR</strong>
            </div>

            <button className="drivePrimary" disabled={submitting} type="submit">
              {submitting ? "Sending..." : "Send Order"}
            </button>
          </div>
        </form>
      </section>

      <AnimatePresence>
        {selectedProduct ? (
          <Motion.div
            className="momentProductOverlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close_product}
          >
            <Motion.section
              className="momentProductSheet"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 32 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="momentSheetHandle" aria-hidden="true" />
              <ProductDecoration product={selectedProduct} detail />
              <button
                className="momentModalClose"
                aria-label="Close"
                onClick={close_product}
                type="button"
              >
                x
              </button>
              <span className="momentAvailability">
                <i /> {selectedProduct.is_active === false ? "Unavailable" : "Available today"}
              </span>
              <h2>{selectedProduct.name}</h2>
              <p>{product_detail(selectedProduct)}</p>

              <div className="momentSheetOrder">
                <div className="momentSheetPrice">
                  <span>Price</span>
                  <strong>{format_omr(selectedProduct.price_omr)} OMR</strong>
                </div>
                <div className="momentSheetQuantity" aria-label="Quantity">
                  <span>Quantity</span>
                  <div className="driveStepper">
                    <button
                      aria-label="Decrease quantity"
                      onClick={() => setDetailQuantity((value) => Math.max(1, value - 1))}
                      type="button"
                    >
                      -
                    </button>
                    <b>{detailQuantity}</b>
                    <button
                      aria-label="Increase quantity"
                      onClick={() => setDetailQuantity((value) => value + 1)}
                      type="button"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              <div className="momentSheetFooter">
                <strong>{format_omr(Number(selectedProduct.price_omr) * detailQuantity)} OMR</strong>
                <button
                  className="drivePrimary"
                  disabled={selectedProduct.is_active === false}
                  onClick={() => {
                    add_item(selectedProduct, detailQuantity);
                    close_product();
                  }}
                  type="button"
                >
                  Add {detailQuantity} to order
                </button>
              </div>
            </Motion.section>
          </Motion.div>
        ) : null}
      </AnimatePresence>
      </main>
    </>
  );
}

function CategoryIcon({ kind }) {
  if (kind === "ice") {
    return <span className="momentTabIce" aria-hidden="true" />;
  }

  if (kind === "spark") {
    return (
      <svg className="momentLineIcon" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 3l1.4 4.3L18 9l-4.6 1.7L12 15l-1.4-4.3L6 9l4.6-1.7L12 3Z" />
        <path d="M18.5 14.5l.7 2.2 2.3.8-2.3.8-.7 2.2-.7-2.2-2.3-.8 2.3-.8.7-2.2Z" />
      </svg>
    );
  }

  return (
    <svg className="momentLineIcon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 9h9v5.5A4.5 4.5 0 0 1 11.5 19h0A4.5 4.5 0 0 1 7 14.5V9Z" />
      <path d="M16 11h1.5a2.5 2.5 0 0 1 0 5H16M9 6c0-1 1-1.2 1-2.2M13 6c0-1 1-1.2 1-2.2" />
    </svg>
  );
}

function ProductDecoration({ product, detail = false }) {
  const kind = get_visual_kind(product);

  return (
    <div className={`momentCardDecor momentCardDecor-${kind}${detail ? " detail" : ""}`} aria-hidden="true">
      {kind === "ice" ? (
        <>
          <span className="momentIceCube one" />
          <span className="momentIceCube two" />
        </>
      ) : null}
      {kind === "coffee" ? (
        <svg viewBox="0 0 80 80">
          <path className="momentSteam" d="M29 31c-8-10 8-12 1-23M45 29c-7-8 7-11 2-20" />
          <path className="momentBean" d="M17 55c4-14 17-23 31-20 12 2 19 13 15 23-5 12-18 18-31 15-12-2-19-9-15-18Z" />
          <path className="momentBeanLine" d="M24 66c9-4 15-11 19-23" />
        </svg>
      ) : null}
      {kind === "tea" ? (
        <svg viewBox="0 0 80 80">
          <path d="M64 15C35 16 19 31 19 54c17 5 36-3 45-39Z" />
          <path d="M19 65c8-20 21-31 39-42" />
        </svg>
      ) : null}
      {kind === "citrus" ? (
        <svg viewBox="0 0 80 80">
          <circle cx="39" cy="41" r="24" />
          <path d="M39 17v48M15 41h48M22 24l34 34M56 24 22 58" />
          <path className="momentMint" d="M54 18c8-7 15-6 18-5-1 9-7 14-17 13" />
        </svg>
      ) : null}
      {kind === "sticker" ? (
        <span className="momentLabelSticker">Moment</span>
      ) : null}
      {product.is_best_seller || product.best_seller ? (
        <span className="momentLoveSticker">Brewed with love</span>
      ) : null}
    </div>
  );
}

function get_visual_kind(product) {
  const name = String(product?.name || "").toLowerCase();
  const displayCategory = getCustomerMenuCategory(product);
  if (name.includes("tea") || name.includes("chai")) return "tea";
  if (["lemon", "lime", "mint", "orange", "berry", "refresher"].some((word) => name.includes(word))) {
    return "citrus";
  }
  if (displayCategory === "cold") return "ice";
  if (displayCategory === "snack") return "sticker";
  return "coffee";
}

function StatusProgress({ status }) {
  const steps = [
    { id: "pending", label: "Sent" },
    { id: "working", label: "Preparing" },
    { id: "ready", label: "Ready" },
  ];
  const currentIndex = status_progress_index(status);

  return (
    <div className="driveStatusProgress" aria-label="Order progress">
      {steps.map((step, index) => {
        const state =
          index < currentIndex ? "complete" : index === currentIndex ? "active" : "waiting";
        return (
          <div className={`driveStatusStep ${state}`} key={step.id}>
            <span />
            <b>{step.label}</b>
          </div>
        );
      })}
    </div>
  );
}

function status_progress_index(status) {
  if (status === "working") return 1;
  if (status === "ready" || status === "delivered") return 2;
  if (status === "not_delivered") return -1;
  return 0;
}

function status_pill(status) {
  if (status === "pending") return "Sent to cashier";
  if (status === "working") return "Being prepared";
  if (status === "ready") return "Prepared";
  if (status === "delivered") return "Completed";
  if (status === "not_delivered") return "Not completed";
  return "Live status";
}

function status_title(status) {
  if (status === "pending") return "Order sent";
  if (status === "working") return "Being prepared";
  if (status === "ready") return "Prepared";
  if (status === "delivered") return "Delivered";
  if (status === "not_delivered") return "Not delivered";
  return "Order status";
}

function status_body(status) {
  if (status === "pending") return "Please wait while the cashier accepts your order.";
  if (status === "working") return "Your order is being prepared and will be delivered to your car.";
  if (status === "ready") return "Your order is prepared. A cashier will bring it to your car.";
  if (status === "delivered") return "Thank you. Enjoy your order.";
  if (status === "not_delivered") return "This order was not completed. Please check with the cashier or start a new order.";
  return "We will keep this page updated.";
}

function format_omr(n) {
  return Number(n || 0).toFixed(3);
}

function product_detail(product) {
  if (product?.description) return product.description;

  const kind = get_visual_kind(product);
  if (kind === "tea") return "A balanced tea blend, steeped fresh for a calm, aromatic finish.";
  if (kind === "citrus") return "Bright, refreshing, and prepared for an easy sip on the go.";
  if (kind === "ice") return "Chilled, smooth, and served over clear ice in the Moment style.";
  if (kind === "sticker") return "A fresh cafe favorite selected to pair beautifully with your drink.";
  return "Freshly brewed with a rich aroma and a smooth, comforting finish.";
}
