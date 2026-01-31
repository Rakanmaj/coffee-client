import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000",
});

// Attach auth header like your style: x-user-id
api.interceptors.request.use((config) => {
  const raw = localStorage.getItem("user");
  if (raw) {
    const user = JSON.parse(raw);
    if (user?.user_id) {
      config.headers["x-user-id"] = String(user.user_id);
    }
  }
  return config;
});

export default api;
