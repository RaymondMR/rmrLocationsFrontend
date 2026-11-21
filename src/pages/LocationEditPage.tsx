import { useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import type { FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { isAxiosError } from "axios";
import { toast } from "sonner";
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
import LocationPickerLazy from "@/components/locations/LocationPickerLazy";
import OpeningHoursDisplay from "@/components/locations/OpeningHoursDisplay";
import api from "@/lib/axios";
import { useAuthStore } from "@/stores/auth-store";
import { useUpdateLocation } from "@/hooks/use-locations";
import { locationEditSchema } from "@/types/forms";
import type { LocationEditValues } from "@/types/forms";
import type { Location } from "@/types/models";
import { buildLocationUpdatePayload } from "@/lib/location-payload";
import { getApiErrorMessage } from "@/lib/api-error";

/* ────────────────────────────────────────────── */
/*  Tabs definitions                              */
/* ────────────────────────────────────────────── */
type TabId =
  | "info"
  | "address"
  | "location"
  | "classification"
  | "hours"
  | "publish";

interface TabDef {
  id: TabId;
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

/**
 * Claves de primer nivel del formulario que muestra cada pestaña editable (las de solo
 * lectura no tienen campos). Sirve para saltar a la pestaña correcta cuando la
 * validación falla fuera de la vista y para marcar con un punto rojo las que tienen errores.
 */
const TAB_FIELDS: Partial<Record<TabId, ReadonlyArray<keyof LocationEditValues>>> = {
  info: ["name", "slug", "description", "websiteUrl", "phoneNumber"],
  address: ["address"],
  publish: ["status", "isPublic"],
};

function toEditDefaults(loc: Location): LocationEditValues {
  return {
    name: loc.name,
    slug: loc.slug,
    description: loc.description ?? "",
    websiteUrl: loc.websiteUrl ?? "",
    phoneNumber: loc.phoneNumber ?? "",
    address: {
      // `name` no tiene campo en pantalla, pero DEBE reenviarse: el PUT reemplaza la
      // dirección completa y, si faltara, el servidor la borraría.
      name: loc.address?.name ?? "",
      street: loc.address?.street ?? "",
      exteriorNumber: loc.address?.exteriorNumber ?? "",
      interiorNumber: loc.address?.interiorNumber ?? "",
      neighborhood: loc.address?.neighborhood ?? "",
      city: loc.address?.city ?? "",
      state: loc.address?.state ?? "",
      postalCode: loc.address?.postalCode ?? "",
      countryCode: loc.address?.countryCode ?? "",
    },
    status: loc.status,
    isPublic: loc.isPublic,
  };
}

/* ────────────────────────────────────────────── */
/*  LocationEditPage                              */
/* ────────────────────────────────────────────── */
export default function LocationEditPage() {
  const { id } = useParams<{ id: string }>();
  const userId = useAuthStore((s) => s.userId);
  const roles = useAuthStore((s) => s.roles);

  /* ── Fetch existing location ──────────────── */
  const locationQuery = useQuery({
    queryKey: ["locations", id],
    queryFn: () =>
      api.get<Location>(`/api/location/${id}`).then((r) => r.data),
    enabled: !!id,
    staleTime: 30_000,
    retry: false,
  });

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

  const loc = locationQuery.data;

  if (locationQuery.isError || !loc) {
    return (
      <ErrorState
        message={
          locationQuery.isError
            ? getApiErrorMessage(locationQuery.error, "el lugar")
            : "No pudimos cargar la informacion del lugar"
        }
        onRetry={() => locationQuery.refetch()}
      />
    );
  }

  // Solo el dueño o un administrador pueden editar (el API responde 403 al resto).
  const isOwner =
    !!userId && loc.ownerId.toLowerCase() === userId.toLowerCase();
  if (!isOwner && !roles.includes("Admin")) {
    return (
      <ErrorState
        title="Sin permisos"
        message="Solo el dueño del lugar o un administrador puede editarlo."
      />
    );
  }

  // El formulario vive en un componente aparte para inicializarlo con los datos ya
  // cargados (defaultValues solo se lee en el primer render).
  return <LocationEditForm key={loc.id} loc={loc} />;
}

/* ────────────────────────────────────────────── */
/*  LocationEditForm                              */
/* ────────────────────────────────────────────── */
function LocationEditForm({ loc }: { loc: Location }) {
  const navigate = useNavigate();
  const [currentTab, setCurrentTab] = useState<TabId>("info");
  const updateLocation = useUpdateLocation(loc.id);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LocationEditValues>({
    resolver: zodResolver(locationEditSchema),
    defaultValues: toEditDefaults(loc),
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

  const tabHasError = (id: TabId) =>
    (TAB_FIELDS[id] ?? []).some((field) => Boolean(errors[field]));

  /* ── Submit ───────────────────────────────── */
  const onSubmit = async (values: LocationEditValues) => {
    try {
      await updateLocation.mutateAsync(buildLocationUpdatePayload(values, loc));
      // El hook ya muestra "Lugar actualizado" e invalida ["locations"].
      navigate(`/locations/${loc.id}`);
    } catch (error) {
      // El slug es la única restricción de unicidad de un lugar: 409 = ya existe.
      if (
        isAxiosError(error) &&
        error.response?.status === 409 &&
        /slug/i.test(String(error.response.data?.detail ?? ""))
      ) {
        setError("slug", {
          type: "server",
          message: "Ya existe un lugar con ese slug. Prueba con otro.",
        });
        setCurrentTab("info");
        toast.error("Ya existe un lugar con ese slug.");
        return;
      }
      toast.error(getApiErrorMessage(error, "write"));
    }
  };

  // La validación puede fallar en una pestaña que no está a la vista: se salta a la
  // primera que tenga errores para que el usuario vea qué corregir.
  const onInvalid = (invalid: FieldErrors<LocationEditValues>) => {
    const firstTab = TABS.find((tab) =>
      (TAB_FIELDS[tab.id] ?? []).some((field) => Boolean(invalid[field])),
    );
    if (firstTab) {
      setCurrentTab(firstTab.id);
      toast.error(`Revisa los campos marcados en la pestaña "${firstTab.label}".`);
    } else {
      toast.error("Revisa los campos marcados en rojo.");
    }
  };

  /* ══════════════════════════════════════════════ */
  /*  RENDER                                       */
  /* ══════════════════════════════════════════════ */
  return (
    <div>
      <PageHeader title="Editar lugar" subtitle={`Editando: ${loc.name}`} />

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
              type="button"
              onClick={() => setCurrentTab(tab.id)}
              aria-current={isActive ? "step" : undefined}
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
              {tabHasError(tab.id) && (
                <span
                  role="img"
                  aria-label="Hay campos con errores"
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    background: "var(--danger)",
                    boxShadow: isActive ? "0 0 0 2px #fff" : "none",
                    flexShrink: 0,
                  }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* ── Tab content ────────────────────────── */}
      <form onSubmit={handleSubmit(onSubmit, onInvalid)} noValidate>
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
            <div style={sectionStyle}>
              <h3 style={headingStyle}>Informacion basica</h3>

              <FormField label="Nombre del lugar" required error={errors.name?.message}>
                <input
                  type="text"
                  placeholder="Nombre del lugar"
                  style={inputStyle}
                  {...register("name")}
                />
              </FormField>

              <FormField label="Slug" required error={errors.slug?.message}>
                <input
                  type="text"
                  placeholder="slug-del-lugar"
                  style={{ ...inputStyle, fontFamily: "var(--mono)" }}
                  {...register("slug")}
                />
              </FormField>

              <FormField label="Descripcion" error={errors.description?.message}>
                <textarea
                  placeholder="Describe el lugar…"
                  rows={4}
                  style={{
                    ...inputStyle,
                    resize: "vertical",
                    minHeight: "80px",
                  }}
                  {...register("description")}
                />
              </FormField>

              <FormField label="Sitio web" error={errors.websiteUrl?.message}>
                <input
                  type="url"
                  placeholder="https://…"
                  style={inputStyle}
                  {...register("websiteUrl")}
                />
              </FormField>

              <FormField label="Telefono" error={errors.phoneNumber?.message}>
                <input
                  type="tel"
                  placeholder="+52 55 …"
                  style={inputStyle}
                  {...register("phoneNumber")}
                />
              </FormField>
            </div>
          )}

          {currentTab === "address" && (
            <div style={sectionStyle}>
              <h3 style={headingStyle}>Direccion del lugar</h3>

              <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
                <FormField label="Calle" error={errors.address?.street?.message}>
                  <input
                    type="text"
                    style={inputStyle}
                    {...register("address.street")}
                  />
                </FormField>
                <FormField
                  label="Numero exterior"
                  error={errors.address?.exteriorNumber?.message}
                >
                  <input
                    type="text"
                    style={inputStyle}
                    {...register("address.exteriorNumber")}
                  />
                </FormField>
                <FormField
                  label="Numero interior"
                  error={errors.address?.interiorNumber?.message}
                >
                  <input
                    type="text"
                    style={inputStyle}
                    {...register("address.interiorNumber")}
                  />
                </FormField>
                <FormField
                  label="Colonia"
                  error={errors.address?.neighborhood?.message}
                >
                  <input
                    type="text"
                    style={inputStyle}
                    {...register("address.neighborhood")}
                  />
                </FormField>
                <FormField label="Ciudad" error={errors.address?.city?.message}>
                  <input
                    type="text"
                    style={inputStyle}
                    {...register("address.city")}
                  />
                </FormField>
                <FormField label="Estado" error={errors.address?.state?.message}>
                  <input
                    type="text"
                    style={inputStyle}
                    {...register("address.state")}
                  />
                </FormField>
                <FormField
                  label="Codigo postal"
                  error={errors.address?.postalCode?.message}
                >
                  <input
                    type="text"
                    style={inputStyle}
                    {...register("address.postalCode")}
                  />
                </FormField>
                <FormField label="Pais" error={errors.address?.countryCode?.message}>
                  <input
                    type="text"
                    maxLength={2}
                    placeholder="MX"
                    style={{ ...inputStyle, fontFamily: "var(--mono)" }}
                    {...register("address.countryCode")}
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
              {/* Mapa de solo lectura: muestra el pin; el API no permite mover un lugar ya creado. */}
              <LocationPickerLazy
                latitude={String(loc.latitude)}
                longitude={String(loc.longitude)}
                readOnly
              />
              <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
                <ReadOnlyField label="Latitud" value={loc.latitude.toFixed(6)} />
                <ReadOnlyField label="Longitud" value={loc.longitude.toFixed(6)} />
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
              {/* De lunes a domingo y sin segundos, igual que en el detalle del lugar. */}
              <OpeningHoursDisplay hours={loc.openingHours} variant="plain" />
            </ReadOnlyBlock>
          )}

          {currentTab === "publish" && (
            <div style={sectionStyle}>
              <h3 style={headingStyle}>Publicacion</h3>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.75rem",
                }}
              >
                <label style={checkLabelStyle}>
                  <input type="radio" value="Draft" {...register("status")} />
                  Borrador
                </label>
                <label style={checkLabelStyle}>
                  <input type="radio" value="Published" {...register("status")} />
                  Publicado
                </label>
                <label style={checkLabelStyle}>
                  <input type="radio" value="Archived" {...register("status")} />
                  Archivado
                </label>
              </div>

              <label style={checkLabelStyle}>
                <input type="checkbox" {...register("isPublic")} />
                Visible en busquedas publicas
              </label>
            </div>
          )}
        </div>

        {/* ── Navigation buttons ──────────────── */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "0.75rem",
          }}
        >
          <button
            type="button"
            onClick={goPrev}
            disabled={!hasPrev}
            style={secondaryButtonStyle(hasPrev)}
          >
            <ChevronLeft size={16} />
            Anterior
          </button>

          {/* "Guardar cambios" está en TODAS las pestañas: el formulario es uno solo y los
              campos de las pestañas que no se ven conservan su valor. */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "flex-end",
              // A la derecha también cuando, en pantallas estrechas, pasa a la fila de abajo.
              marginLeft: "auto",
              gap: "0.5rem",
            }}
          >
            {hasNext && (
              <button
                type="button"
                onClick={goNext}
                style={secondaryButtonStyle(true)}
              >
                Siguiente
                <ChevronRight size={16} />
              </button>
            )}
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                ...primaryButtonStyle,
                cursor: isSubmitting ? "not-allowed" : "pointer",
                opacity: isSubmitting ? 0.6 : 1,
              }}
              onMouseEnter={(e) => {
                if (!isSubmitting)
                  (e.currentTarget as HTMLElement).style.opacity = "0.9";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.opacity = isSubmitting
                  ? "0.6"
                  : "1";
              }}
            >
              <Save size={16} />
              {isSubmitting ? "Guardando…" : "Guardar cambios"}
            </button>
          </div>
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
  error?: string;
  children: React.ReactNode;
}

