import { Link } from "react-router-dom";
import { MapPin, Compass } from "lucide-react";
import { cn } from "@/lib/utils";

/* ────────────────────────────────────────────── */
/*  NotFoundPage                                  */
/* ────────────────────────────────────────────── */
export default function NotFoundPage() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "calc(100vh - 200px)",
        textAlign: "center",
        position: "relative",
        overflow: "hidden",
        padding: "2rem 1rem",
      }}
    >
      {/* Background grid pattern */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "repeating-linear-gradient(0deg, var(--grid) 0px, var(--grid) 1px, transparent 1px, transparent 48px), repeating-linear-gradient(90deg, var(--grid) 0px, var(--grid) 1px, transparent 1px, transparent 48px)",
          backgroundSize: "48px 48px",
          opacity: 0.4,
          pointerEvents: "none",
        }}
      />

      {/* Fallen pin */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          marginBottom: "1.5rem",
          transform: "rotate(-45deg)",
          opacity: 0.5,
        }}
      >
        <MapPin
          size={80}
          style={{
            color: "var(--primary)",
          }}
        />
      </div>

      {/* 404 */}
      <h1
        style={{
          fontFamily: "var(--display)",
          fontSize: "clamp(5rem, 20vw, 10rem)",
          fontWeight: 800,
          color: "var(--ink)",
          margin: 0,
          lineHeight: 1,
          letterSpacing: "-0.04em",
          position: "relative",
          zIndex: 1,
        }}
      >
        404
      </h1>

      {/* Coordinates */}
      <p
        style={{
          fontFamily: "var(--mono)",
          fontSize: "clamp(0.85rem, 2vw, 1rem)",
          color: "var(--ink-muted)",
          margin: "0.5rem 0 1rem 0",
          position: "relative",
          zIndex: 1,
        }}
      >
        0.0000&deg; N &middot; 0.0000&deg; O &mdash; aqui no hay nada
      </p>

      {/* Description */}
      <p
        style={{
          fontSize: "clamp(0.9rem, 2vw, 1.05rem)",
          color: "var(--ink-muted)",
          maxWidth: "400px",
          lineHeight: 1.6,
          margin: "0 0 2rem 0",
          position: "relative",
          zIndex: 1,
        }}
      >
        La pagina que buscas no esta en el mapa.
      </p>

      {/* Actions */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "0.75rem",
          justifyContent: "center",
          position: "relative",
          zIndex: 1,
        }}
      >
        <Link
          to="/"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.4rem",
            padding: "12px 24px",
            borderRadius: "10px",
            background: "var(--primary)",
            color: "#fff",
            textDecoration: "none",
            fontFamily: "var(--sans)",
            fontSize: "0.9rem",
            fontWeight: 600,
            transition: "opacity 0.15s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.opacity = "0.9";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.opacity = "1";
          }}
        >
          <Compass size={18} />
          Volver al inicio
        </Link>

        <Link
          to="/locations"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.4rem",
            padding: "12px 24px",
            borderRadius: "10px",
            background: "var(--surface)",
            color: "var(--ink)",
            textDecoration: "none",
            fontFamily: "var(--sans)",
            fontSize: "0.9rem",
            fontWeight: 600,
            border: "1px solid var(--border)",
            transition: "background 0.15s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background =
              "var(--background)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background =
              "var(--surface)";
          }}
        >
          <MapPin size={18} />
          Explorar lugares
        </Link>
      </div>
    </div>
  );
}
