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
  bootstrap: () => Promise<void>;
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

  // Resuelve el estado inicial "loading". DEBE llamarse una vez al arrancar la app
  // (ver main.tsx): mientras status siga en "loading", LoginPage y RegisterPage
  // muestran un esqueleto y no llegan a pintar sus formularios.
  //
  // La versión anterior dejaba status en "loading" cuando había sesión guardada,
  // confiando en que "se refrescaría en la primera llamada a la API". Nada disparaba
  // ese refresco, así que el estado no salía nunca de ahí.
  bootstrap: async () => {
    const { refreshToken, userId } = get();

    if (!refreshToken || !userId) {
      set({ status: "anonymous" });
      return;
    }

    // Import dinámico para romper el ciclo auth-store → refresh-token → axios →
    // auth-store. Al diferirse hasta la llamada, los módulos ya están inicializados.
    const { refreshAccessToken } = await import("@/lib/refresh-token");

    // Siempre termina en un estado terminal: setTokens() deja "authenticated",
    // logout() deja "anonymous". No hace falta tocar status aquí.
    await refreshAccessToken();
  },
}));
