import { CATEGORY_ICONS } from "@/lib/constants";
import { Search } from "lucide-react";
import { useState } from "react";
import * as Lucide from "lucide-react";

interface CategoryIconPickerProps {
  value: string;
  onChange: (icon: string) => void;
}

function getLucideIcon(name: string) {
  const key = name
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join("") as keyof typeof Lucide;
  return (Lucide[key] as React.ElementType) || Lucide.HelpCircle;
}

export default function CategoryIconPicker({ value, onChange }: CategoryIconPickerProps) {
  const [search, setSearch] = useState("");

  const filtered = CATEGORY_ICONS.filter((name) =>
    name.includes(search.toLowerCase()),
  );

  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2"
          style={{ color: "var(--ink-muted)" }}
        />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar ícono…"
          className="w-full h-9 pl-8 pr-3 rounded-lg text-sm outline-none border"
          style={{
            background: "var(--background)",
            color: "var(--ink)",
            borderColor: "var(--border)",
          }}
        />
      </div>
      <div className="grid grid-cols-8 gap-1 max-h-[200px] overflow-y-auto">
        {filtered.map((name) => {
          const IconComponent = getLucideIcon(name);
          return (
            <button
              key={name}
              type="button"
              onClick={() => onChange(name)}
              className="w-9 h-9 rounded-lg flex items-center justify-center transition-all hover:scale-110"
              style={{
                background: value === name ? "var(--primary)" + "1A" : "transparent",
                border: value === name ? "2px solid var(--primary)" : "2px solid transparent",
                color: value === name ? "var(--primary)" : "var(--ink-muted)",
                cursor: "pointer",
              }}
              title={name}
            >
              <IconComponent size={18} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
