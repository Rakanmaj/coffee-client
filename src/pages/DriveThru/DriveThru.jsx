import React, { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion as Motion, useReducedMotion } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../../api/api";
import { playCustomerTone, playReadyTone, unlockAudio } from "../../utils/sounds";
import { getCustomerMenuCategory } from "../../utils/displayCategory";
import CategoryTransitionOverlay from "../../components/CategoryTransitionOverlay";
import DriveLanguageSwitch from "../../components/DriveLanguageSwitch";
import DriveThroughAvailabilityState from "../../components/DriveThroughAvailabilityState";
import MomentSplash from "../../components/MomentSplash";
import {
  DriveThroughLanguageProvider,
} from "../../context/DriveThroughLanguageContext";
import { useDriveThroughLanguage } from "../../context/driveThroughLanguage";
import "./DriveThru.css";

const loadMomentCupScene = () => import("../../components/MomentCupScene");
const MomentCupScene = lazy(loadMomentCupScene);

const categories = [
  { id: "hot", labelKey: "hot", icon: "coffee" },
  { id: "cold", labelKey: "cold", icon: "ice" },
  { id: "snack", labelKey: "snacks", icon: "spark" },
];

const product_grid_variants = {
  hidden: { opacity: 0, y: 12, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.22, staggerChildren: 0.06, delayChildren: 0.02 },
  },
  exit: { opacity: 0, y: -7, scale: 0.99, transition: { duration: 0.12 } },
};

const product_card_variants = {
  hidden: { opacity: 0, y: 12, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.22 } },
};

const reduced_grid_variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.08 } },
  exit: { opacity: 0, transition: { duration: 0.06 } },
};

const reduced_card_variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.08 } },
};

function read_session_cart() {
  try {
    const saved_cart = JSON.parse(sessionStorage.getItem("momentDriveCart") || "[]");
    return Array.isArray(saved_cart) ? saved_cart : [];
  } catch {
    return [];
  }
}

export default function DriveThru() {
  return (
    <DriveThroughLanguageProvider>
      <DriveThruContent />
    </DriveThroughLanguageProvider>
  );
}

