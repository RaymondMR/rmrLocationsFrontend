import { useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
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
  Lock,
} from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import LoadingSkeleton from "@/components/shared/LoadingSkeleton";
import ErrorState from "@/components/shared/ErrorState";
import { cn } from "@/lib/utils";
import api from "@/lib/axios";
import type { LocationFormData } from "@/types/forms";
import type { Location } from "@/types/models";

/* ────────────────────────────────────────────── */
/*  Tabs definitions                              */
/* ────────────────────────────────────────────── */
interface TabDef {
  id: string;
  label: string;
  icon: React.ReactNode;
  readOnly?: boolean;
}

const TABS: TabDef[] = [
  { id: "info", label: "Informacion", icon: <Info size={16} /> },
  { id: "address", label: "Direccion", icon: <MapPin size={16} /> },
  {
    id: "location",
    label: "Ubicacion",
    icon: <Map size={16} />,
    readOnly: true,
  },
  {
    id: "classification",
    label: "Clasificacion",
    icon: <Layers size={16} />,
    readOnly: true,
  },
  { id: "hours", label: "Horarios", icon: <Clock size={16} />, readOnly: true },
  { id: "publish", label: "Publicacion", icon: <CheckSquare size={16} /> },
];

/* ────────────────────────────────────────────── */
/*  LocationEditPage                              */
/* ────────────────────────────────────────────── */
export default function LocationEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [currentTab, setCurrentTab] = useState("info");

  /* ── Fetch existing location ──────────────── */
  const locationQuery = useQuery({
    queryKey: ["locations", id],
    queryFn: () =>
      api.get<Location>(`/api/location/${id}`).then((r) => r.data),
    enabled: !!id,
    staleTime: 30_000,
    retry: false,
  });

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

  /* ── Submit handler placeholder ───────────── */
  const editMutation = useMutation({
    mutationFn: (data: Partial<LocationFormData>) =>
      api.put<Location>(`/api/location/${id}`, data).then((r) => r.data),
    onSuccess: () => {
      navigate(`/locations/${id}`);
    },
  });

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      // TODO Phase 4: implement full form with react-hook-form + zod
      // editMutation.mutate({ ... });
    },
    [editMutation, id],
  );

  /* ══════════════════════════════════════════════ */
  /*  STATES                                       */
  /* ══════════════════════════════════════════════ */
  if (locationQuery.isLoading) {
    return (
      <div>
        <PageHeader title="Editar lugar" />
        <LoadingSkeleton variant="detail" />
      </div>
    );
  }

  if (locationQuery.isError) {
    return (
      <ErrorState
        message={
          (locationQuery.error as Error)?.message ??
          "No pudimos cargar la informacion del lugar"
        }
        onRetry={() => locationQuery.refetch()}
      />
    );
  }

  const loc = locationQuery.data!;

  /* ══════════════════════════════════════════════ */
  /*  RENDER                                       */
  /* ══════════════════════════════════════════════ */
  return (
    <div>
      <PageHeader
        title="Editar lugar"
        subtitle={`Editando: ${loc.name}`}
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
                color: isActive
                  ? "#fff"
                  : tab.readOnly
                    ? "var(--ink-muted)"
                    : "var(--ink)",
                cursor: "pointer",
                fontFamily: "var(--sans)",
                fontSize: "0.8rem",
                fontWeight: isActive ? 600 : 500,
                whiteSpace: "nowrap",
                opacity: tab.readOnly && !isActive ? 0.6 : 1,
                transition: "background 0.15s, color 0.15s",
              }}
            >
              {tab.icon}
              {tab.label}
              {tab.readOnly && <Lock size={12} />}
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
                  defaultValue={loc.name}
                  placeholder="Nombre del lugar"
                  style={inputStyle}
                />
              </FormField>

              <FormField label="Slug" required>
                <input
                  type="text"
                  defaultValue={loc.slug}
                  placeholder="slug-del-lugar"
                  style={{ ...inputStyle, fontFamily: "var(--mono)" }}
                />
              </FormField>

              <FormField label="Descripcion">
                <textarea
                  defaultValue={loc.description ?? ""}
                  placeholder="Describe el lugar…"
                  rows={4}
                  style={{
                    ...inputStyle,
                    resize: "vertical",
                    minHeight: "80px",
                  }}
                />
              </FormField>

              <FormField label="Sitio web">
                <input
                  type="url"
                  defaultValue={loc.websiteUrl ?? ""}
                  placeholder="https://…"
                  style={inputStyle}
                />
              </FormField>

              <FormField label="Telefono">
                <input
                  type="tel"
                  defaultValue={loc.phoneNumber ?? ""}
                  placeholder="+52 55 …"
                  style={inputStyle}
                />
              </FormField>
            </div>
          )}

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
                  <input
                    type="text"
                    defaultValue={loc.address?.street ?? ""}
                    style={inputStyle}
                  />
                </FormField>
                <FormField label="Numero exterior">
                  <input
                    type="text"
                    defaultValue={loc.address?.exteriorNumber ?? ""}
                    style={inputStyle}
                  />
                </FormField>
                <FormField label="Numero interior">
                  <input
                    type="text"
                    defaultValue={loc.address?.interiorNumber ?? ""}
                    style={inputStyle}
                  />
                </FormField>
                <FormField label="Colonia">
                  <input
                    type="text"
                    defaultValue={loc.address?.neighborhood ?? ""}
                    style={inputStyle}
                  />
                </FormField>
                <FormField label="Ciudad">
                  <input
                    type="text"
                    defaultValue={loc.address?.city ?? ""}
                    style={inputStyle}
                  />
                </FormField>
                <FormField label="Estado">
                  <input
                    type="text"
                    defaultValue={loc.address?.state ?? ""}
                    style={inputStyle}
                  />
                </FormField>
                <FormField label="Codigo postal">
                  <input
                    type="text"
                    defaultValue={loc.address?.postalCode ?? ""}
                    style={inputStyle}
                  />
                </FormField>
                <FormField label="Pais">
                  <input
                    type="text"
                    defaultValue={loc.address?.countryCode ?? "MX"}
                    style={{ ...inputStyle, fontFamily: "var(--mono)" }}
                  />
                </FormField>
              </div>
            </div>
          )}

          {/* Read-only tabs */}
          {currentTab === "location" && (
            <ReadOnlyBlock
              title="Ubicacion geografica"
              message="Solo se define al crear el lugar. Si necesitas cambiar la ubicacion, crea un nuevo lugar."
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "1rem",
                }}
              >
                <FormField label="Latitud">
                  <input
                    type="text"
                    value={loc.latitude.toFixed(6)}
                    readOnly
                    style={{
                      ...inputStyle,
                      fontFamily: "var(--mono)",
                      opacity: 0.6,
                    }}
                  />
                </FormField>
                <FormField label="Longitud">
                  <input
                    type="text"
                    value={loc.longitude.toFixed(6)}
                    readOnly
                    style={{
                      ...inputStyle,
                      fontFamily: "var(--mono)",
                      opacity: 0.6,
                    }}
                  />
                </FormField>
              </div>
            </ReadOnlyBlock>
          )}

          {currentTab === "classification" && (
            <ReadOnlyBlock
              title="Clasificacion"
              message="Solo se define al crear el lugar. Para cambiar la categoria o tags, crea un nuevo lugar."
            >
              {loc.locationCategories &&
                loc.locationCategories.length > 0 && (
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "0.5rem",
                      marginTop: "0.5rem",
                    }}
                  >
                    {loc.locationCategories.map((lc) => (
                      <span
                        key={lc.categoryId}
                        style={{
                          padding: "4px 12px",
                          borderRadius: "6px",
                          background:
                            "color-mix(in srgb, var(--primary) 8%, transparent)",
                          color: "var(--primary)",
                          fontSize: "0.85rem",
                          fontWeight: 600,
                        }}
                      >
                        {lc.category?.name ?? "Categoria"}
                      </span>
                    ))}
                  </div>
                )}
              {loc.locationTags && loc.locationTags.length > 0 && (
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "0.35rem",
                    marginTop: "0.5rem",
                  }}
                >
                  {loc.locationTags.map((lt) => (
                    <span
                      key={lt.tagId}
                      style={{
                        padding: "2px 8px",
                        borderRadius: "4px",
                        background:
                          "color-mix(in srgb, var(--primary) 8%, transparent)",
                        color: "var(--primary)",
                        fontFamily: "var(--mono)",
                        fontSize: "0.75rem",
                      }}
                    >
                      {lt.tag?.name ?? lt.tagId.slice(0, 8)}
                    </span>
                  ))}
                </div>
              )}
            </ReadOnlyBlock>
          )}

          {currentTab === "hours" && (
            <ReadOnlyBlock
              title="Horarios de atencion"
              message="Solo se definen al crear el lugar. Si necesitas actualizar los horarios, crea un nuevo lugar."
            >
              {loc.openingHours && loc.openingHours.length > 0 ? (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.3rem",
                    marginTop: "0.5rem",
                  }}
                >
                  {loc.openingHours.map((oh) => (
                    <div
                      key={oh.id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: "0.85rem",
                        fontFamily: "var(--mono)",
                        color: oh.isClosed
                          ? "var(--ink-muted)"
                          : "var(--ink)",
                        padding: "0.25rem 0",
                        borderBottom: "1px solid var(--border)",
                      }}
                    >
                      <span>{oh.dayOfWeek.slice(0, 3)}</span>
                      <span>
                        {oh.isClosed
                          ? "Cerrado"
                          : `${oh.opensAt} - ${oh.closesAt}`}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p
                  style={{
                    fontSize: "0.85rem",
                    color: "var(--ink-muted)",
                    fontStyle: "italic",
                  }}
                >
                  Sin horarios registrados
                </p>
              )}
            </ReadOnlyBlock>
          )}

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
                  <input
                    type="radio"
                    name="status"
                    value="Draft"
                    defaultChecked={loc.status === "Draft"}
                  />
                  Borrador
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
                  <input
                    type="radio"
                    name="status"
                    value="Published"
                    defaultChecked={loc.status === "Published"}
                  />
                  Publicado
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
                  <input
                    type="radio"
                    name="status"
                    value="Archived"
                    defaultChecked={loc.status === "Archived"}
                  />
                  Archivado
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
                <input
                  type="checkbox"
                  defaultChecked={loc.isPublic}
                />
                Visible en busquedas publicas
              </label>
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
              disabled={editMutation.isPending}
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
              {editMutation.isPending
                ? "Guardando…"
                : "Guardar cambios"}
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

function ReadOnlyBlock({
  title,
  message,
  children,
}: {
  title: string;
  message: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "0.75rem",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
        }}
      >
        <Lock size={16} style={{ color: "var(--ink-muted)" }} />
        <h3
          style={{
            fontFamily: "var(--display)",
            fontSize: "1rem",
            fontWeight: 600,
            color: "var(--ink)",
            margin: 0,
          }}
        >
          {title}
        </h3>
      </div>

      <div
        style={{
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
          {message}
        </p>
      </div>

      {children}
    </div>
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
