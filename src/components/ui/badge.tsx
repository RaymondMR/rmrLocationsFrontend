import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "danger" | "warning" | "muted";
  className?: string;
  style?: React.CSSProperties;
}

const variantColors: Record<string, { bg: string; text: string }> = {
  default: { bg: "var(--primary)", text: "#fff" },
  success: { bg: "var(--success)", text: "#fff" },
  danger: { bg: "var(--danger)", text: "#fff" },
  warning: { bg: "var(--rating)", text: "#fff" },
  muted: { bg: "var(--border)", text: "var(--ink-muted)" },
};

export function Badge({ children, variant = "default", className, style }: BadgeProps) {
  const colors = variantColors[variant];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium font-mono",
        className,
      )}
      style={{
        background: colors.bg,
        color: colors.text,
        fontFamily: "var(--mono)",
        ...style,
      }}
    >
      {children}
    </span>
  );
}

/** Badge that uses a category's colorHex for background tint */
export function CategoryBadge({
  children,
  colorHex,
  className,
}: {
  children: React.ReactNode;
  colorHex?: string | null;
  className?: string;
}) {
  const color = colorHex || "var(--primary)";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
        className,
      )}
      style={{
        background: `${color}1A`, // 10% opacity
        color: color,
      }}
    >
      {children}
    </span>
  );
}
