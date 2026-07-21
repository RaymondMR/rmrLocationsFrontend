import { create } from "zustand";
import { jwtDecode } from "jwt-decode";
import type { RoleName, JwtPayload } from "@/types/models";

function normalizeRoles(role?: string | string[]): RoleName[] {
  if (!role) return [];
  if (Array.isArray(role)) return role as RoleName[];
  return [role as RoleName];
}

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  userId: string | null;
  userName: string | null;
  roles: RoleName[];
  status: "loading" | "authenticated" | "anonymous";

  setTokens: (access: string, refresh: string) => void;
  logout: () => void;
  bootstrap: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: null,
  refreshToken: localStorage.getItem("rmr.refreshToken"),
  userId: localStorage.getItem("rmr.userId"),
  userName: null,
  roles: [],
  status: "loading",

  setTokens: (access: string, refresh: string) => {
    const decoded = jwtDecode<JwtPayload>(access);
    localStorage.setItem("rmr.refreshToken", refresh);
    localStorage.setItem("rmr.userId", decoded.sub);
    set({
      accessToken: access,
      refreshToken: refresh,
      userId: decoded.sub,
      userName: decoded.name,
      roles: normalizeRoles(decoded.role),
      status: "authenticated",
    });
  },

  logout: () => {
    localStorage.removeItem("rmr.refreshToken");
    localStorage.removeItem("rmr.userId");
    set({
      accessToken: null,
      refreshToken: null,
      userId: null,
      userName: null,
      roles: [],
      status: "anonymous",
    });
  },

  bootstrap: () => {
    const { refreshToken, userId } = get();
    if (refreshToken && userId) {
      // Will try to refresh on first API call
      set({ status: "loading" });
    } else {
      set({ status: "anonymous" });
    }
  },
}));
