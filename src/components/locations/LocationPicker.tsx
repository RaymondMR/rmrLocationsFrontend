import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, RefObject } from "react";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import { divIcon } from "leaflet";
import type {
  DragEndEvent,
  LatLngBoundsLiteral,
  Map as LeafletMap,
  Marker as LeafletMarker,
} from "leaflet";
import { LoaderCircle, LocateFixed } from "lucide-react";
import "leaflet/dist/leaflet.css";
import {
  DEFAULT_MAP_CENTER,
  DEFAULT_MAP_ZOOM,
  MAP_ATTRIBUTION,
  MAP_TILE_URL,
} from "@/lib/constants";
import {
  DARK_MAP_FILTER,
  GeolocationError,
  formatDistance,
  getCurrentPosition,
  normalizePoint,
  parseLatLng,
} from "@/lib/geo";
import type { LatLng } from "@/lib/geo";
import { useUIStore } from "@/stores/ui-store";
import { MAP_HEIGHT_CLASS, type MapSize } from "./map-size";

export interface LocationPickerProps {
  /** Latitud tal como está en el formulario (texto de un <input>). */
  latitude: string;
  /** Longitud tal como está en el formulario (texto de un <input>). */
  longitude: string;
  /**
   * Se invoca al colocar el pin (clic en el mapa), arrastrarlo o usar la ubicación del
   * dispositivo. El punto ya viene normalizado: latitud ±90, longitud ±180.
   */
  onChange?: (point: LatLng) => void;
  /** Solo muestra el pin: sin clic, arrastre ni botón de ubicación. */
  readOnly?: boolean;
  /** "form" (300/400/500 px según el ancho, por defecto) o "compact" (220 px, barra lateral). */
  size?: MapSize;
}

/** Zoom al que se acerca el mapa cuando el punto queda fuera de la vista. */
const POINT_ZOOM = 16;
/** Zoom tras "Usar mi ubicación": el GPS permite ubicar a pie de calle. */
const LOCATE_ZOOM = 17;
/** Pausa tras teclear una coordenada antes de mover el mapa (evita saltos dígito a dígito). */
const FOLLOW_DELAY_MS = 800;
/** Un mapa de Mercator solo llega a ±85,05° de latitud; sin esto se ven mundos repetidos. */
const WORLD_BOUNDS: LatLngBoundsLiteral = [
  [-85.06, -180],
  [85.06, 180],
];

/**
 * Pin en forma de gota con SVG en línea (FRONTEND_DESIGN_SPEC §7.5): un divIcon evita el bug
 * clásico de los PNG de Leaflet con Vite (las rutas de las imágenes no se resuelven).
 */
const PIN_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="42" viewBox="0 0 32 42" aria-hidden="true" focusable="false">' +
  '<path d="M16 1.5C8.5 1.5 2.5 7.4 2.5 14.8c0 9.8 10.4 22.7 12.6 25.3.5.6 1.3.6 1.8 0 2.2-2.6 12.6-15.5 12.6-25.3C29.5 7.4 23.5 1.5 16 1.5Z" style="fill:var(--primary);stroke:#fff;stroke-width:2"/>' +
  '<circle cx="16" cy="14.8" r="5" fill="#fff"/></svg>';

const PIN_ICON = divIcon({
  className: "rmr-pin",
  html: PIN_SVG,
  iconSize: [32, 42],
  iconAnchor: [16, 41],
});

/**
 * Opciones de movimiento del mapa. NO se pasa `animate: true`: con él Leaflet anima SIEMPRE,
 * aunque el destino esté a cientos de kilómetros (llegó a hacer un panBy de -141 371 px), y en
 * pruebas dejó la vista a ~46 km del pin. Sin `animate`, Leaflet anima solo lo cercano (menos
 * de una pantalla) y salta directamente a lo lejano. Con prefers-reduced-motion nunca anima.
 */
const moveOptions = (): { animate?: false } =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ? { animate: false }
    : {};

