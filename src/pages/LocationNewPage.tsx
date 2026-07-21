import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import {
  Info,
  MapPin,
  Map,
  Layers,
  Clock,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  Save,
  AlertTriangle,
} from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import { cn } from "@/lib/utils";
import api from "@/lib/axios";
import type { LocationFormData } from "@/types/forms";
import type { Location } from "@/types/models";

/* ────────────────────────────────────────────── */
/*  Tab definitions                               */
/* ────────────────────────────────────────────── */
const TABS = [
  { id: "info", label: "Informacion", icon: <Info size={16} /> },
  { id: "address", label: "Direccion", icon: <MapPin size={16} /> },
  { id: "location", label: "Ubicacion", icon: <Map size={16} /> },
  { id: "classification", label: "Clasificacion", icon: <Layers size={16} /> },
  { id: "hours", label: "Horarios", icon: <Clock size={16} /> },
  { id: "publish", label: "Publicacion", icon: <CheckSquare size={16} /> },
] as const;

type TabId = (typeof TABS)[number]["id"];

/* ────────────────────────────────────────────── */
/*  LocationNewPage                               */
/* ────────────────────────────────────────────── */
export default function LocationNewPage() {
  const navigate = useNavigate();
  const [currentTab, setCurrentTab] = useState<TabId>("info");

  /* ── Tab navigation ───────────────────────── */
  const tabIndex = TABS.findIndex((t) => t.id === currentTab);
  const hasPrev = tabIndex > 0;
  const hasNext = tabIndex < TABS.length - 1;

  const goNext = useCallback(() => {
    if (hasNext) setCurrentTab(TABS[tabIndex + 1].id);
  }, [tabIndex, hasNext]);

  const goPrev = useCallback(() => {
    if (hasPrev) setCurrentTab(TABS[tabIndex - 1].id);
  }, [tabIndex, hasPrev]);

  /* ── Placeholder submit handler ───────────── */
  const submitMutation = useMutation({
    mutationFn: (data: Partial<LocationFormData>) =>
      api.post<Location>("/api/location", data).then((r) => r.data),
    onSuccess: (loc) => {
      navigate(`/locations/${loc.id}`);
    },
  });

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      // TODO Phase 4: implement full form with react-hook-form + zod
      // submitMutation.mutate({ name: "..." });
    },
    [submitMutation],
  );

  /* ══════════════════════════════════════════════ */
  /*  RENDER                                       */
  /* ══════════════════════════════════════════════ */
  return (
    <div>
      <PageHeader
        title="Nuevo lugar"
        subtitle="Completa los datos para registrar un nuevo lugar"
      />

      {/* ── Tab bar ────────────────────────────── */}
      <div
        style={{
          display: "flex",
          gap: "0.25rem",
          marginBottom: "1.5rem",
          padding: "0.25rem",
          borderRadius: "10px",
          background: "var(--surface)",
          border: "1px solid var(--border)",
          overflowX: "auto",
        }}
      >
        {TABS.map((tab) => {
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setCurrentTab(tab.id)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.35rem",
                padding: "10px 14px",
                borderRadius: "8px",
                border: "none",
                background: isActive ? "var(--primary)" : "transparent",
                color: isActive ? "#fff" : "var(--ink-muted)",
                cursor: "pointer",
                fontFamily: "var(--sans)",
                fontSize: "0.8rem",
                fontWeight: isActive ? 600 : 500,
                whiteSpace: "nowrap",
                transition: "background 0.15s, color 0.15s",
              }}
            >
              {tab.icon}
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── Tab content ────────────────────────── */}
      <form onSubmit={handleSubmit}>
        <div
          style={{
            padding: "1.5rem",
            borderRadius: "12px",
            background: "var(--surface)",
            border: "1px solid var(--border)",
            marginBottom: "1.5rem",
          }}
        >
          {/* ══ Info tab ══════════════════════════ */}
          {currentTab === "info" && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "1rem",
              }}
            >
              <h3
                style={{
                  fontFamily: "var(--display)",
                  fontSize: "1rem",
                  fontWeight: 600,
                  color: "var(--ink)",
                  margin: 0,
                }}
              >
                Informacion basica
              </h3>

              <FormField label="Nombre del lugar" required>
                <input
                  type="text"
                  placeholder="Ej: Cafe de la Esquina"
                  style={inputStyle}
                />
              </FormField>

              <FormField label="Slug" required>
                <input
                  type="text"
                  placeholder="Ej: cafe-de-la-esquina"
                  style={{ ...inputStyle, fontFamily: "var(--mono)" }}
                />
              </FormField>

              <FormField label="Descripcion">
                <textarea
                  placeholder="Describe el lugar…"
                  rows={4}
                  style={{
                    ...inputStyle,
                    resize: "vertical",
                    minHeight: "80px",
                    fontFamily: "var(--sans)",
                  }}
                />
              </FormField>

              <FormField label="Sitio web">
                <input
                  type="url"
                  placeholder="https://…"
                  style={inputStyle}
                />
              </FormField>

              <FormField label="Telefono">
                <input
                  type="tel"
                  placeholder="+52 55 …"
                  style={inputStyle}
                />
              </FormField>
            </div>
          )}

          {/* ══ Address tab ════════════════════════ */}
          {currentTab === "address" && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "1rem",
              }}
            >
              <h3
                style={{
                  fontFamily: "var(--display)",
                  fontSize: "1rem",
                  fontWeight: 600,
                  color: "var(--ink)",
                  margin: 0,
                }}
              >
                Direccion del lugar
              </h3>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "1rem",
                }}
                className="max-sm:grid-cols-1"
              >
                <FormField label="Calle">
                  <input type="text" placeholder="Calle" style={inputStyle} />
                </FormField>
                <FormField label="Numero exterior">
                  <input type="text" placeholder="123" style={inputStyle} />
                </FormField>
                <FormField label="Numero interior">
                  <input
                    type="text"
                    placeholder="Apto 4B"
                    style={inputStyle}
                  />
                </FormField>
                <FormField label="Colonia">
                  <input
                    type="text"
                    placeholder="Col. Centro"
                    style={inputStyle}
                  />
                </FormField>
                <FormField label="Ciudad">
                  <input
                    type="text"
                    placeholder="Ciudad de Mexico"
                    style={inputStyle}
                  />
                </FormField>
                <FormField label="Estado">
                  <input
                    type="text"
                    placeholder="CDMX"
                    style={inputStyle}
                  />
                </FormField>
                <FormField label="Codigo postal">
                  <input
                    type="text"
                    placeholder="06600"
                    style={inputStyle}
                  />
                </FormField>
                <FormField label="Pais">
                  <select
                    style={{
                      ...inputStyle,
                      cursor: "pointer",
                      appearance: "none",
                    }}
                  >
                    <option value="MX">Mexico</option>
                    <option value="US">Estados Unidos</option>
                    <option value="ES">Espana</option>
                  </select>
                </FormField>
              </div>
            </div>
          )}

          {/* ══ Location tab ════════════════════════ */}
          {currentTab === "location" && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "1rem",
              }}
            >
              <h3
                style={{
                  fontFamily: "var(--display)",
                  fontSize: "1rem",
                  fontWeight: 600,
                  color: "var(--ink)",
                  margin: 0,
                }}
              >
                Ubicacion geografica
              </h3>

              {/* Location picker placeholder */}
              <div
                style={{
                  width: "100%",
                  height: "320px",
                  borderRadius: "10px",
                  border: "2px dashed var(--border)",
                  background: "var(--background)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.75rem",
                  color: "var(--ink-muted)",
                }}
              >
                <Map size={36} style={{ color: "var(--primary)" }} />
                <span
                  style={{
                    fontFamily: "var(--display)",
                    fontSize: "0.95rem",
                    fontWeight: 600,
                  }}
                >
                  Mapa interactivo — selecciona la ubicacion
                </span>
                <span
                  style={{
                    fontSize: "0.8rem",
                    textAlign: "center",
                    maxWidth: "320px",
                  }}
                >
                  Haz clic en el mapa para marcar la posicion del lugar. (Disponible en una proxima fase)
                </span>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "1rem",
                }}
                className="max-sm:grid-cols-1"
              >
                <FormField label="Latitud">
                  <input
                    type="number"
                    step="any"
                    placeholder="19.4326"
                    style={{ ...inputStyle, fontFamily: "var(--mono)" }}
                  />
                </FormField>
                <FormField label="Longitud">
                  <input
                    type="number"
                    step="any"
                    placeholder="-99.1332"
                    style={{ ...inputStyle, fontFamily: "var(--mono)" }}
                  />
                </FormField>
              </div>
            </div>
          )}

          {/* ══ Classification tab ════════════════════ */}
          {currentTab === "classification" && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "1rem",
              }}
            >
              <h3
                style={{
                  fontFamily: "var(--display)",
                  fontSize: "1rem",
                  fontWeight: 600,
                  color: "var(--ink)",
                  margin: 0,
                }}
              >
                Clasificacion
              </h3>

              <FormField label="Categoria principal">
                <select
                  style={{
                    ...inputStyle,
                    cursor: "pointer",
                    appearance: "none",
                  }}
                >
                  <option value="">Selecciona una categoria</option>
                  <option value="restaurant">Restaurante</option>
                  <option value="cafe">Cafe</option>
                  <option value="park">Parque</option>
                </select>
              </FormField>

              <FormField label="Tags">
                <div
                  style={{
                    padding: "0.75rem",
                    borderRadius: "8px",
                    border: "1px dashed var(--border)",
                    color: "var(--ink-muted)",
                    fontSize: "0.85rem",
                    textAlign: "center",
                  }}
                >
                  Selector de tags disponible en una proxima fase
                </div>
              </FormField>
            </div>
          )}

          {/* ══ Hours tab ════════════════════════════ */}
          {currentTab === "hours" && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "1rem",
              }}
            >
              <h3
                style={{
                  fontFamily: "var(--display)",
                  fontSize: "1rem",
                  fontWeight: 600,
                  color: "var(--ink)",
                  margin: 0,
                }}
              >
                Horarios de atencion
              </h3>
              <p
                style={{
                  fontSize: "0.85rem",
                  color: "var(--ink-muted)",
                  margin: 0,
                }}
              >
                Define los horarios para cada dia de la semana. (Formulario completo disponible en una proxima fase)
              </p>

              {[
                "Lunes",
                "Martes",
                "Miercoles",
                "Jueves",
                "Viernes",
                "Sabado",
                "Domingo",
              ].map((day) => (
                <div
                  key={day}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "1rem",
                    padding: "0.6rem 0",
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  <span
                    style={{
                      width: "100px",
                      fontSize: "0.85rem",
                      fontWeight: 600,
                      color: "var(--ink)",
                    }}
                  >
                    {day}
                  </span>
                  <input
                    type="time"
                    defaultValue="09:00"
                    style={inputStyle}
                  />
                  <span style={{ color: "var(--ink-muted)" }}>a</span>
                  <input
                    type="time"
                    defaultValue="18:00"
                    style={inputStyle}
                  />
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.3rem",
                      fontSize: "0.8rem",
                      color: "var(--ink-muted)",
                      cursor: "pointer",
                      marginLeft: "auto",
                    }}
                  >
                    <input type="checkbox" />
                    Cerrado
                  </label>
                </div>
              ))}
            </div>
          )}

          {/* ══ Publish tab ════════════════════════════ */}
          {currentTab === "publish" && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "1rem",
              }}
            >
              <h3
                style={{
                  fontFamily: "var(--display)",
                  fontSize: "1rem",
                  fontWeight: 600,
                  color: "var(--ink)",
                  margin: 0,
                }}
              >
                Publicacion
              </h3>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.75rem",
                }}
              >
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    cursor: "pointer",
                    fontSize: "0.85rem",
                    color: "var(--ink)",
                  }}
                >
                  <input type="radio" name="status" value="Draft" defaultChecked />
                  Guardar como borrador
                </label>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    cursor: "pointer",
                    fontSize: "0.85rem",
                    color: "var(--ink)",
                  }}
                >
                  <input type="radio" name="status" value="Published" />
                  Publicar inmediatamente
                </label>
              </div>

              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  cursor: "pointer",
                  fontSize: "0.85rem",
                  color: "var(--ink)",
                }}
              >
                <input type="checkbox" defaultChecked />
                Visible en busquedas publicas
              </label>

              <div
                style={{
                  marginTop: "0.5rem",
                  padding: "0.75rem",
                  borderRadius: "8px",
                  background:
                    "color-mix(in srgb, var(--rating) 8%, transparent)",
                  border: "1px solid var(--rating)",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "0.5rem",
                }}
              >
                <AlertTriangle
                  size={16}
                  style={{
                    color: "var(--rating)",
                    flexShrink: 0,
                    marginTop: "2px",
                  }}
                />
                <p
                  style={{
                    margin: 0,
                    fontSize: "0.8rem",
                    color: "var(--ink-muted)",
                    lineHeight: 1.5,
                  }}
                >
                  Revisa que toda la informacion sea correcta antes de publicar.
                  Una vez publicado, algunos campos no podran modificarse.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ── Navigation buttons ──────────────── */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <button
            type="button"
            onClick={goPrev}
            disabled={!hasPrev}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.35rem",
              padding: "10px 18px",
              borderRadius: "8px",
              border: "1px solid var(--border)",
              background: "var(--surface)",
              color: hasPrev ? "var(--ink)" : "var(--ink-muted)",
              cursor: hasPrev ? "pointer" : "not-allowed",
              fontFamily: "var(--sans)",
              fontSize: "0.85rem",
              fontWeight: 500,
              opacity: hasPrev ? 1 : 0.5,
            }}
          >
            <ChevronLeft size={16} />
            Anterior
          </button>

          {hasNext ? (
            <button
              type="button"
              onClick={goNext}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.35rem",
                padding: "10px 18px",
                borderRadius: "8px",
                border: "none",
                background: "var(--primary)",
                color: "#fff",
                cursor: "pointer",
                fontFamily: "var(--sans)",
                fontSize: "0.85rem",
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
              Siguiente
              <ChevronRight size={16} />
            </button>
          ) : (
            <button
              type="submit"
              disabled={submitMutation.isPending}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.35rem",
                padding: "10px 18px",
                borderRadius: "8px",
                border: "none",
                background: "var(--primary)",
                color: "#fff",
                cursor: "pointer",
                fontFamily: "var(--sans)",
                fontSize: "0.85rem",
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
              <Save size={16} />
              {submitMutation.isPending
                ? "Guardando…"
                : "Guardar lugar"}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

/* ────────────────────────────────────────────── */
/*  Internal helpers                              */
/* ────────────────────────────────────────────── */

interface FormFieldProps {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}

function FormField({ label, required, children }: FormFieldProps) {
  return (
    <label
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "0.35rem",
        fontSize: "0.85rem",
        fontWeight: 500,
        color: "var(--ink)",
      }}
    >
      {label}
      {required && (
        <span style={{ color: "var(--danger)", marginLeft: "2px" }}>*</span>
      )}
      {children}
    </label>
  );
}

const inputStyle: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: "8px",
  border: "1px solid var(--border)",
  background: "var(--background)",
  color: "var(--ink)",
  fontFamily: "var(--sans)",
  fontSize: "0.85rem",
  outline: "none",
  width: "100%",
  transition: "border-color 0.15s",
  boxSizing: "border-box",
};
