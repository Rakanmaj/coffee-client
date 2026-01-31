import React, { useEffect, useState } from "react";
import api from "../../api/api";
import { useApp } from "../../context/AppContext";
import { useNavigate } from "react-router-dom";

export default function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { login, user } = useApp();
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.user_id) navigate("/menu", { replace: true });
  }, [user, navigate]);

  const handle_submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await api.post("/api/auth/login", { email, password });
      login(res.data.user);
      navigate("/menu", { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container page">
      <div className="panel" style={{ maxWidth: 520, margin: "0 auto" }}>
        <div className="cardPad">
          <div className="pageTitle" style={{ marginTop: 0 }}>
            Cashier Login
          </div>
          <div className="subTitle">Sign in to start taking orders.</div>

          {error ? <div className="alert alertError">{error}</div> : null}

          <form onSubmit={handle_submit}>
            <div className="field">
              <div className="label">Email</div>
              <input
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="cashier@coffee.com"
                type="email"
                required
              />
            </div>

            <div className="field">
              <div className="label">Password</div>
              <input
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                type="password"
                required
              />
            </div>

            <button className="btn btnPrimary" disabled={loading} type="submit">
              {loading ? "Logging in..." : "Login"}
            </button>

            <div className="subTitle" style={{ marginTop: 14 }}>
              (Seeded cashier will work once backend is ready)
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
