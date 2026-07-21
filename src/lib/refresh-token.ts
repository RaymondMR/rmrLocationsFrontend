import api from "@/lib/axios";
import { useAuthStore } from "@/stores/auth-store";

const BASE = import.meta.env.VITE_API_URL ?? "http://localhost:5113";

export async function refreshAccessToken(): Promise<string | null> {
  const { userId, refreshToken, setTokens, logout } = useAuthStore.getState();
  if (!userId || !refreshToken) {
    logout();
    return null;
  }
  try {
    const { data } = await api.post("/api/auth/refresh-token", {
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

export { BASE };