function DriveThruContent() {
  const location = useLocation();
  const navigate = useNavigate();
  const { language, direction, t } = useDriveThroughLanguage();
  const [products, setProducts] = useState([]);
  const [tab, setTab] = useState("hot");
  const [cart, setCart] = useState(read_session_cart);
  const [carType, setCarType] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [order, setOrder] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [detailQuantity, setDetailQuantity] = useState(1);
  const [showSplash, setShowSplash] = useState(true);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [availabilityState, setAvailabilityState] = useState("loading");
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [transitionCategory, setTransitionCategory] = useState(null);
  const categoryTimers = useRef([]);
  const reducedMotion = useReducedMotion();
  const normalized_path = location.pathname.replace(/\/+$/, "");
  const drive_base_path = normalized_path.startsWith("/drive-through")
    ? "/drive-through"
    : "/drive-thru";
  const is_checkout_page = normalized_path === `${drive_base_path}/checkout`;

  useEffect(() => {
    let mounted = true;

    async function load_customer_page() {
      setLoading(true);
      setError("");
      setAvailabilityState("loading");

      try {
        const availability = await api.get("/api/drive-through/availability");
        if (!availability.data.enabled) {
          if (mounted) {
            setAvailabilityState("disabled");
            setLoading(false);
          }
          return;
        }

        if (mounted) setAvailabilityState("enabled");
      } catch {
        if (mounted) {
          setAvailabilityState("error");
          setLoading(false);
        }
        return;
      }

      try {
        const res = await api.get("/api/drive-through/menu");
        if (mounted) setProducts(res.data.products || []);
      } catch {
        if (mounted) setError("menuLoadFailed");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load_customer_page();

    return () => {
      mounted = false;
    };
  }, [loadAttempt]);

  useEffect(() => {
    restore_order();
  }, []);

  useEffect(() => () => {
    categoryTimers.current.forEach((timer) => window.clearTimeout(timer));
  }, []);

  useEffect(() => {
    sessionStorage.setItem("momentDriveCart", JSON.stringify(cart));
  }, [cart]);

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
    let audio_unlocked = false;

    const prime_audio = async () => {
      if (audio_unlocked) return;
      audio_unlocked = await unlockAudio();
    };

    const options = { capture: true, passive: true };
    window.addEventListener("pointerdown", prime_audio, options);
    window.addEventListener("touchstart", prime_audio, options);
    window.addEventListener("touchend", prime_audio, options);
    window.addEventListener("keydown", prime_audio, options);
    window.addEventListener("click", prime_audio, options);

    return () => {
      window.removeEventListener("pointerdown", prime_audio, options);
      window.removeEventListener("touchstart", prime_audio, options);
      window.removeEventListener("touchend", prime_audio, options);
      window.removeEventListener("keydown", prime_audio, options);
      window.removeEventListener("click", prime_audio, options);
    };
  }, []);

  useEffect(() => {
    if (!order?.id) return;

    let socket;
    let cancelled = false;
    let last_status = order.status;
    let join_room = () => {};

    const update = ({ order: next_order }) => {
      if (!next_order) return;
      setOrder((prev) => {
        const previous_status = prev?.status || last_status;

        if (previous_status === "pending" && next_order.status === "working") {
          playCustomerTone();
        }

        if (previous_status !== "ready" && next_order.status === "ready") {
          playReadyTone();
        }

        last_status = next_order.status;
        return next_order;
      });
    };

    const refresh_order = async () => {
      try {
        const res = await api.get(`/api/drive-through/orders/${order.id}`);
        if (!cancelled) update({ order: res.data.order });
      } catch (err) {
        if (err.response?.status === 404 && !["delivered", "not_delivered"].includes(last_status)) {
          localStorage.removeItem("driveThroughOrderId");
          if (!cancelled) setOrder(null);
        }
      }
    };

    const refresh_when_visible = () => {
      if (document.visibilityState !== "hidden") refresh_order();
    };

    async function connect_socket() {
      const { getSocket } = await import("../../api/socket");
      if (cancelled) return;

      socket = getSocket();
      join_room = () => socket.emit("drive-through:join", { orderId: order.id });
      join_room();
      socket.on("connect", join_room);
      socket.on("connect_error", refresh_order);
      socket.on("order-updated", update);
      socket.on("order-accepted", update);
      socket.on("order-ready", update);
      socket.on("order-delivered", update);
      socket.on("order-not-delivered", update);
    }

    connect_socket();
    const poll = window.setInterval(refresh_order, 3500);
    window.addEventListener("focus", refresh_order);
    document.addEventListener("visibilitychange", refresh_when_visible);

    return () => {
      cancelled = true;
      window.clearInterval(poll);
      window.removeEventListener("focus", refresh_order);
      document.removeEventListener("visibilitychange", refresh_when_visible);
      socket?.off("connect", join_room);
      socket?.off("connect_error", refresh_order);
      socket?.off("order-updated", update);
      socket?.off("order-accepted", update);
      socket?.off("order-ready", update);
      socket?.off("order-delivered", update);
      socket?.off("order-not-delivered", update);
    };
  }, [order?.id, order?.status]);

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

  function change_category(next_category) {
    if (next_category === (transitionCategory || tab)) return;

    categoryTimers.current.forEach((timer) => window.clearTimeout(timer));
    setTransitionCategory(next_category);

    const switch_delay = reducedMotion ? 40 : 600;
    const finish_delay = reducedMotion ? 120 : 740;

    categoryTimers.current = [
      window.setTimeout(() => setTab(next_category), switch_delay),
      window.setTimeout(() => {
        setTransitionCategory(null);
        categoryTimers.current = [];
      }, finish_delay),
    ];
  }

  const total = useMemo(() => {
    const sum = cart.reduce(
      (acc, item) => acc + Number(item.price_omr) * Number(item.quantity),
      0
    );
    return Math.round(sum * 1000) / 1000;
  }, [cart]);

  const cart_item_count = useMemo(
    () => cart.reduce((sum, item) => sum + Number(item.quantity), 0),
    [cart]
  );

  function add_item(product, quantity = 1, source_element = null) {
    unlockAudio();
    const amount = Math.max(1, Number(quantity) || 1);

    animate_product_to_cart(source_element, product);

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

  function animate_product_to_cart(source_element, product) {
    if (!source_element || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const source_rect = source_element.getBoundingClientRect();
    const cart = document.querySelector(".driveCart");
    const cart_target = document.querySelector(".momentStickyCheckout")
      || cart?.querySelector(".driveCartCount")
      || cart;
    const target_rect = cart_target?.getBoundingClientRect();
    const target_is_visible = Boolean(
      target_rect && target_rect.top < window.innerHeight && target_rect.bottom > 0
    );
    const start_x = source_rect.left + source_rect.width / 2;
    const start_y = source_rect.top + source_rect.height / 2;
    const target_x = target_is_visible
      ? target_rect.left + target_rect.width / 2
      : Math.min(window.innerWidth - 34, start_x + 90);
    const target_y = target_is_visible
      ? target_rect.top + target_rect.height / 2
      : window.innerHeight - 24;
    const delta_x = target_x - start_x;
    const delta_y = target_y - start_y;

    const drop = document.createElement("div");
    const plus = document.createElement("span");
    const label = document.createElement("b");
    drop.className = "momentCartDrop";
    drop.setAttribute("aria-hidden", "true");
    drop.style.left = `${start_x}px`;
    drop.style.top = `${start_y}px`;
    plus.textContent = "+";
    label.textContent = product.name;
    drop.append(plus, label);
    document.body.appendChild(drop);

    const product_card = source_element.closest(".driveProduct");
    product_card?.classList.remove("momentProductPop");
    void product_card?.offsetWidth;
    product_card?.classList.add("momentProductPop");

    const flight = drop.animate(
      [
        {
          opacity: 0,
          transform: "translate(-50%, -50%) translate(0, 0) scale(0.62)",
        },
        {
          opacity: 1,
          transform: "translate(-50%, -50%) translate(0, -24px) scale(1.06) rotate(-2deg)",
          offset: 0.2,
        },
        {
          opacity: 0.96,
          transform: `translate(-50%, -50%) translate(${delta_x * 0.45}px, ${
            delta_y * 0.35 - 34
          }px) scale(0.84) rotate(3deg)`,
          offset: 0.55,
        },
        {
          opacity: 0.08,
          transform: `translate(-50%, -50%) translate(${delta_x}px, ${delta_y}px) scale(0.28) rotate(7deg)`,
        },
      ],
      {
        duration: 720,
        easing: "cubic-bezier(0.22, 0.76, 0.24, 1)",
        fill: "forwards",
      }
    );

    flight.finished
      .catch(() => {})
      .finally(() => {
        drop.remove();
        product_card?.classList.remove("momentProductPop");
        const landing_target = document.querySelector(".momentStickyCheckout") || cart;
        landing_target?.classList.remove("momentCartLanding");
        if (landing_target) void landing_target.offsetWidth;
        landing_target?.classList.add("momentCartLanding");
        window.setTimeout(() => landing_target?.classList.remove("momentCartLanding"), 460);
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
      setError("chooseItem");
      return;
    }

    if (!carType.trim()) {
      setError("carRequired");
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
      if (err.response?.status === 503) {
        setAvailabilityState("disabled");
        setError("serviceClosedDuringOrder");
        navigate(drive_base_path);
      } else {
        setError("orderFailed");
      }
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

  function open_checkout() {
    if (cart.length === 0) return;
    navigate(`${drive_base_path}/checkout`);
    window.requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "auto" }));
  }

  function return_to_menu() {
    navigate(drive_base_path);
    window.requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "auto" }));
  }

  function render_checkout_form() {
    return (
      <form className="driveCart driveCheckoutPageForm has-items" onSubmit={submit_order}>
        <div className="driveCartHead">
          <div>
            <h2>{t("placeOrder")}</h2>
            <p>{cart_item_count} {t(cart_item_count === 1 ? "item" : "items")} {t("selected")}</p>
          </div>
          <strong className="driveCartCount">{cart_item_count}</strong>
        </div>

        {error ? <div className="driveAlert error">{t(error)}</div> : null}

        <div className="driveCartItems">
          {cart.map((item) => (
            <div className="driveCartItem" key={item.product_id}>
              <div className="driveCartLine">
                <div>
                  <strong className="momentProductName" dir="ltr">{item.name}</strong>
                  <span className="momentPrice" dir="ltr">{format_omr(item.price_omr)} OMR</span>
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
                dir="auto"
                placeholder={t("optionalNote")}
                value={item.note}
                onChange={(e) => set_note(item.product_id, e.target.value)}
              />
            </div>
          ))}
        </div>

        <div className="driveCheckoutBlock">
          <label className="driveField">
            <span>{t("carType")}</span>
            <input
              dir="auto"
              placeholder={t("carPlaceholder")}
              value={carType}
              onChange={(e) => setCarType(e.target.value)}
              required
            />
          </label>

          <div className="drivePay">
            <span>{t("payment")}</span>
            <div>
              <button
                className={paymentMethod === "Cash" ? "selected" : ""}
                onClick={() => setPaymentMethod("Cash")}
                type="button"
              >
                {t("cash")}
              </button>
              <button
                className={paymentMethod === "Visa" ? "selected" : ""}
                onClick={() => setPaymentMethod("Visa")}
                type="button"
              >
                {t("visa")}
              </button>
            </div>
          </div>
        </div>

        <div className="driveCartFooter">
          <div className="driveTotal">
            <span>{t("total")}</span>
            <strong className="momentPrice" dir="ltr">{format_omr(total)} OMR</strong>
          </div>

          <button className="drivePrimary" disabled={submitting} type="submit">
            {submitting ? t("sending") : t("placeOrderButton")}
          </button>
        </div>
      </form>
    );
  }

  if (order) {
    const orderItemCount = order.items.reduce((sum, item) => sum + Number(item.quantity), 0);

    return (
      <>
        <AnimatePresence>{showSplash ? <MomentSplash key="moment-splash" /> : null}</AnimatePresence>
        <main className="drivePage" lang={language} dir={direction}>
          <section className={`driveStatus status-${order.status}`}>
            <div className="driveStatusStage">
              <div className="momentStatusTopbar">
                <div className="driveBrandMark">{t("brand")}</div>
                <DriveLanguageSwitch />
              </div>
              {showSplash ? (
                <div className="momentCupCanvas momentCupCanvas-status" aria-hidden="true" />
              ) : (
                <Suspense fallback={<div className="momentSceneFallback status" aria-hidden="true" />}>
                  <MomentCupScene status={order.status} mode="status" />
                </Suspense>
              )}
              <div className="driveStatusCopy">
                <span className="driveStatusPill">{status_pill(order.status, t)}</span>
                <h1>{status_title(order.status, t)}</h1>
                <p>{status_body(order.status, t)}</p>
              </div>
              <StatusProgress status={order.status} t={t} />
            </div>

            <div className="driveStatusDetails">
              <div className="driveReceipt">
                <div>
                  <span>{t("order")}</span>
                  <strong>{order.order_id ? `#${order.order_id}` : order.id.slice(0, 8)}</strong>
                </div>
                <div>
                  <span>{t("car")}</span>
                  <strong dir="auto">{order.car_type}</strong>
                </div>
                <div>
                  <span>{t("payment")}</span>
                  <strong>{payment_label(order.payment_method, t)}</strong>
                </div>
                <div>
                  <span>{t("total")}</span>
                  <strong className="momentPrice" dir="ltr">{format_omr(order.total_amount_omr)} OMR</strong>
                </div>
              </div>

              <div className="driveOrderItems">
                <div className="driveOrderItemsHeader">
                  <span>{t("orderItems")}</span>
                  <strong>{orderItemCount}</strong>
                </div>
                {order.items.map((item) => (
                  <div className="driveOrderItem" key={item.product_id}>
                    <div>
                      <strong className="momentProductName" dir="ltr">{item.name}</strong>
                      {item.note ? <span dir="auto">{item.note}</span> : null}
                    </div>
                    <b>x{item.quantity}</b>
                  </div>
                ))}
              </div>
            </div>

            {["delivered", "not_delivered"].includes(order.status) ? (
              <button className="drivePrimary" onClick={start_new_order} type="button">
                {t("startNewOrder")}
              </button>
            ) : null}
          </section>
        </main>
      </>
    );
  }

  if (availabilityState !== "enabled") {
    return (
      <DriveThroughAvailabilityState
        state={availabilityState}
        onRetry={() => setLoadAttempt((attempt) => attempt + 1)}
      />
    );
  }

  if (is_checkout_page) {
    return (
      <>
        <AnimatePresence>{showSplash ? <MomentSplash key="moment-splash" /> : null}</AnimatePresence>
        <main className="drivePage driveCheckoutPage" lang={language} dir={direction}>
          <header className="momentCheckoutHeader">
            <button className="momentCheckoutBack" onClick={return_to_menu} type="button">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M19 12H6" />
                <path d="m10 7-5 5 5 5" />
              </svg>
              {t("backToMenu")}
            </button>
            <div className="momentCustomerTopline">
              <div className="momentMenuEyebrow">
                <span aria-hidden="true" />
                {t("brand")}
              </div>
              <DriveLanguageSwitch />
            </div>
            <h1>{t("reviewTitle")}</h1>
            <p>{t("reviewSubtitle")}</p>
          </header>

          {cart.length > 0 ? (
            render_checkout_form()
          ) : (
            <div className="momentEmptyCheckout">
              <h2>{t("emptyOrderTitle")}</h2>
              <p>{t("emptyOrderBody")}</p>
              <button className="drivePrimary" onClick={return_to_menu} type="button">
                {t("browseMenu")}
              </button>
            </div>
          )}
        </main>
      </>
    );
  }

  return (
    <>
      <AnimatePresence>{showSplash ? <MomentSplash key="moment-splash" /> : null}</AnimatePresence>
      <main
        className={`drivePage ${cart.length > 0 ? "hasCheckoutBar" : ""}`}
        lang={language}
        dir={direction}
      >
      <header className="momentMenuHeader" id="moment-menu">
        <div className="momentCustomerTopline">
          <div className="momentMenuEyebrow">
            <span aria-hidden="true" />
            {t("brand")}
          </div>
          <DriveLanguageSwitch />
        </div>
        <h1>{t("menuTitle")}</h1>
        <p>{t("menuSubtitle")}</p>
      </header>

      <section className="driveShell">
        <div className="driveMenu">
          <div className="driveTabs" id="moment-categories">
            {categories.map((category) => (
              <button
                aria-pressed={(transitionCategory || tab) === category.id}
                className={(transitionCategory || tab) === category.id ? "driveTab active" : "driveTab"}
                key={category.id}
                onClick={() => change_category(category.id)}
                type="button"
              >
                <CategoryIcon kind={category.icon} />
                {t(category.labelKey)}
              </button>
            ))}
          </div>

          {loading ? <div className="driveAlert">{t("loadingMenu")}</div> : null}
          {error ? (
            <div className="driveAlert error">
              <span>{t(error)}</span>
              {error === "menuLoadFailed" ? (
                <button onClick={() => setLoadAttempt((attempt) => attempt + 1)} type="button">
                  {t("retry")}
                </button>
              ) : null}
            </div>
          ) : null}

          <div className="momentCategoryStage" aria-busy={Boolean(transitionCategory)}>
            <CategoryTransitionOverlay
              category={transitionCategory || tab}
              isVisible={Boolean(transitionCategory)}
            />
            <Motion.div
              className="momentCategoryProducts"
              animate={transitionCategory
                ? reducedMotion
                  ? { opacity: 0.45 }
                  : { opacity: 0.24, filter: "blur(3px)", scale: 0.99 }
                : { opacity: 1, filter: "blur(0px)", scale: 1 }}
              transition={{ duration: reducedMotion ? 0.08 : 0.16 }}
            >
              <AnimatePresence mode="wait">
                <Motion.div
                  className="driveProductGrid"
                  key={tab}
                  variants={reducedMotion ? reduced_grid_variants : product_grid_variants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  {active_products.map((product) => (
                    <Motion.article
                      className={`driveProduct driveProduct-${get_visual_kind(product)}`}
                      key={product.product_id}
                      variants={reducedMotion ? reduced_card_variants : product_card_variants}
                      whileHover={reducedMotion ? undefined : { y: -3 }}
                    >
                      <ProductDecoration product={product} />
                      <div className="momentProductCopy">
                        {product.is_active === false ? (
                          <span className="momentUnavailable">{t("unavailable")}</span>
                        ) : null}
                        <h2 className="momentProductName" dir="ltr">{product.name}</h2>
                        <p>{product_detail(product, t, language)}</p>
                      </div>
                      <div className="driveProductBottom">
                        <strong className="momentPrice" dir="ltr">{format_omr(product.price_omr)} OMR</strong>
                        <div className="momentProductActions">
                          <button
                            disabled={product.is_active === false}
                            onClick={() => open_product(product)}
                            type="button"
                          >
                            {t("add")}
                          </button>
                        </div>
                      </div>
                  </Motion.article>
                  ))}
                </Motion.div>
              </AnimatePresence>
            </Motion.div>
          </div>
        </div>

      </section>

      <AnimatePresence>
        {cart.length > 0 ? (
          <Motion.button
            className="momentStickyCheckout"
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ duration: reducedMotion ? 0.08 : 0.2 }}
            onClick={open_checkout}
            type="button"
          >
            <span>
              {t("checkout")}
              <small>{cart_item_count} {t(cart_item_count === 1 ? "item" : "items")}</small>
            </span>
            <strong className="momentPrice" dir="ltr">{format_omr(total)} OMR</strong>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M5 12h13" />
              <path d="m14 7 5 5-5 5" />
            </svg>
          </Motion.button>
        ) : null}
      </AnimatePresence>

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
                aria-label={t("close")}
                onClick={close_product}
                type="button"
              >
                x
              </button>
              {selectedProduct.is_active === false ? (
                <span className="momentUnavailable">{t("unavailable")}</span>
              ) : null}
              <h2 className="momentProductName" dir="ltr">{selectedProduct.name}</h2>
              <p>{product_detail(selectedProduct, t, language)}</p>

              <div className="momentSheetOrder">
                <div className="momentSheetPrice">
                  <span>{t("price")}</span>
                  <strong className="momentPrice" dir="ltr">{format_omr(selectedProduct.price_omr)} OMR</strong>
                </div>
                <div className="momentSheetQuantity" aria-label={t("quantity")}>
                  <span>{t("quantity")}</span>
                  <div className="driveStepper">
                    <button
                      aria-label={t("decreaseQuantity")}
                      onClick={() => setDetailQuantity((value) => Math.max(1, value - 1))}
                      type="button"
                    >
                      -
                    </button>
                    <b>{detailQuantity}</b>
                    <button
                      aria-label={t("increaseQuantity")}
                      onClick={() => setDetailQuantity((value) => value + 1)}
                      type="button"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              <div className="momentSheetFooter">
                <strong className="momentPrice" dir="ltr">{format_omr(Number(selectedProduct.price_omr) * detailQuantity)} OMR</strong>
                <button
                  className="drivePrimary"
                  disabled={selectedProduct.is_active === false}
                  onClick={(event) => {
                    add_item(selectedProduct, detailQuantity, event.currentTarget);
                    close_product();
                  }}
                  type="button"
                >
                  {t("addToOrder", { count: detailQuantity })}
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
  const { t } = useDriveThroughLanguage();
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
        <span className="momentLoveSticker">{t("brewedWithLove")}</span>
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

