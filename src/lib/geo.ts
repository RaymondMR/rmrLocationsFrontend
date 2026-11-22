import type { GeoJSONPoint } from "@/types/models";

/** API (GeoJSON [lng,lat]) → Leaflet ([lat,lng]) */
export function toLeaflet(p: GeoJSONPoint): [number, number] {
  return [p.coordinates[1], p.coordinates[0]];
}

/** Leaflet → API GeoJSON */
export function toGeoJSON(lat: number, lng: number): GeoJSONPoint {
  return { type: "Point", coordinates: [lng, lat] };
}

/** Distancia en metros entre dos puntos (fórmula de Haversine) */
export function haversineMeters(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number {
  const R = 6_371_000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h =
    sinLat * sinLat +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinLng * sinLng;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

/** "850 m" | "1.2 km" — para chips de distancia */
export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

/** Formatea coordenadas para mostrar: "19.4326° N · 99.1332° O" */
export function formatCoordinates(lat: number, lng: number): string {
  const latDir = lat >= 0 ? "N" : "S";
  const lngDir = lng >= 0 ? "E" : "O";
  return `${Math.abs(lat).toFixed(4)}° ${latDir} · ${Math.abs(lng).toFixed(4)}° ${lngDir}`;
}

/**
 * Enlace de Google Maps que marca un punto: `https://www.google.com/maps/?q={lat},{lng}&z=20&hl=es`
 * (z=20: máximo acercamiento; hl=es: interfaz en español). Es el que abre «Abrir en Google Maps» y el
 * que se copia para compartir el lugar por WhatsApp. Las coordenadas van con toda su precisión y con
 * punto decimal, sin redondear.
 */
export function googleMapsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/?q=${plainDecimal(lat)},${plainDecimal(lng)}&z=20&hl=es`;
}

/** String(n) pero sin notación científica: Google Maps no entiende `1e-7` en el parámetro q. */
function plainDecimal(value: number): string {
  const text = String(value);
  return /e/i.test(text) ? value.toFixed(10).replace(/\.?0+$/, "") : text;
}

/** Degradación del mapa para dark mode: filtro CSS */
export const DARK_MAP_FILTER =
  "brightness(0.85) contrast(1.05)";

/* ── Selección de ubicación (LocationPicker) ───────────────────────── */

export interface LatLng {
  lat: number;
  lng: number;
}

const isWithin = (value: number, max: number) =>
  Number.isFinite(value) && Math.abs(value) <= max;

/**
 * Texto de los inputs latitud/longitud → punto, o null si falta alguno, no es un número
 * o se sale de rango (latitud ±90, longitud ±180). Misma regla que el esquema Zod.
 */
export function parseLatLng(latitude: string, longitude: string): LatLng | null {
  if (latitude.trim() === "" || longitude.trim() === "") return null;
  const lat = Number(latitude);
  const lng = Number(longitude);
  return isWithin(lat, 90) && isWithin(lng, 180) ? { lat, lng } : null;
}

/**
 * Lleva un punto del mapa al dominio de la API. Leaflet deja arrastrar el mapa más allá del
 * antimeridiano y entonces devuelve longitudes como 190°: se envuelven a ±180. La latitud se
 * acota a ±90. El backend rechaza (400) cualquier coordenada fuera de rango.
 */
export function normalizePoint(lat: number, lng: number): LatLng {
  const wrappedLng =
    lng >= -180 && lng <= 180 ? lng : ((((lng + 180) % 360) + 360) % 360) - 180;
  return { lat: Math.min(90, Math.max(-90, lat)), lng: wrappedLng };
}

/** Valor para un input de coordenada: hasta 6 decimales (≈ 0,1 m) sin ceros de relleno. */
export function formatCoordinateInput(value: number): string {
  return String(Number(value.toFixed(6)));
}

export type GeolocationFailure = "unsupported" | "denied" | "unavailable" | "timeout";

export class GeolocationError extends Error {
  readonly reason: GeolocationFailure;

  constructor(reason: GeolocationFailure, message: string) {
    super(message);
    this.name = "GeolocationError";
    this.reason = reason;
  }
}

const GEOLOCATION_MESSAGES: Record<GeolocationFailure, string> = {
  unsupported: "Tu navegador no permite obtener la ubicación. Marca el punto en el mapa.",
  denied:
    "No diste permiso para usar tu ubicación. Actívalo en el navegador o marca el punto en el mapa.",
  unavailable: "No se pudo determinar tu ubicación. Marca el punto en el mapa.",
  timeout:
    "Tardó demasiado en obtener tu ubicación. Inténtalo de nuevo o marca el punto en el mapa.",
};

/**
 * Posición actual del dispositivo como promesa. Solo debe llamarse tras un gesto del
 * usuario (clic): el navegador pide permiso en ese momento y nunca al cargar la página.
 * Rechaza siempre con GeolocationError (mensaje ya en español).
 */
export function getCurrentPosition(
  options?: PositionOptions,
): Promise<LatLng & { accuracy: number }> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new GeolocationError("unsupported", GEOLOCATION_MESSAGES.unsupported));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) =>
        resolve({ lat: coords.latitude, lng: coords.longitude, accuracy: coords.accuracy }),
      (error) => {
        const reason: GeolocationFailure =
          error.code === error.PERMISSION_DENIED
            ? "denied"
            : error.code === error.TIMEOUT
              ? "timeout"
              : "unavailable";
        reject(new GeolocationError(reason, GEOLOCATION_MESSAGES[reason]));
      },
      // Un lugar se ubica a pie de calle: alta precisión; y maximumAge 0 para no reutilizar
      // una posición vieja si el usuario se movió.
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 0, ...options },
    );
  });
}
