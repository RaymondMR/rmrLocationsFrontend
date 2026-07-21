import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MapPin } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import LoginForm from "@/components/auth/LoginForm";
import { APP_NAME } from "@/lib/constants";

export default function LoginPage() {
  const navigate = useNavigate();
  const status = useAuthStore((s) => s.status);

  useEffect(() => {
    if (status === "authenticated") {
      navigate("/", { replace: true });
    }
  }, [status, navigate]);

  // Avoid flash of content while checking auth
  if (status === "loading") {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "60vh",
        }}
      >
        <div className="rmr-skel" style={{ width: "120px", height: "24px" }} />
      </div>
    );
  }

  // Don't render if already authenticated (redirect will fire)
  if (status === "authenticated") {
    return null;
  }

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        padding: "2rem 1rem",
        animation: "rmr-rise 0.35s ease-out",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "360px",
        }}
      >
        {/* Logo */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            marginBottom: "2rem",
            textDecoration: "none",
          }}
        >
          <div
            style={{
              width: "52px",
              height: "52px",
              borderRadius: "14px",
              background: "var(--primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "0.75rem",
            }}
          >
            <MapPin size={28} color="#fff" />
          </div>
          <h1
            style={{
              fontFamily: "var(--display)",
              fontSize: "1.5rem",
              fontWeight: 700,
              color: "var(--ink)",
              margin: 0,
            }}
          >
            {APP_NAME}
          </h1>
          <p
            style={{
              color: "var(--ink-muted)",
              fontSize: "0.9rem",
              margin: "0.25rem 0 0",
            }}
          >
            Inicia sesion para continuar
          </p>
        </div>

        {/* Card */}
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "16px",
            padding: "2rem",
            boxShadow: "0 4px 24px rgba(0, 0, 0, 0.06)",
          }}
        >
          <LoginForm />
        </div>

        {/* Register link */}
        <p
          style={{
            textAlign: "center",
            color: "var(--ink-muted)",
            fontSize: "0.9rem",
            marginTop: "1.5rem",
            marginBottom: 0,
          }}
        >
          No tienes cuenta?{" "}
          <Link
            to="/register"
            style={{
              color: "var(--primary)",
              textDecoration: "none",
              fontWeight: 600,
              transition: "color 0.15s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.color = "var(--primary-strong)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.color = "var(--primary)";
            }}
          >
            Registrate
          </Link>
        </p>
      </div>
    </div>
  );
}