function StatusProgress({ status, t }) {
  const steps = [
    { id: "pending", label: t("sent") },
    { id: "working", label: t("preparing") },
    { id: "ready", label: t("ready") },
  ];
  const currentIndex = status_progress_index(status);

  return (
    <div className="driveStatusProgress" aria-label={t("orderProgress")}>
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

function status_pill(status, t) {
  if (status === "pending") return t("sent");
  if (status === "working") return t("preparing");
  if (status === "ready") return t("ready");
  if (status === "delivered") return t("delivered");
  if (status === "not_delivered") return t("notDelivered");
  return t("orderProgress");
}

function status_title(status, t) {
  if (status === "pending") return t("statusPendingTitle");
  if (status === "working") return t("statusWorkingTitle");
  if (status === "ready") return t("statusReadyTitle");
  if (status === "delivered") return t("statusDeliveredTitle");
  if (status === "not_delivered") return t("statusNotDeliveredTitle");
  return t("orderProgress");
}

function status_body(status, t) {
  if (status === "pending") return t("statusPendingBody");
  if (status === "working") return t("statusWorkingBody");
  if (status === "ready") return t("statusReadyBody");
  if (status === "delivered") return t("statusDeliveredBody");
  if (status === "not_delivered") return t("statusNotDeliveredBody");
  return t("statusFallbackBody");
}

function format_omr(n) {
  return Number(n || 0).toFixed(3);
}

function payment_label(payment_method, t) {
  return payment_method === "Cash" ? t("cash") : t("visa");
}

function product_detail(product, t, language) {
  const description = String(product?.description || "").trim();
  if (description && (language !== "ar" || /[\u0600-\u06FF]/.test(description))) {
    return description;
  }

  const kind = get_visual_kind(product);
  if (kind === "tea") return t("detailTea");
  if (kind === "citrus") return t("detailCitrus");
  if (kind === "ice") return t("detailIce");
  if (kind === "sticker") return t("detailSnack");
  return t("detailCoffee");
}
