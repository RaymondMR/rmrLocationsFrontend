import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "@/stores/auth-store";
import { cn } from "@/lib/utils";

interface ProtectedRouteProps {
  children: React.ReactNode;
  role?: "Admin";
}

function ErrorState({ message }: { message: string }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "4rem 2rem",
        textAlign: "center",
      }}
    >
      <div
        style={{
          width: "48px",
          height: "48px",
          borderRadius: "50%",
          background: "var(--danger)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "1rem",
          color: "#fff",
          fontSize: "1.25rem",
          fontWeight: 700,
          fontFamily: "var(--display)",
        }}
      >
        !
      </div>
      <h2
        style={{
          fontFamily: "var(--display)",
          color: "var(--ink)",
          fontSize: "1.25rem",
          fontWeight: 600,
          margin: 0,
        }}
      >
        {message}
      </h2>
      <p
        style={{
          color: "var(--ink-muted)",
          fontSize: "0.9rem",
          marginTop: "0.5rem",
          marginBottom: 0,
        }}
      >
        No tienes los permisos necesarios para ver esta seccion.
      </p>
    </div>
  );
}

export default function ProtectedRoute({ children, role }: ProtectedRouteProps) {
  const { status, roles } = useAuthStore();
  const location = useLocation();

  if (status === "loading") {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
          padding: "2rem",
        }}
      >
        <div className="rmr-skel" style={{ height: "2rem", width: "60%" }} />
        <div className="rmr-skel" style={{ height: "1.5rem", width: "40%" }} />
        <div className="rmr-skel" style={{ height: "1.5rem", width: "80%" }} />
      </div>
    );
  }

  if (status === "anonymous") {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (role === "Admin" && !roles.includes("Admin")) {
    return <ErrorState message="Acceso restringido" />;
  }

  return <>{children}</>;
}
