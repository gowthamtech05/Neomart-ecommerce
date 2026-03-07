import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

// FIX: iOS Safari (ITP) aggressively blocks third-party cookies.
// As a fallback, read token from localStorage and send as Authorization header.
// Your backend middleware must accept EITHER cookie OR Authorization header.
API.interceptors.request.use((config) => {
  try {
    const userInfo = localStorage.getItem("userInfo");
    if (userInfo) {
      const parsed = JSON.parse(userInfo);
      if (parsed?.token) {
        config.headers["Authorization"] = `Bearer ${parsed.token}`;
      }
    }
  } catch {
    // localStorage not available — cookie-only fallback
  }
  return config;
});

export default API;
