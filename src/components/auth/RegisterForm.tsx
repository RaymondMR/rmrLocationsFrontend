import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios";
import { useAuthStore } from "@/stores/auth-store";
import { cn } from "@/lib/utils";
import { registerSchema } from "@/types/forms";
import type { RegisterFormData } from "@/types/forms";
import type { RegisteredUser, TokenResponse } from "@/types/models";
import { getApiErrorMessage } from "@/lib/api-error";

export default function RegisterForm() {
  const navigate = useNavigate();
  const setTokens = useAuthStore((s) => s.setTokens);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (formData: RegisterFormData) => {
    setServerError(null);
    try {
      // Step 1: Register
      await api.post<RegisteredUser>("/api/auth/register", {
        userName: formData.userName,
        email: formData.email,
        password: formData.password,
      });

      // Step 2: Auto-login with same credentials
      const { data } = await api.post<TokenResponse>("/api/auth/login", {
        userName: formData.userName,
        email: "",
        password: formData.password,
      });

      setTokens(data.accessToken, data.refreshToken);
      toast.success("Cuenta creada. Bienvenido!");
      navigate("/", { replace: true });
    } catch (error: unknown) {
      const axiosError = error as { response?: { status?: number; data?: { detail?: string; title?: string } } };
      if (axiosError.response?.status === 400) {
        const msg =
          axiosError.response.data?.detail ||
          axiosError.response.data?.title ||
          "Datos invalidos. Revisa los campos e intenta de nuevo.";
        setServerError(msg);
      } else {
        toast.error(getApiErrorMessage(error));
      }
    }
  };

  const inputStyles = (hasError: boolean) =>
    ({
      width: "100%",
      padding: "0.625rem 0.875rem",
      fontSize: "0.95rem",
      fontFamily: "var(--sans)",
      color: "var(--ink)",
      background: "var(--surface)",
      border: `1px solid ${hasError ? "var(--danger)" : "var(--border)"}`,
      borderRadius: "8px",
      outline: "none",
      transition: "border-color 0.15s",
      boxSizing: "border-box",
    } as React.CSSProperties);

  const passwordInputStyles = (hasError: boolean) =>
    ({
      width: "100%",
      padding: "0.625rem 2.5rem 0.625rem 0.875rem",
      fontSize: "0.95rem",
      fontFamily: "var(--sans)",
      color: "var(--ink)",
      background: "var(--surface)",
      border: `1px solid ${hasError ? "var(--danger)" : "var(--border)"}`,
      borderRadius: "8px",
      outline: "none",
      transition: "border-color 0.15s",
      boxSizing: "border-box",
    } as React.CSSProperties);

  const fieldError = (message?: string) =>
    message ? (
      <p
        style={{
          margin: "0.25rem 0 0",
          fontSize: "0.8rem",
          color: "var(--danger)",
          fontFamily: "var(--mono)",
        }}
      >
        {message}
      </p>
    ) : null;

  const eyeButton = (
    isVisible: boolean,
    toggle: () => void,
    label: string
  ) => (
    <button
      type="button"
      onClick={toggle}
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
      aria-label={label}
    >
      {isVisible ? <EyeOff size={20} /> : <Eye size={20} />}
    </button>
  );

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = "var(--primary)";
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>, hasError: boolean) => {
    e.target.style.borderColor = hasError ? "var(--danger)" : "var(--border)";
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
            htmlFor="reg-userName"
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
            id="reg-userName"
            type="text"
            autoComplete="username"
            placeholder="3 a 64 caracteres"
            {...register("userName")}
            style={inputStyles(!!errors.userName)}
            onFocus={handleFocus}
            onBlur={(e) => handleBlur(e, !!errors.userName)}
          />
          {fieldError(errors.userName?.message)}
        </div>

        {/* email */}
        <div>
          <label
            htmlFor="reg-email"
            style={{
              display: "block",
              fontSize: "0.875rem",
              fontWeight: 500,
              color: "var(--ink)",
              marginBottom: "0.375rem",
            }}
          >
            Correo electronico
          </label>
          <input
            id="reg-email"
            type="email"
            autoComplete="email"
            placeholder="correo@ejemplo.com"
            {...register("email")}
            style={inputStyles(!!errors.email)}
            onFocus={handleFocus}
            onBlur={(e) => handleBlur(e, !!errors.email)}
          />
          {fieldError(errors.email?.message)}
        </div>

        {/* password */}
        <div>
          <label
            htmlFor="reg-password"
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
          <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
            <input
              id="reg-password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Minimo 8 caracteres"
              {...register("password")}
              style={passwordInputStyles(!!errors.password)}
              onFocus={handleFocus}
              onBlur={(e) => handleBlur(e, !!errors.password)}
            />
            {eyeButton(showPassword, () => setShowPassword((p) => !p), "Mostrar contrasena")}
          </div>
          {fieldError(errors.password?.message)}
        </div>

        {/* confirmPassword */}
        <div>
          <label
            htmlFor="reg-confirm"
            style={{
              display: "block",
              fontSize: "0.875rem",
              fontWeight: 500,
              color: "var(--ink)",
              marginBottom: "0.375rem",
            }}
          >
            Confirmar contrasena
          </label>
          <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
            <input
              id="reg-confirm"
              type={showConfirm ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Repite la contrasena"
              {...register("confirmPassword")}
              style={passwordInputStyles(!!errors.confirmPassword)}
              onFocus={handleFocus}
              onBlur={(e) => handleBlur(e, !!errors.confirmPassword)}
            />
            {eyeButton(showConfirm, () => setShowConfirm((p) => !p), "Mostrar confirmacion")}
          </div>
          {fieldError(errors.confirmPassword?.message)}
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
          {isSubmitting ? "Creando cuenta..." : "Crear cuenta"}
        </button>
      </div>
    </form>
  );
}