/** ¿Es el mismo punto? Los inputs guardan 6 decimales, de ahí la tolerancia. */
const samePoint = (a: LatLng, b: LatLng) =>
  Math.abs(a.lat - b.lat) < 1e-6 && Math.abs(a.lng - b.lng) < 1e-6;

/** Clic en el mapa = nuevo punto. Solo se monta cuando el mapa no es de solo lectura. */
function ClickToPlace({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click: (event) => onPick(event.latlng.lat, event.latlng.lng),
  });
  return null;
}

/**
 * Mantiene el pin a la vista cuando las coordenadas cambian desde fuera (se teclean en los
 * inputs). Espera a que el usuario deje de teclear y solo mueve el mapa si el punto quedó
 * fuera de él. Ignora los puntos que el propio mapa acaba de emitir (clic, arrastre, "Usar mi
 * ubicación"): ahí el pin ya está a la vista y, si el mapa aún se está animando, getBounds()
 * devuelve la vista antigua y se lanzaría un segundo movimiento que pisa al primero.
 */
function FollowPoint({
  point,
  emittedRef,
}: {
  point: LatLng | null;
  emittedRef: RefObject<LatLng | null>;
}) {
  const map = useMap();
  useEffect(() => {
    if (!point) return;
    const emitted = emittedRef.current;
    if (emitted && samePoint(emitted, point)) return;
    const timer = window.setTimeout(() => {
      const target: [number, number] = [point.lat, point.lng];
      if (!map.getBounds().contains(target)) {
        map.setView(target, Math.max(map.getZoom(), POINT_ZOOM), moveOptions());
      }
    }, FOLLOW_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [map, point, emittedRef]);
  return null;
}

/**
 * El zoom con la rueda del ratón solo se activa mientras el mapa tiene el foco (clic):
 * así el mapa no secuestra el scroll de la página (FRONTEND_DESIGN_SPEC §10.2).
 */
function WheelZoomOnFocus() {
  const map = useMap();
  useEffect(() => {
    const enable = () => map.scrollWheelZoom.enable();
    const disable = () => map.scrollWheelZoom.disable();
    map.on("focus", enable);
    map.on("blur", disable);
    return () => {
      map.off("focus", enable);
      map.off("blur", disable);
    };
  }, [map]);
  return null;
}

type Notice = { kind: "info" | "error"; text: string };

/**
 * Mapa para elegir la ubicación de un lugar: clic para colocar el pin, pin arrastrable,
 * botón "Usar mi ubicación" y sincronía con los inputs de latitud/longitud, que siguen siendo
 * la alternativa accesible (teclado y lector de pantalla). Con `readOnly` solo muestra el pin.
 */
export default function LocationPicker({
  latitude,
  longitude,
  onChange,
  readOnly = false,
  size = "form",
}: LocationPickerProps) {
  const theme = useUIStore((state) => state.theme);
  const point = useMemo(() => parseLatLng(latitude, longitude), [latitude, longitude]);

  // MapContainer solo lee center/zoom al montarse; después el mapa lo mueve FollowPoint.
  const [initialView] = useState(() => ({
    center: point ? ([point.lat, point.lng] as [number, number]) : DEFAULT_MAP_CENTER,
    zoom: point ? POINT_ZOOM : DEFAULT_MAP_ZOOM,
  }));
  const [map, setMap] = useState<LeafletMap | null>(null);
  const [locating, setLocating] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);

  // Último punto que el propio mapa envió al formulario (lo lee FollowPoint).
  const emittedRef = useRef<LatLng | null>(null);

  const choose = useCallback(
    (lat: number, lng: number) => {
      const chosen = normalizePoint(lat, lng);
      emittedRef.current = chosen;
      onChange?.(chosen);
      setNotice(null);
    },
    [onChange],
  );

  const markerEvents = useMemo(
    () => ({
      dragend: (event: DragEndEvent) => {
        const { lat, lng } = (event.target as LeafletMarker).getLatLng();
        choose(lat, lng);
      },
    }),
    [choose],
  );

  const locate = useCallback(async () => {
    setLocating(true);
    setNotice(null);
    try {
      const here = await getCurrentPosition();
      const target = normalizePoint(here.lat, here.lng);
      emittedRef.current = target;
      onChange?.(target);
      map?.setView(
        [target.lat, target.lng],
        Math.max(map.getZoom(), LOCATE_ZOOM),
        moveOptions(),
      );
      const precision = formatDistance(here.accuracy);
      setNotice({
        kind: "info",
        // Los equipos de escritorio suelen dar una posición por Wi-Fi/IP, muy poco precisa.
        text:
          here.accuracy > 200
            ? `Ubicación aproximada (precisión ≈ ${precision}). Ajusta el pin hasta el lugar exacto.`
            : `Ubicación detectada (precisión ≈ ${precision}). Ajusta el pin si hace falta.`,
      });
    } catch (error) {
      setNotice({
        kind: "error",
        text:
          error instanceof GeolocationError
            ? error.message
            : "No se pudo obtener tu ubicación. Marca el punto en el mapa.",
      });
    } finally {
      setLocating(false);
    }
  }, [map, onChange]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
      <div
        role="group"
        aria-label={
          readOnly ? "Mapa con la ubicación del lugar" : "Mapa para elegir la ubicación del lugar"
        }
        className={`rmr-map-frame ${MAP_HEIGHT_CLASS[size]}`}
        style={
          { "--map-tile-filter": theme === "dark" ? DARK_MAP_FILTER : "none" } as CSSProperties
        }
      >
        <MapContainer
          ref={setMap}
          className="rmr-map"
          center={initialView.center}
          zoom={initialView.zoom}
          minZoom={2}
          maxBounds={WORLD_BOUNDS}
          maxBoundsViscosity={1}
          scrollWheelZoom={false}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer url={MAP_TILE_URL} attribution={MAP_ATTRIBUTION} maxZoom={19} />
          <WheelZoomOnFocus />
          <FollowPoint point={point} emittedRef={emittedRef} />
          {!readOnly && <ClickToPlace onPick={choose} />}
          {point && (
            <Marker
              position={[point.lat, point.lng]}
              icon={PIN_ICON}
              draggable={!readOnly}
              keyboard={!readOnly}
              title="Ubicación del lugar"
              alt="Ubicación del lugar"
              eventHandlers={readOnly ? undefined : markerEvents}
            />
          )}
        </MapContainer>
      </div>

      {!readOnly && (
        <>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: "0.5rem 0.9rem",
            }}
          >
            <button
              type="button"
              onClick={locate}
              disabled={locating}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                minHeight: "44px",
                padding: "0 14px",
                borderRadius: "8px",
                border: "1px solid var(--border)",
                background: "var(--surface)",
                color: "var(--ink)",
                cursor: locating ? "wait" : "pointer",
                fontFamily: "var(--sans)",
                fontSize: "0.85rem",
                fontWeight: 500,
                opacity: locating ? 0.7 : 1,
              }}
            >
              {locating ? (
                <LoaderCircle size={16} className="animate-spin" aria-hidden="true" />
              ) : (
                <LocateFixed size={16} aria-hidden="true" />
              )}
              {locating ? "Buscando tu ubicación…" : "Usar mi ubicación"}
            </button>
            <span
              style={{
                flex: "1 1 220px",
                fontSize: "0.8rem",
                color: "var(--ink-muted)",
                lineHeight: 1.5,
              }}
            >
              Haz clic en el mapa o arrastra el pin para marcar el lugar. También puedes escribir
              las coordenadas.
            </span>
          </div>

          {notice && (
            <p
              role="status"
              aria-live="polite"
              style={{
                margin: 0,
                fontSize: "0.8rem",
                lineHeight: 1.5,
                color: notice.kind === "error" ? "var(--danger)" : "var(--ink-muted)",
              }}
            >
              {notice.text}
            </p>
          )}
        </>
      )}
    </div>
  );
}
