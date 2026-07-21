import { AlertTriangle } from "lucide-react";

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export default function ErrorState({
  title = "Algo salió mal",
  message,
  onRetry,
}: ErrorStateProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "3rem 1.5rem",
        textAlign: "center",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "64px",
          height: "64px",
          borderRadius: "16px",
          background: "color-mix(in srgb, var(--danger) 12%, transparent)",
          color: "var(--danger)",
          marginBottom: "1.25rem",
        }}
      >
        <AlertTriangle size={28} />
      </div>

      <h3
        style={{
          fontFamily: "var(--display)",
          fontSize: "1.15rem",
          fontWeight: 700,
          color: "var(--ink)",
          margin: "0 0 0.5rem 0",
        }}
      >
        {title}
      </h3>

      <p
        style={{
          fontSize: "0.875rem",
          color: "var(--ink-muted)",
          lineHeight: 1.6,
          maxWidth: "440px",
          margin: "0 0 1.5rem 0",
        }}
      >
        {message}
      </p>

      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            padding: "10px 24px",
            borderRadius: "8px",
            background: "var(--primary)",
            color: "#fff",
            border: "none",
            cursor: "pointer",
            fontFamily: "var(--sans)",
            fontSize: "0.875rem",
            fontWeight: 600,
            transition: "opacity 0.15s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.opacity = "0.9";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.opacity = "1";
          }}
        >
          Reintentar
        </button>
      )}
    </div>
  );
}
