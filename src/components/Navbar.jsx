import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";

export default function Navbar() {
  const { user, cart, logout } = useApp();
  const navigate = useNavigate();

  const cart_count = cart.reduce(
    (acc, x) => acc + Number(x.quantity),
    0
  );

  const handle_logout = () => {
    logout();
    navigate("/auth");
  };

  return (
    <div className="topbar">
      <div className="container topbarInner">
        
        {/* Brand */}
        <div className="brand" onClick={() => navigate("/menu")}>
          <div className="brandBadge"></div>
          Coffee POS
        </div>

        {/* Links */}
        {user?.user_id ? (
          <div className="navLinks">
            <NavLink
              to="/menu"
              className={({ isActive }) =>
                isActive ? "navLink navLinkActive" : "navLink"
              }
            >
              Menu
            </NavLink>

            <NavLink
              to="/cart"
              className={({ isActive }) =>
                isActive ? "navLink navLinkActive" : "navLink"
              }
            >
              Cart{" "}
              <span className="badge">{cart_count}</span>
            </NavLink>

            <NavLink
              to="/checkout"
              className={({ isActive }) =>
                isActive ? "navLink navLinkActive" : "navLink"
              }
            >
              Checkout
            </NavLink>

            <NavLink
              to="/reports"
              className={({ isActive }) =>
                isActive ? "navLink navLinkActive" : "navLink"
              }
            >
              Reports
            </NavLink>

            <NavLink
              to="/manage-menu"
              className={({ isActive }) =>
                isActive ? "navLink navLinkActive" : "navLink"
              }
            >
              Manage Menu
            </NavLink>

            <NavLink
              to="/storage"
              className={({ isActive }) =>
                isActive ? "navLink navLinkActive" : "navLink"
              }
            >
              Storage
            </NavLink>

            <NavLink
  to="/analytics"
  className={({ isActive }) => (isActive ? "navLink navLinkActive" : "navLink")}
>
  Analytics
</NavLink>

            <button className="btn btnGhost" onClick={handle_logout}>
              Logout
            </button>
          </div>
        ) : (
          <div className="navLinks">
            <NavLink to="/auth" className="navLink">
              Login
            </NavLink>
          </div>
        )}
      </div>
    </div>
  );
}
