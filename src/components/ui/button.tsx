import * as React from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

const variantStyles: Record<string, React.CSSProperties> = {
  primary: {
    background: "var(--primary)",
    color: "#fff",
    border: "none",
  },
  secondary: {
    background: "transparent",
    color: "var(--ink)",
    border: "1px solid var(--border)",
  },
  ghost: {
    background: "transparent",
    color: "var(--ink)",
    border: "none",
  },
  danger: {
    background: "var(--danger)",
    color: "#fff",
    border: "none",
  },
};

const sizeStyles: Record<string, React.CSSProperties> = {
  sm: { height: 32, padding: "0 10px", fontSize: 13 },
  md: { height: 40, padding: "0 16px", fontSize: 14 },
  lg: { height: 48, padding: "0 24px", fontSize: 16 },
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  className,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 font-semibold rounded-[10px] cursor-pointer transition-all duration-150",
        disabled || loading ? "opacity-50 cursor-not-allowed" : "",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]",
        className,
      )}
      style={{
        ...variantStyles[variant],
        ...sizeStyles[size],
      }}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg
          className="animate-spin"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
      )}
      {children}
    </button>
  );
}
