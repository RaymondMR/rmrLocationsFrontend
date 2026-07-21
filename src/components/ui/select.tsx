import { cn } from "@/lib/utils";

interface SelectProps {
  label?: string;
  options: { value: string; label: string }[];
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  error?: string;
}

export function Select({ label, options, value, onChange, placeholder, className, error }: SelectProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <span className="text-sm font-medium" style={{ color: "var(--ink)" }}>
          {label}
        </span>
      )}
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "h-10 px-3 rounded-[10px] text-sm outline-none transition-colors duration-150",
          className,
        )}
        style={{
          background: "var(--background)",
          color: "var(--ink)",
          border: error ? "1px solid var(--danger)" : "1px solid var(--border)",
          fontFamily: "inherit",
        }}
      >
        {placeholder && (
          <option value="">{placeholder}</option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && (
        <span className="text-xs" style={{ color: "var(--danger)" }}>
          {error}
        </span>
      )}
    </div>
  );
}
