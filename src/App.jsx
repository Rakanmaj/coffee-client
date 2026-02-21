import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AppProvider } from "./context/AppContext";
import RequireAuth from "./components/RequireAuth";
import Navbar from "./components/Navbar";
import Analytics from "./pages/Analytics/Analytics";
import Auth from "./pages/Auth/Auth";
import Menu from "./pages/Menu/Menu";
import Cart from "./pages/Cart/Cart";
import Checkout from "./pages/Checkout/Checkout";
import Reports from "./pages/Reports/Reports";
import ManageMenu from "./pages/ManageMenu/ManageMenu";
import Storage from "./pages/Storage/Storage";

export default function App() {
  return (
    <AppProvider>
      <Navbar />
      <Routes>
        <Route path="/auth" element={<Auth />} />

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
    </AppProvider>
  );
}
