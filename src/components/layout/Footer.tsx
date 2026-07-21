import { Link } from "react-router-dom";
import { MapPin } from "lucide-react";
import { APP_NAME } from "@/lib/constants";

const footerNavLinks = [
  { label: "Explorar", href: "/locations" },
  { label: "Categorías", href: "/categories" },
  { label: "Tags", href: "/tags" },
  { label: "Contacto", href: "/contact" },
];

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      style={{
        background: "var(--surface)",
        borderTop: "1px solid var(--border)",
        color: "var(--ink-muted)",
      }}
    >
      <div
        style={{
          maxWidth: "1280px",
          margin: "0 auto",
          padding: "3rem 1rem",
        }}
        className="px-4 md:px-6 lg:px-8"
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "2rem",
          }}
        >
          {/* Brand column */}
          <div>
            <Link
              to="/"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                textDecoration: "none",
                color: "var(--ink)",
                fontFamily: "var(--display)",
                fontSize: "1.25rem",
                fontWeight: 700,
                marginBottom: "0.75rem",
              }}
            >
              <MapPin size={22} style={{ color: "var(--primary)" }} />
              {APP_NAME}
            </Link>
            <p
              style={{
                fontSize: "0.875rem",
                lineHeight: 1.6,
                maxWidth: "280px",
              }}
            >
              Descubre lugares que valen la pena
            </p>
          </div>

          {/* Navigation column */}
          <div>
            <h4
              style={{
                fontFamily: "var(--display)",
                color: "var(--ink)",
                fontSize: "0.9rem",
                fontWeight: 600,
                marginBottom: "0.75rem",
                marginTop: 0,
              }}
            >
              Navegación
            </h4>
            <nav style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {footerNavLinks.map((link) => (
                <Link
                  key={link.label}
                  to={link.href}
                  style={{
                    color: "var(--ink-muted)",
                    textDecoration: "none",
                    fontSize: "0.875rem",
                    transition: "color 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.color = "var(--primary)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.color = "var(--ink-muted)";
                  }}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* About column */}
          <div>
            <h4
              style={{
                fontFamily: "var(--display)",
                color: "var(--ink)",
                fontSize: "0.9rem",
                fontWeight: 600,
                marginBottom: "0.75rem",
                marginTop: 0,
              }}
            >
              Acerca de
            </h4>
            <p style={{ fontSize: "0.875rem", lineHeight: 1.6, margin: 0 }}>
              Hecho con{" "}
              <span
                style={{
                  fontFamily: "var(--mono)",
                  fontSize: "0.8rem",
                  color: "var(--primary)",
                }}
              >
                rmrLocationsApi
              </span>
            </p>
            <p
              style={{
                fontSize: "0.8rem",
                marginTop: "0.75rem",
                marginBottom: 0,
              }}
            >
              &copy; {currentYear} Ing. R. Montoya R. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
