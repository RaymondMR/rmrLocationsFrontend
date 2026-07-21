import type { ReactNode } from "react";
import { MapPinOff } from "lucide-react";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export default function EmptyState({
  icon,
  title,
  description,
  action,
}: EmptyStateProps) {
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
          background: "var(--background)",
          color: "var(--ink-muted)",
          marginBottom: "1.25rem",
        }}
      >
        {icon ?? <MapPinOff size={28} />}
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

      {description && (
        <p
          style={{
            fontSize: "0.875rem",
            color: "var(--ink-muted)",
            lineHeight: 1.6,
            maxWidth: "400px",
            margin: "0 0 1.25rem 0",
          }}
        >
          {description}
        </p>
      )}

      {action && (
        <button
          onClick={action.onClick}
          style={{
            padding: "10px 20px",
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
          {action.label}
        </button>
      )}
    </div>
  );
}
