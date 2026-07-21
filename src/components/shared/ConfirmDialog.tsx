import { useEffect, useRef } from "react";
import { AlertTriangle } from "lucide-react";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  variant?: "danger" | "default";
  onConfirm: () => void;
}

export default function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirmar",
  variant = "default",
  onConfirm,
}: ConfirmDialogProps) {
  const confirmRef = useRef<HTMLButtonElement>(null);

  // Trap focus and handle Escape
  useEffect(() => {
    if (!open) return;

    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onOpenChange(false);
      }
    };

    document.addEventListener("keydown", handler);
    confirmRef.current?.focus();

    // Prevent body scroll while dialog is open
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [open, onOpenChange]);

  if (!open) return null;

  const isDanger = variant === "danger";

  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-desc"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0, 0, 0, 0.45)",
        backdropFilter: "blur(4px)",
        padding: "1rem",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onOpenChange(false);
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "420px",
          background: "var(--surface)",
          borderRadius: "14px",
          border: "1px solid var(--border)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
          padding: "1.5rem",
          animation: "rmr-rise 0.2s ease-out",
        }}
      >
        {/* Icon */}
        {isDanger && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "44px",
              height: "44px",
              borderRadius: "12px",
              background: "color-mix(in srgb, var(--danger) 12%, transparent)",
              color: "var(--danger)",
              marginBottom: "1rem",
            }}
          >
            <AlertTriangle size={22} />
          </div>
        )}

        {/* Title */}
        <h3
          id="confirm-dialog-title"
          style={{
            fontFamily: "var(--display)",
            fontSize: "1.1rem",
            fontWeight: 700,
            color: "var(--ink)",
            margin: "0 0 0.5rem 0",
          }}
        >
          {title}
        </h3>

        {/* Description */}
        <p
          id="confirm-dialog-desc"
          style={{
            fontSize: "0.875rem",
            color: "var(--ink-muted)",
            lineHeight: 1.6,
            margin: "0 0 1.5rem 0",
          }}
        >
          {description}
        </p>

        {/* Actions */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "0.5rem",
          }}
        >
          <button
            onClick={() => onOpenChange(false)}
            style={{
              padding: "9px 18px",
              borderRadius: "8px",
              border: "1px solid var(--border)",
              background: "transparent",
              color: "var(--ink)",
              cursor: "pointer",
              fontFamily: "var(--sans)",
              fontSize: "0.85rem",
              fontWeight: 500,
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = "var(--background)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = "transparent";
            }}
          >
            Cancelar
          </button>

          <button
            ref={confirmRef}
            onClick={handleConfirm}
            style={{
              padding: "9px 18px",
              borderRadius: "8px",
              border: "none",
              background: isDanger ? "var(--danger)" : "var(--primary)",
              color: "#fff",
              cursor: "pointer",
              fontFamily: "var(--sans)",
              fontSize: "0.85rem",
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
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
