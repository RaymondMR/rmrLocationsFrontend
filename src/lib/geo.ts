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

/** Degradación del mapa para dark mode: filtro CSS */
export const DARK_MAP_FILTER =
  "brightness(0.85) contrast(1.05)";
