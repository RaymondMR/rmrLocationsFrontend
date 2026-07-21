import * as React from "react";
import { cn } from "@/lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export function Input({ label, error, className, id, icon, ...props }: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm font-medium"
          style={{ color: "var(--ink)" }}
        >
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <span
            className="absolute left-3 top-1/2 -translate-y-1/2 inline-flex"
            style={{ color: "var(--ink-muted)" }}
          >
            {icon}
          </span>
        )}
        <input
          id={inputId}
          className={cn(
            "h-10 rounded-[10px] text-sm outline-none transition-colors duration-150 w-full",
            "focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]",
            icon ? "pl-9 pr-3" : "px-3",
            className,
          )}
          style={{
            background: "var(--background)",
            color: "var(--ink)",
            border: error
              ? "1px solid var(--danger)"
              : "1px solid var(--border)",
          }}
          {...props}
        />
      </div>
      {error && (
        <span className="text-xs" style={{ color: "var(--danger)" }}>
          {error}
        </span>
      )}
    </div>
  );
}
