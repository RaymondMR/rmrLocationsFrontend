import axios from "axios";
import { useAuthStore } from "@/stores/auth-store";

const BASE = import.meta.env.VITE_API_URL ?? "http://localhost:5113";
const api = axios.create({ baseURL: BASE, headers: { "Content-Type": "application/json" } });

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshing: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const { userId, refreshToken, setTokens, logout } = useAuthStore.getState();
  if (!userId || !refreshToken) return null;
  try {
    const { data } = await axios.post(`${BASE}/api/auth/refresh-token`, {
      userId,
      refreshToken,
    });
    setTokens(data.accessToken, data.refreshToken);
    return data.accessToken;
  } catch {
    logout();
    return null;
  }
}

api.interceptors.response.use(
  (r) => r,
  async (error) => {
    const original = error.config;
    if (
      error.response?.status === 401 &&
      !original._retry &&
      !original.url?.includes("/api/auth/")
    ) {
      original._retry = true;
      refreshing ??= refreshAccessToken().finally(() => {
        refreshing = null;
      });
      const newToken = await refreshing;
      if (newToken) {
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
export { BASE };
