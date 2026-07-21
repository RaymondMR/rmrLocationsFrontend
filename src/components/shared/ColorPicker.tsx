import { COLOR_SWATCHES } from "@/lib/constants";
import { Input } from "@/components/ui/input";

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  error?: string;
}

export default function ColorPicker({ value, onChange, error }: ColorPickerProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {COLOR_SWATCHES.map((swatch) => (
          <button
            key={swatch}
            type="button"
            onClick={() => onChange(swatch)}
            className="w-8 h-8 rounded-full border-2 transition-transform hover:scale-110"
            style={{
              background: swatch,
              borderColor: value === swatch ? "var(--ink)" : "transparent",
              cursor: "pointer",
            }}
            aria-label={`Color ${swatch}`}
          />
        ))}
        {/* Custom color input */}
        <label
          className="w-8 h-8 rounded-full border-2 flex items-center justify-center cursor-pointer transition-transform hover:scale-110 relative"
          style={{
            background: value || "#FFFFFF",
            borderColor: COLOR_SWATCHES.includes(value) ? "transparent" : "var(--ink)",
          }}
        >
          <span className="text-xs" style={{ color: value ? "#fff" : "var(--ink)" }}>+</span>
          <input
            type="color"
            value={value || "#6E6A85"}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
        </label>
      </div>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="#RRGGBB"
        error={error}
        className="max-w-[140px]"
        style={{ fontFamily: "var(--mono)", fontSize: 13 }}
      />
    </div>
  );
}
