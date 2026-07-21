export const APP_NAME = "rmrLocations";
export const DEFAULT_MAP_CENTER: [number, number] = [19.4326, -99.1332]; // CDMX [lat, lng]
export const DEFAULT_MAP_ZOOM = 12;
export const DEFAULT_RADIUS_METERS = 5000;
export const DEFAULT_PAGE_SIZE = 20;
export const QUERY_STALE_TIME = 120_000; // 2 minutos
export const SEARCH_DEBOUNCE_MS = 350;
export const MAP_DEBOUNCE_MS = 400;
export const TOAST_DURATION = 4000;

export const DAYS_OF_WEEK: { value: string; label: string }[] = [
  { value: "Monday", label: "Lun" },
  { value: "Tuesday", label: "Mar" },
  { value: "Wednesday", label: "Mié" },
  { value: "Thursday", label: "Jue" },
  { value: "Friday", label: "Vie" },
  { value: "Saturday", label: "Sáb" },
  { value: "Sunday", label: "Dom" },
];

export const COMMON_COUNTRIES: { code: string; name: string }[] = [
  { code: "MX", name: "México" },
  { code: "US", name: "Estados Unidos" },
  { code: "ES", name: "España" },
  { code: "AR", name: "Argentina" },
  { code: "CO", name: "Colombia" },
  { code: "CL", name: "Chile" },
  { code: "PE", name: "Perú" },
  { code: "EC", name: "Ecuador" },
  { code: "CR", name: "Costa Rica" },
  { code: "PA", name: "Panamá" },
  { code: "DO", name: "Rep. Dominicana" },
  { code: "GT", name: "Guatemala" },
];

export const CATEGORY_ICONS = [
  "utensils", "coffee", "trees", "landmark", "music",
  "dumbbell", "store", "hotel", "beer", "camera",
  "book-open", "shopping-bag", "palmtree", "building-2",
  "church", "museum", "theater", "film", "gamepad-2",
  "heart-pulse", "graduation-cap", "car", "bus", "plane",
  "parking", "wifi", "paw-print", "leaf", "mountain",
  "waves", "sun", "moon", "star", "heart", "sparkles",
  "zap", "compass", "map-pin", "globe", "home",
];

export const COLOR_SWATCHES = [
  "#4F46E5", "#EA580C", "#10B981", "#EF4444", "#F59E0B",
  "#8B5CF6", "#EC4899", "#06B6D4", "#84CC16", "#F97316",
  "#6366F1", "#14B8A6",
];
