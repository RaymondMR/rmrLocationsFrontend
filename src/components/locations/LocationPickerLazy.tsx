import { Component, lazy, Suspense } from "react";
import type { ErrorInfo, ReactNode } from "react";
// Import de solo tipos: se borra al compilar, así que NO arrastra Leaflet al bundle principal.
import type { LocationPickerProps } from "./LocationPicker";
import { MAP_HEIGHT_CLASS, type MapSize } from "./map-size";

// Leaflet (+ react-leaflet y su CSS) pesa bastante y solo hace falta en la pestaña
// "Ubicación": se carga bajo demanda para no engordar el bundle inicial de toda la app.
const LocationPicker = lazy(() => import("./LocationPicker"));

function MapMessage({
  children,
  role,
  size,
  danger = false,
}: {
  children: ReactNode;
  role: "status" | "alert";
  size: MapSize;
  danger?: boolean;
}) {
  return (
    <div
      role={role}
      // Misma altura que el mapa para que el layout no se mueva al terminar de cargar.
      className={MAP_HEIGHT_CLASS[size]}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
        textAlign: "center",
        borderRadius: "10px",
        border: "1px solid var(--border)",
        background: "var(--background)",
        color: danger ? "var(--danger)" : "var(--ink-muted)",
        fontSize: "0.85rem",
        lineHeight: 1.5,
      }}
    >
      {children}
    </div>
  );
}

/**
 * No hay un ErrorBoundary en la app y un chunk que no se pueda cargar (sin red, o una
 * pestaña vieja tras un despliegue nuevo) dejaría TODA la página en blanco. Aquí el fallo
 * se queda en el mapa; los inputs de latitud/longitud siguen funcionando.
 */
class MapErrorBoundary extends Component<
  { readOnly: boolean; size: MapSize; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown, info: ErrorInfo) {
    console.error("No se pudo cargar el mapa:", error, info.componentStack);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <MapMessage role="alert" size={this.props.size} danger>
        {this.props.readOnly
          ? "No se pudo cargar el mapa."
          : "No se pudo cargar el mapa. Escribe la latitud y la longitud en los campos de abajo."}
      </MapMessage>
    );
  }
}

/** LocationPicker cargado bajo demanda y aislado de fallos de carga. Mismas props. */
export default function LocationPickerLazy(props: LocationPickerProps) {
  const size = props.size ?? "form";
  return (
    <MapErrorBoundary readOnly={props.readOnly ?? false} size={size}>
      <Suspense
        fallback={
          <MapMessage role="status" size={size}>
            Cargando mapa…
          </MapMessage>
        }
      >
        <LocationPicker {...props} />
      </Suspense>
    </MapErrorBoundary>
  );
}
