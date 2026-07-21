import { cn } from "@/lib/utils";
import { TextareaHTMLAttributes } from "react";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function Textarea({ label, error, className, id, ...props }: TextareaProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium" style={{ color: "var(--ink)" }}>
          {label}
        </label>
      )}
      <textarea
        id={inputId}
        className={cn(
          "min-h-[100px] p-3 rounded-[10px] text-sm outline-none transition-colors duration-150 resize-y",
          "focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]",
          className,
        )}
        style={{
          background: "var(--background)",
          color: "var(--ink)",
          border: error ? "1px solid var(--danger)" : "1px solid var(--border)",
        }}
        {...props}
      />
      {error && (
        <span className="text-xs" style={{ color: "var(--danger)" }}>
          {error}
        </span>
      )}
    </div>
  );
}
