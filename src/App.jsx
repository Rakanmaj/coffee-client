import React, { lazy, Suspense } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AppProvider } from "./context/AppContext";
import { DriveThroughProvider } from "./context/DriveThroughContext";
import RequireAuth from "./components/RequireAuth";
import Navbar from "./components/Navbar";

const Analytics = lazy(() => import("./pages/Analytics/Analytics"));
const Auth = lazy(() => import("./pages/Auth/Auth"));
const Menu = lazy(() => import("./pages/Menu/Menu"));
const Cart = lazy(() => import("./pages/Cart/Cart"));
const Checkout = lazy(() => import("./pages/Checkout/Checkout"));
const Reports = lazy(() => import("./pages/Reports/Reports"));
const ManageMenu = lazy(() => import("./pages/ManageMenu/ManageMenu"));
const Storage = lazy(() => import("./pages/Storage/Storage"));
const DriveThru = lazy(() => import("./pages/DriveThru/DriveThru"));
const DriveThroughOrders = lazy(() => import("./pages/DriveThroughOrders/DriveThroughOrders"));
const MomentLanding = lazy(() => import("./pages/MomentLanding/MomentLanding"));

export default function App() {
  const location = useLocation();
  const driveThroughEnabled = import.meta.env.VITE_ENABLE_DRIVE_THROUGH === "true";
  const normalized_path = location.pathname.replace(/\/+$/, "");
  const is_drive_customer =
    driveThroughEnabled &&
    (normalized_path === "/drive-thru" ||
      normalized_path.startsWith("/drive-thru/") ||
      normalized_path === "/drive-through" ||
      normalized_path.startsWith("/drive-through/"));
  const is_moment_landing = normalized_path === "/moment";

  return (
    <AppProvider>
      <DriveThroughProvider enabled={driveThroughEnabled && !is_drive_customer && !is_moment_landing}>
        {!is_drive_customer && !is_moment_landing ? <Navbar /> : null}
        <Suspense fallback={null}>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/moment" element={<MomentLanding />} />
          {driveThroughEnabled ? <Route path="/drive-thru/*" element={<DriveThru />} /> : null}
          {driveThroughEnabled ? <Route path="/drive-through/*" element={<DriveThru />} /> : null}

          <Route
            path="/"
            element={<Navigate to="/menu" replace />}
          />

        <Route
          path="/menu"
          element={
            <RequireAuth>
              <Menu />
            </RequireAuth>
          }
        />

        <Route
          path="/cart"
          element={
            <RequireAuth>
              <Cart />
            </RequireAuth>
          }
        />

        <Route
          path="/checkout"
          element={
            <RequireAuth>
              <Checkout />
            </RequireAuth>
          }
        />

        <Route
          path="/reports"
          element={
            <RequireAuth>
              <Reports />
            </RequireAuth>
          }
        />

        <Route
          path="/manage-menu"
          element={
            <RequireAuth>
              <ManageMenu />
            </RequireAuth>
          }
        />

        <Route
          path="/storage"
          element={
            <RequireAuth>
              <Storage />
            </RequireAuth>
          }
        />

        {driveThroughEnabled ? (
          <Route
            path="/drive-through-orders"
            element={
              <RequireAuth>
                <DriveThroughOrders />
              </RequireAuth>
            }
          />
        ) : null}

        <Route
  path="/analytics"
  element={
    <RequireAuth>
      <Analytics />
    </RequireAuth>
  }
/>

          <Route path="*" element={<Navigate to="/menu" replace />} />
        </Routes>
        </Suspense>
      </DriveThroughProvider>
    </AppProvider>
  );
}
