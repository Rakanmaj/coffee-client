import React from "react";
import { Navigate } from "react-router-dom";
import { useApp } from "../context/AppContext";

export default function RequireAuth({ children }) {
  const { user, authReady } = useApp();

  if (!authReady) {
    return <div className="container page">Checking session...</div>;
  }

  if (!user?.user_id) {
    return <Navigate to="/auth" replace />;
  }

  return children;
}
