import { useMutation } from "@tanstack/react-query";
import api from "@/lib/axios";
import { useAuthStore } from "@/stores/auth-store";
import { toast } from "sonner";
import type { TokenResponse, RegisteredUser } from "@/types/models";

export function useLogin() {
  const setTokens = useAuthStore((s) => s.setTokens);
  return useMutation({
    mutationFn: async (creds: { userName: string; password: string }) => {
      const { data } = await api.post<TokenResponse>("/api/auth/login", {
        userName: creds.userName,
        email: "",
        password: creds.password,
      });
      return data;
    },
    onSuccess: (data) => {
      setTokens(data.accessToken, data.refreshToken);
      toast.success("¡Bienvenido!");
    },
  });
}

export function useRegister() {
  const setTokens = useAuthStore((s) => s.setTokens);
  return useMutation({
    mutationFn: async (creds: { userName: string; email: string; password: string }) => {
      await api.post<RegisteredUser>("/api/auth/register", creds);
      // Auto-login after register
      const { data } = await api.post<TokenResponse>("/api/auth/login", {
        userName: creds.userName,
        email: "",
        password: creds.password,
      });
      return data;
    },
    onSuccess: (data) => {
      setTokens(data.accessToken, data.refreshToken);
      toast.success("Cuenta creada");
    },
  });
}

export function useLogout() {
  const logout = useAuthStore((s) => s.logout);
  return useMutation({
    mutationFn: async () => {
      try {
        await api.post("/api/auth/logout");
      } catch {
        // Ignore network errors on logout
      }
    },
    onSettled: () => {
      logout();
      toast.success("Sesión cerrada");
    },
  });
}

export function useChangePassword() {
  const logout = useAuthStore((s) => s.logout);
  return useMutation({
    mutationFn: async (body: { currentPassword: string; newPassword: string }) => {
      await api.post("/api/auth/change-password", body);
    },
    onSuccess: () => {
      toast.success("Contraseña actualizada. Inicia sesión de nuevo.");
      setTimeout(() => {
        logout();
      }, 1500);
    },
  });
}