function FormField({ label, required, error, children }: FormFieldProps) {
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
      {error && (
        <span role="alert" style={errorTextStyle}>
          {error}
        </span>
      )}
    </label>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <FormField label={label}>
      <input
        type="text"
        value={value}
        readOnly
        style={{
          ...inputStyle,
          fontFamily: "var(--mono)",
          opacity: 0.6,
        }}
      />
    </FormField>
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
        <h3 style={headingStyle}>{title}</h3>
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

const sectionStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "1rem",
};

const headingStyle: React.CSSProperties = {
  fontFamily: "var(--display)",
  fontSize: "1rem",
  fontWeight: 600,
  color: "var(--ink)",
  margin: 0,
};

const checkLabelStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "0.5rem",
  cursor: "pointer",
  fontSize: "0.85rem",
  color: "var(--ink)",
};

const errorTextStyle: React.CSSProperties = {
  color: "var(--danger)",
  fontSize: "0.78rem",
};

const primaryButtonStyle: React.CSSProperties = {
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
};

/** Botón de navegación (Anterior / Siguiente): contorno, sin relleno. */
function secondaryButtonStyle(enabled: boolean): React.CSSProperties {
  return {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.35rem",
    padding: "10px 18px",
    borderRadius: "8px",
    border: "1px solid var(--border)",
    background: "var(--surface)",
    color: enabled ? "var(--ink)" : "var(--ink-muted)",
    cursor: enabled ? "pointer" : "not-allowed",
    fontFamily: "var(--sans)",
    fontSize: "0.85rem",
    fontWeight: 500,
    opacity: enabled ? 1 : 0.5,
  };
}
