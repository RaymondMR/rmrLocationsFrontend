import { useState, useCallback, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios";
import { useAuthStore } from "@/stores/auth-store";
import { cn } from "@/lib/utils";
import { changePasswordSchema } from "@/types/forms";
import type { ChangePasswordFormData } from "@/types/forms";
import { getApiErrorMessage } from "@/lib/api-error";

interface ChangePasswordDialogProps {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}

export default function ChangePasswordDialog({
  open,
  onOpenChange,
}: ChangePasswordDialogProps) {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
  });

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (!open) {
      const timer = setTimeout(() => {
        reset();
        setServerError(null);
      }, 150);
      return () => clearTimeout(timer);
    }
    reset();
    setServerError(null);
  }, [open, reset]);

  const onSubmit = async (formData: ChangePasswordFormData) => {
    setServerError(null);
    try {
      await api.post("/api/auth/change-password", {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      });

      toast.success("Contrasena actualizada. Inicia sesion de nuevo.");
      onOpenChange(false);

      // Wait 1s then logout and redirect
      setTimeout(() => {
        logout();
        navigate("/login", { replace: true });
      }, 1000);
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

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget && !isSubmitting) {
        onOpenChange(false);
      }
    },
    [isSubmitting, onOpenChange]
  );

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isSubmitting) {
        onOpenChange(false);
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, isSubmitting, onOpenChange]);

  if (!open) return null;

  const inputStyles = (hasError: boolean) =>
    ({
      width: "100%",
      padding: "0.625rem 0.875rem",
      fontSize: "0.95rem",
      fontFamily: "var(--sans)",
      color: "var(--ink)",
      background: "var(--background)",
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
      background: "var(--background)",
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

  const eyeButton = (isVisible: boolean, toggle: () => void, label: string) => (
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

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0, 0, 0, 0.45)",
        backdropFilter: "blur(4px)",
        padding: "1rem",
      }}
      onClick={handleOverlayClick}
    >
      <div
        style={{
          background: "var(--surface)",
          borderRadius: "16px",
          boxShadow: "0 25px 50px rgba(0, 0, 0, 0.15)",
          width: "100%",
          maxWidth: "440px",
          padding: "2rem",
          position: "relative",
          animation: "rmr-rise 0.2s ease-out",
        }}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          disabled={isSubmitting}
          style={{
            position: "absolute",
            top: "1rem",
            right: "1rem",
            background: "none",
            border: "none",
            cursor: isSubmitting ? "not-allowed" : "pointer",
            color: "var(--ink-muted)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "0.25rem",
            borderRadius: "6px",
            transition: "background 0.15s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "var(--border)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "transparent";
          }}
        >
          <X size={20} />
        </button>

        {/* Title */}
        <h2
          style={{
            fontFamily: "var(--display)",
            fontSize: "1.35rem",
            fontWeight: 700,
            color: "var(--ink)",
            margin: "0 0 0.25rem",
          }}
        >
          Cambiar contrasena
        </h2>
        <p
          style={{
            color: "var(--ink-muted)",
            fontSize: "0.875rem",
            margin: "0 0 1.5rem",
          }}
        >
          Ingresa tu contrasena actual y la nueva.
        </p>

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

            {/* currentPassword */}
            <div>
              <label
                htmlFor="cp-current"
                style={{
                  display: "block",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  color: "var(--ink)",
                  marginBottom: "0.375rem",
                }}
              >
                Contrasena actual
              </label>
              <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                <input
                  id="cp-current"
                  type={showCurrent ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Tu contrasena actual"
                  {...register("currentPassword")}
                  style={passwordInputStyles(!!errors.currentPassword)}
                  onFocus={(e) => {
                    e.target.style.borderColor = "var(--primary)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = errors.currentPassword
                      ? "var(--danger)"
                      : "var(--border)";
                  }}
                />
                {eyeButton(showCurrent, () => setShowCurrent((p) => !p), "Mostrar contrasena actual")}
              </div>
              {fieldError(errors.currentPassword?.message)}
            </div>

            {/* newPassword */}
            <div>
              <label
                htmlFor="cp-new"
                style={{
                  display: "block",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  color: "var(--ink)",
                  marginBottom: "0.375rem",
                }}
              >
                Nueva contrasena
              </label>
              <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                <input
                  id="cp-new"
                  type={showNew ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Minimo 8 caracteres"
                  {...register("newPassword")}
                  style={passwordInputStyles(!!errors.newPassword)}
                  onFocus={(e) => {
                    e.target.style.borderColor = "var(--primary)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = errors.newPassword
                      ? "var(--danger)"
                      : "var(--border)";
                  }}
                />
                {eyeButton(showNew, () => setShowNew((p) => !p), "Mostrar nueva contrasena")}
              </div>
              {fieldError(errors.newPassword?.message)}
            </div>

            {/* confirmPassword */}
            <div>
              <label
                htmlFor="cp-confirm"
                style={{
                  display: "block",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  color: "var(--ink)",
                  marginBottom: "0.375rem",
                }}
              >
                Confirmar nueva contrasena
              </label>
              <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                <input
                  id="cp-confirm"
                  type={showConfirm ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Repite la nueva contrasena"
                  {...register("confirmPassword")}
                  style={passwordInputStyles(!!errors.confirmPassword)}
                  onFocus={(e) => {
                    e.target.style.borderColor = "var(--primary)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = errors.confirmPassword
                      ? "var(--danger)"
                      : "var(--border)";
                  }}
                />
                {eyeButton(showConfirm, () => setShowConfirm((p) => !p), "Mostrar confirmacion")}
              </div>
              {fieldError(errors.confirmPassword?.message)}
            </div>

            {/* Actions */}
            <div
              style={{
                display: "flex",
                gap: "0.75rem",
                justifyContent: "flex-end",
                marginTop: "0.5rem",
              }}
            >
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
                style={{
                  padding: "0.625rem 1.25rem",
                  fontSize: "0.9rem",
                  fontWeight: 500,
                  fontFamily: "var(--sans)",
                  color: "var(--ink-muted)",
                  background: "transparent",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                  cursor: isSubmitting ? "not-allowed" : "pointer",
                  transition: "background 0.15s, border-color 0.15s",
                  opacity: isSubmitting ? 0.6 : 1,
                }}
                onMouseEnter={(e) => {
                  if (!isSubmitting) {
                    (e.currentTarget as HTMLButtonElement).style.background = "var(--border)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSubmitting) {
                    (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                  }
                }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  padding: "0.625rem 1.5rem",
                  fontSize: "0.9rem",
                  fontWeight: 600,
                  fontFamily: "var(--display)",
                  color: "#fff",
                  background: isSubmitting ? "var(--primary-strong)" : "var(--primary)",
                  border: "none",
                  borderRadius: "8px",
                  cursor: isSubmitting ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
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
                {isSubmitting && <Loader2 size={18} className="animate-spin" />}
                {isSubmitting ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
