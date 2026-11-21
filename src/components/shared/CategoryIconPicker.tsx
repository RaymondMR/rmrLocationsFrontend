import { CATEGORY_ICONS } from "@/lib/constants";
import {
  Utensils, Coffee, Trees, Landmark, Music, Dumbbell, Store, Hotel, Beer,
  Camera, BookOpen, ShoppingBag, Palmtree, Building2, Church, Theater, Film,
  Gamepad2, HeartPulse, GraduationCap, Car, Bus, Plane, CircleParking, Wifi,
  PawPrint, Leaf, Mountain, Waves, Sun, Moon, Star, Heart, Sparkles, Zap,
  Compass, MapPin, Globe, Home, HelpCircle, Search,
} from "lucide-react";
import { useState } from "react";

interface CategoryIconPickerProps {
  value: string;
  onChange: (icon: string) => void;
}

// Mapa estático kebab → componente. Con imports nombrados el bundler hace
// tree-shaking y empaqueta sólo estos iconos, no toda la librería lucide
// (que eran ~632 kB con `import * as Lucide` + lookup dinámico).
// "museum" no existe en esta versión de lucide → fallback HelpCircle.
// "parking" no existe como icono suelto; CircleParking es el "P" estándar.
const ICON_MAP: Record<string, React.ElementType> = {
  utensils: Utensils,
  coffee: Coffee,
  trees: Trees,
  landmark: Landmark,
  music: Music,
  dumbbell: Dumbbell,
  store: Store,
  hotel: Hotel,
  beer: Beer,
  camera: Camera,
  "book-open": BookOpen,
  "shopping-bag": ShoppingBag,
  palmtree: Palmtree,
  "building-2": Building2,
  church: Church,
  museum: HelpCircle,
  theater: Theater,
  film: Film,
  "gamepad-2": Gamepad2,
  "heart-pulse": HeartPulse,
  "graduation-cap": GraduationCap,
  car: Car,
  bus: Bus,
  plane: Plane,
  parking: CircleParking,
  wifi: Wifi,
  "paw-print": PawPrint,
  leaf: Leaf,
  mountain: Mountain,
  waves: Waves,
  sun: Sun,
  moon: Moon,
  star: Star,
  heart: Heart,
  sparkles: Sparkles,
  zap: Zap,
  compass: Compass,
  "map-pin": MapPin,
  globe: Globe,
  home: Home,
};

function getLucideIcon(name: string): React.ElementType {
  return ICON_MAP[name] ?? HelpCircle;
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
