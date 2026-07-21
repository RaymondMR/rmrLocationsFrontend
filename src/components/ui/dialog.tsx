import { ReactNode } from "react";
import { X } from "lucide-react";

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  maxWidth?: string;
}

export function Dialog({ open, onOpenChange, title, description, children, maxWidth = "max-w-lg" }: DialogProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onOpenChange(false);
      }}
      style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}
    >
      <div
        className={`w-full ${maxWidth} rounded-xl border shadow-2xl max-h-[90vh] overflow-y-auto`}
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        onKeyDown={(e) => {
          if (e.key === "Escape") onOpenChange(false);
        }}
      >
        <div
          className="flex items-center justify-between p-4 border-b"
          style={{ borderColor: "var(--border)" }}
        >
          <div>
            <h2 className="text-lg font-bold" style={{ fontFamily: "var(--display)", color: "var(--ink)" }}>
              {title}
            </h2>
            {description && (
              <p className="text-sm mt-0.5" style={{ color: "var(--ink-muted)" }}>
                {description}
              </p>
            )}
          </div>
          <button
            onClick={() => onOpenChange(false)}
            aria-label="Cerrar"
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:opacity-70 transition-opacity"
            style={{ background: "var(--background)", border: "none", cursor: "pointer", color: "var(--ink-muted)" }}
          >
            <X size={16} />
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}
