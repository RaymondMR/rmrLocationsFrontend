import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, useLocation } from "react-router-dom";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios";
import { useAuthStore } from "@/stores/auth-store";
import { cn } from "@/lib/utils";
import { loginSchema } from "@/types/forms";
import type { LoginFormData } from "@/types/forms";
import type { TokenResponse } from "@/types/models";
import { getApiErrorMessage } from "@/lib/api-error";

export default function LoginForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const setTokens = useAuthStore((s) => s.setTokens);
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const from = (location.state as { from?: string })?.from || "/";

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (formData: LoginFormData) => {
    setServerError(null);
    try {
      const { data } = await api.post<TokenResponse>("/api/auth/login", {
        userName: formData.userName,
        email: "",
        password: formData.password,
      });
      setTokens(data.accessToken, data.refreshToken);
      toast.success("Bienvenido!");
      navigate(from, { replace: true });
    } catch (error: unknown) {
      const axiosError = error as { response?: { status?: number; data?: { detail?: string; title?: string } } };
      if (axiosError.response?.status === 401) {
        const msg =
          axiosError.response.data?.detail ||
          axiosError.response.data?.title ||
          "Credenciales invalidas. Verifica tu usuario y contrasena.";
        setServerError(msg);
      } else {
        toast.error(getApiErrorMessage(error));
      }
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        {/* Server error */}
        {serverError && (
          <div
            style={{
              background: "rgba(239, 68, 68, 0.08)",
              border: "1px solid var(--danger)",
              borderRadius: "8px",
              padding: "0.75rem 1rem",
              color: "var(--danger)",
              fontSize: "0.875rem",
              fontFamily: "var(--mono)",
            }}
          >
            {serverError}
          </div>
        )}

        {/* userName */}
        <div>
          <label
            htmlFor="login-userName"
            style={{
              display: "block",
              fontSize: "0.875rem",
              fontWeight: 500,
              color: "var(--ink)",
              marginBottom: "0.375rem",
            }}
          >
            Usuario
          </label>
          <input
            id="login-userName"
            type="text"
            autoComplete="username"
            placeholder="Tu nombre de usuario"
            {...register("userName")}
            style={{
              width: "100%",
              padding: "0.625rem 0.875rem",
              fontSize: "0.95rem",
              fontFamily: "var(--sans)",
              color: "var(--ink)",
              background: "var(--surface)",
              border: `1px solid ${errors.userName ? "var(--danger)" : "var(--border)"}`,
              borderRadius: "8px",
              outline: "none",
              transition: "border-color 0.15s",
              boxSizing: "border-box",
            }}
            onFocus={(e) => {
              e.target.style.borderColor = "var(--primary)";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = errors.userName ? "var(--danger)" : "var(--border)";
            }}
          />
          {errors.userName && (
            <p
              style={{
                margin: "0.25rem 0 0",
                fontSize: "0.8rem",
                color: "var(--danger)",
                fontFamily: "var(--mono)",
              }}
            >
              {errors.userName.message}
            </p>
          )}
        </div>

        {/* password */}
        <div>
          <label
            htmlFor="login-password"
            style={{
              display: "block",
              fontSize: "0.875rem",
              fontWeight: 500,
              color: "var(--ink)",
              marginBottom: "0.375rem",
            }}
          >
            Contrasena
          </label>
          <div
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
            }}
          >
            <input
              id="login-password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Tu contrasena"
              {...register("password")}
              style={{
                width: "100%",
                padding: "0.625rem 2.5rem 0.625rem 0.875rem",
                fontSize: "0.95rem",
                fontFamily: "var(--sans)",
                color: "var(--ink)",
                background: "var(--surface)",
                border: `1px solid ${errors.password ? "var(--danger)" : "var(--border)"}`,
                borderRadius: "8px",
                outline: "none",
                transition: "border-color 0.15s",
                boxSizing: "border-box",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "var(--primary)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = errors.password ? "var(--danger)" : "var(--border)";
              }}
            />
            <button
              type="button"
              onClick={() => setShowPassword((p) => !p)}
              tabIndex={-1}
              style={{
                position: "absolute",
                right: "0.625rem",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--ink-muted)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "0.25rem",
              }}
              aria-label={showPassword ? "Ocultar contrasena" : "Mostrar contrasena"}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          {errors.password && (
            <p
              style={{
                margin: "0.25rem 0 0",
                fontSize: "0.8rem",
                color: "var(--danger)",
                fontFamily: "var(--mono)",
              }}
            >
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={isSubmitting}
          style={{
            width: "100%",
            padding: "0.75rem 1rem",
            fontSize: "1rem",
            fontWeight: 600,
            fontFamily: "var(--display)",
            color: "#fff",
            background: isSubmitting ? "var(--primary-strong)" : "var(--primary)",
            border: "none",
            borderRadius: "8px",
            cursor: isSubmitting ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem",
            transition: "background 0.15s, opacity 0.15s",
            opacity: isSubmitting ? 0.85 : 1,
          }}
          onMouseEnter={(e) => {
            if (!isSubmitting) {
              (e.currentTarget as HTMLButtonElement).style.background = "var(--primary-strong)";
            }
          }}
          onMouseLeave={(e) => {
            if (!isSubmitting) {
              (e.currentTarget as HTMLButtonElement).style.background = "var(--primary)";
            }
          }}
        >
          {isSubmitting && <Loader2 size={20} className="animate-spin" />}
          {isSubmitting ? "Ingresando..." : "Iniciar sesion"}
        </button>
      </div>
    </form>
  );
}
