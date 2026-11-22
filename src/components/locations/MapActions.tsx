import type { CSSProperties, MouseEvent as ReactMouseEvent } from "react";
import { Copy, MapPin } from "lucide-react";
import { toast } from "sonner";
import { copyToClipboard } from "@/lib/clipboard";
import { googleMapsUrl } from "@/lib/geo";

interface MapActionsProps {
  latitude: number;
  longitude: number;
}

// Mismo aspecto que el botón «Guardar» de la cabecera del lugar, en tamaño compacto.
const actionStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "0.4rem",
  padding: "9px 14px",
  borderRadius: "8px",
  border: "1px solid var(--border)",
  background: "var(--surface)",
  color: "var(--ink)",
  cursor: "pointer",
  fontFamily: "var(--sans)",
  fontSize: "0.8rem",
  fontWeight: 500,
  textDecoration: "none",
  transition: "background 0.15s",
};

const hoverOn = (e: ReactMouseEvent<HTMLElement>) => {
  e.currentTarget.style.background = "var(--background)";
};
const hoverOff = (e: ReactMouseEvent<HTMLElement>) => {
  e.currentTarget.style.background = "var(--surface)";
};

/**
 * Acciones del lugar en Google Maps. Las dos usan el mismo enlace
 * (`https://www.google.com/maps/?q={lat},{lng}&z=20&hl=es`): una lo abre en una pestaña nueva y la
 * otra lo copia al portapapeles para pegarlo en WhatsApp.
 */
export default function MapActions({ latitude, longitude }: MapActionsProps) {
  const url = googleMapsUrl(latitude, longitude);

  const handleCopy = async () => {
    if (await copyToClipboard(url)) {
      toast.success("Enlace copiado. Pégalo en WhatsApp para compartir el lugar.");
    } else {
      toast.error("No se pudo copiar el enlace. Ábrelo en Google Maps y compártelo desde allí.");
    }
  };

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.75rem" }}>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        style={actionStyle}
        onMouseEnter={hoverOn}
        onMouseLeave={hoverOff}
        title="Abrir este lugar en Google Maps, en una pestaña nueva"
      >
        <MapPin size={14} />
        Abrir en Google Maps
      </a>
      <button
        type="button"
        onClick={handleCopy}
        style={actionStyle}
        onMouseEnter={hoverOn}
        onMouseLeave={hoverOff}
        title="Copiar el enlace de Google Maps de este lugar para compartirlo por WhatsApp"
      >
        <Copy size={14} />
        Copiar enlace de Maps
      </button>
    </div>
  );
}
