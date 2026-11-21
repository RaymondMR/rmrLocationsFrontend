import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Controller, useForm } from "react-hook-form";
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
} from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import { useCategories } from "@/hooks/use-categories";
import { useTags } from "@/hooks/use-tags";
import { useCreateLocation } from "@/hooks/use-locations";
import { locationFormSchema } from "@/types/forms";
import type { LocationFormValues } from "@/types/forms";
import type { Category, DayOfWeekName } from "@/types/models";
import { buildLocationPayload } from "@/lib/location-payload";
import { COMMON_COUNTRIES } from "@/lib/constants";
import { getApiErrorMessage } from "@/lib/api-error";
import { slugify } from "@/lib/slug";

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

/**
 * Claves de primer nivel del formulario que muestra cada pestaña. Sirve para saltar a
 * la pestaña correcta cuando la validación falla en un campo que no está a la vista y
 * para marcar con un punto rojo las pestañas que tienen errores.
 */
const TAB_FIELDS: Record<TabId, ReadonlyArray<keyof LocationFormValues>> = {
  info: ["name", "slug", "description", "websiteUrl", "phoneNumber"],
  address: ["address"],
  location: ["latitude", "longitude"],
  classification: ["categoryId", "tagIds"],
  hours: ["defineHours", "openingHours"],
  publish: ["status", "isPublic"],
};

const DAYS: { value: DayOfWeekName; label: string }[] = [
  { value: "Monday", label: "Lunes" },
  { value: "Tuesday", label: "Martes" },
  { value: "Wednesday", label: "Miercoles" },
  { value: "Thursday", label: "Jueves" },
  { value: "Friday", label: "Viernes" },
  { value: "Saturday", label: "Sabado" },
  { value: "Sunday", label: "Domingo" },
];

const DEFAULT_VALUES: LocationFormValues = {
  name: "",
  slug: "",
  description: "",
  websiteUrl: "",
  phoneNumber: "",
  address: {
    name: "",
    street: "",
    exteriorNumber: "",
    interiorNumber: "",
    neighborhood: "",
    city: "",
    state: "",
    postalCode: "",
    countryCode: "MX",
  },
  latitude: "",
  longitude: "",
  categoryId: "",
  tagIds: [],
  // Los horarios son opcionales: mientras no se active "Definir horarios" no se envía ninguno.
  defineHours: false,
  openingHours: DAYS.map((day) => ({
    dayOfWeek: day.value,
    opensAt: "09:00",
    closesAt: "18:00",
    isClosed: false,
  })),
  status: "Draft",
  isPublic: true,
};

/* ────────────────────────────────────────────── */
/*  LocationNewPage                               */
/* ────────────────────────────────────────────── */
export default function LocationNewPage() {
  const navigate = useNavigate();
  const [currentTab, setCurrentTab] = useState<TabId>("info");
  // ¿El usuario editó el slug a mano? Si no, se autogenera a partir del nombre.
  const [slugTouched, setSlugTouched] = useState(false);

  const categoriesQuery = useCategories();
  const tagsQuery = useTags();
  const createLocation = useCreateLocation();

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    setError,
    formState: { errors, isSubmitting, isSubmitted },
  } = useForm<LocationFormValues>({
    resolver: zodResolver(locationFormSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const defineHours = watch("defineHours");
  const hours = watch("openingHours");

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
    TAB_FIELDS[id].some((field) => Boolean(errors[field]));

  /* ── Submit ───────────────────────────────── */
  const onSubmit = async (values: LocationFormValues) => {
    try {
      const created = await createLocation.mutateAsync(
        buildLocationPayload(values),
      );
      // El hook ya muestra "Lugar creado" e invalida ["locations"].
      navigate(`/locations/${created.id}`);
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
      toast.error(getApiErrorMessage(error));
    }
  };

  // La validación puede fallar en una pestaña que no está a la vista: se salta a la
  // primera que tenga errores para que el usuario vea qué corregir.
  const onInvalid = (invalid: FieldErrors<LocationFormValues>) => {
    const firstTab = TABS.find((tab) =>
      TAB_FIELDS[tab.id].some((field) => Boolean(invalid[field])),
    );
    if (firstTab) {
      setCurrentTab(firstTab.id);
      toast.error(`Revisa los campos marcados en la pestaña "${firstTab.label}".`);
    } else {
      toast.error("Revisa los campos marcados en rojo.");
    }
  };

  /* ── Datos de clasificación ───────────────── */
  const categories = [...(categoriesQuery.data ?? [])].sort(
    (a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, "es"),
  );
  const categoryLabel = (category: Category) => {
    const parent = category.parentCategoryId
      ? categories.find((c) => c.id === category.parentCategoryId)
      : undefined;
    return parent ? `${parent.name} › ${category.name}` : category.name;
  };
  const tags = tagsQuery.data ?? [];

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
          {/* ══ Info tab ══════════════════════════ */}
          {currentTab === "info" && (
            <div style={sectionStyle}>
              <h3 style={headingStyle}>Informacion basica</h3>

              <FormField label="Nombre del lugar" required error={errors.name?.message}>
                <input
                  type="text"
                  placeholder="Ej: Cafe de la Esquina"
                  style={inputStyle}
                  // El slug se deriva del nombre mientras el usuario no lo edite a mano.
                  // Va en el onChange y NO en un efecto: un efecto que dependiera de
                  // isSubmitted volvería a validar el slug al terminar el envío y borraría
                  // el error 409 ("el slug ya existe") que acabamos de marcar.
                  {...register("name", {
                    onChange: (event) => {
                      if (!slugTouched) {
                        setValue("slug", slugify(event.target.value), {
                          shouldValidate: isSubmitted,
                        });
                      }
                    },
                  })}
                />
              </FormField>

              <FormField label="Slug" required error={errors.slug?.message}>
                <input
                  type="text"
                  placeholder="Ej: cafe-de-la-esquina"
                  style={{ ...inputStyle, fontFamily: "var(--mono)" }}
                  // RHF ejecuta su onChange interno (valor + validación) y además este
                  // callback, que marca el slug como editado a mano.
                  {...register("slug", { onChange: () => setSlugTouched(true) })}
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
                    fontFamily: "var(--sans)",
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

          {/* ══ Address tab ════════════════════════ */}
          {currentTab === "address" && (
            <div style={sectionStyle}>
              <h3 style={headingStyle}>Direccion del lugar</h3>

              <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
                <FormField label="Calle" error={errors.address?.street?.message}>
                  <input
                    type="text"
                    placeholder="Calle"
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
                    placeholder="123"
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
                    placeholder="Apto 4B"
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
                    placeholder="Col. Centro"
                    style={inputStyle}
                    {...register("address.neighborhood")}
                  />
                </FormField>
                <FormField label="Ciudad" error={errors.address?.city?.message}>
                  <input
                    type="text"
                    placeholder="Ciudad de Mexico"
                    style={inputStyle}
                    {...register("address.city")}
                  />
                </FormField>
                <FormField label="Estado" error={errors.address?.state?.message}>
                  <input
                    type="text"
                    placeholder="CDMX"
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
                    placeholder="06600"
                    style={inputStyle}
                    {...register("address.postalCode")}
                  />
                </FormField>
                <FormField label="Pais" error={errors.address?.countryCode?.message}>
                  <select style={selectStyle} {...register("address.countryCode")}>
                    {COMMON_COUNTRIES.map((country) => (
                      <option key={country.code} value={country.code}>
                        {country.name}
                      </option>
                    ))}
                  </select>
                </FormField>
              </div>
            </div>
          )}

          {/* ══ Location tab ════════════════════════ */}
          {currentTab === "location" && (
            <div style={sectionStyle}>
              <h3 style={headingStyle}>Ubicacion geografica</h3>

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
                  Haz clic en el mapa para marcar la posicion del lugar.
                  (Disponible en una proxima fase) Mientras tanto, escribe la
                  latitud y la longitud en los campos de abajo.
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
                <FormField label="Latitud" required error={errors.latitude?.message}>
                  <input
                    type="number"
                    step="any"
                    placeholder="19.4326"
                    style={{ ...inputStyle, fontFamily: "var(--mono)" }}
                    {...register("latitude")}
                  />
                </FormField>
                <FormField label="Longitud" required error={errors.longitude?.message}>
                  <input
                    type="number"
                    step="any"
                    placeholder="-99.1332"
                    style={{ ...inputStyle, fontFamily: "var(--mono)" }}
                    {...register("longitude")}
                  />
                </FormField>
              </div>
            </div>
          )}

          {/* ══ Classification tab ════════════════════ */}
          {currentTab === "classification" && (
            <div style={sectionStyle}>
              <h3 style={headingStyle}>Clasificacion</h3>

              <FormField label="Categoria principal" error={errors.categoryId?.message}>
                <select
                  style={selectStyle}
                  disabled={categoriesQuery.isLoading}
                  {...register("categoryId")}
                >
                  <option value="">
                    {categoriesQuery.isLoading
                      ? "Cargando categorias…"
                      : "Sin categoria (opcional)"}
                  </option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {categoryLabel(category)}
                    </option>
                  ))}
                </select>
              </FormField>
              {categoriesQuery.isError && (
                <LoadFailed
                  what="las categorias"
                  onRetry={() => categoriesQuery.refetch()}
                />
              )}
              {categoriesQuery.isSuccess && categories.length === 0 && (
                <InlineNote>Aun no hay categorias registradas.</InlineNote>
              )}

              <div
                style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
              >
                <span
                  style={{
                    fontSize: "0.85rem",
                    fontWeight: 500,
                    color: "var(--ink)",
                  }}
                >
                  Tags
                </span>
                {tagsQuery.isLoading && <InlineNote>Cargando tags…</InlineNote>}
                {tagsQuery.isError && (
                  <LoadFailed what="los tags" onRetry={() => tagsQuery.refetch()} />
                )}
                {tagsQuery.isSuccess && tags.length === 0 && (
                  <InlineNote>Aun no hay tags disponibles.</InlineNote>
                )}
                {tags.length > 0 && (
                  <Controller
                    control={control}
                    name="tagIds"
                    render={({ field }) => (
                      <div
                        role="group"
                        aria-label="Tags"
                        style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}
                      >
                        {tags.map((tag) => {
                          const selected = field.value.includes(tag.id);
                          return (
                            <button
                              key={tag.id}
                              type="button"
                              aria-pressed={selected}
                              onClick={() =>
                                field.onChange(
                                  selected
                                    ? field.value.filter((id) => id !== tag.id)
                                    : [...field.value, tag.id],
                                )
                              }
                              style={chipStyle(selected)}
                            >
                              {tag.name}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  />
                )}
              </div>
            </div>
          )}

          {/* ══ Hours tab ════════════════════════════ */}
          {currentTab === "hours" && (
            <div style={sectionStyle}>
              <h3 style={headingStyle}>Horarios de atencion</h3>

              <label style={checkLabelStyle}>
                <input type="checkbox" {...register("defineHours")} />
                Definir horarios de atencion
              </label>

              {!defineHours && (
                <InlineNote>
                  Si no defines horarios, el lugar se mostrara sin horario.
                </InlineNote>
              )}

              {defineHours &&
                DAYS.map((day, index) => {
                  const closed = hours[index]?.isClosed ?? false;
                  const rowErrors = errors.openingHours?.[index];
                  return (
                    <div key={day.value}>
                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          alignItems: "center",
                          gap: "0.75rem",
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
                          {day.label}
                        </span>
                        <input
                          type="time"
                          aria-label={`${day.label}: hora de apertura`}
                          disabled={closed}
                          style={{
                            ...inputStyle,
                            width: "auto",
                            flex: "1 1 110px",
                            opacity: closed ? 0.5 : 1,
                          }}
                          {...register(`openingHours.${index}.opensAt`)}
                        />
                        <span style={{ color: "var(--ink-muted)" }}>a</span>
                        <input
                          type="time"
                          aria-label={`${day.label}: hora de cierre`}
                          disabled={closed}
                          style={{
                            ...inputStyle,
                            width: "auto",
                            flex: "1 1 110px",
                            opacity: closed ? 0.5 : 1,
                          }}
                          {...register(`openingHours.${index}.closesAt`)}
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
                          <input
                            type="checkbox"
                            {...register(`openingHours.${index}.isClosed`)}
                          />
                          Cerrado
                        </label>
                      </div>
                      {(rowErrors?.opensAt || rowErrors?.closesAt) && (
                        <span role="alert" style={errorTextStyle}>
                          {day.label}: completa la hora de apertura y la de cierre.
                        </span>
                      )}
                    </div>
                  );
                })}
            </div>
          )}

          {/* ══ Publish tab ════════════════════════════ */}
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
                  Guardar como borrador
                </label>
                <label style={checkLabelStyle}>
                  <input type="radio" value="Published" {...register("status")} />
                  Publicar inmediatamente
                </label>
              </div>

              <label style={checkLabelStyle}>
                <input type="checkbox" {...register("isPublic")} />
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
              style={primaryButtonStyle}
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
              {isSubmitting ? "Guardando…" : "Guardar lugar"}
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

function InlineNote({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--ink-muted)" }}>
      {children}
    </p>
  );
}

function LoadFailed({ what, onRetry }: { what: string; onRetry: () => void }) {
  return (
    <div
      role="alert"
      style={{
        display: "flex",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "0.5rem",
        fontSize: "0.8rem",
        color: "var(--danger)",
      }}
    >
      No se pudieron cargar {what}.
      <button
        type="button"
        onClick={onRetry}
        style={{
          padding: 0,
          border: "none",
          background: "none",
          color: "var(--primary)",
          cursor: "pointer",
          fontFamily: "var(--sans)",
          fontSize: "0.8rem",
          fontWeight: 600,
          textDecoration: "underline",
        }}
      >
        Reintentar
      </button>
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

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  cursor: "pointer",
  appearance: "none",
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

function chipStyle(selected: boolean): React.CSSProperties {
  return {
    padding: "4px 12px",
    borderRadius: "999px",
    border: `1px solid ${selected ? "var(--primary)" : "var(--border)"}`,
    background: selected
      ? "color-mix(in srgb, var(--primary) 12%, transparent)"
      : "var(--background)",
    color: selected ? "var(--primary)" : "var(--ink-muted)",
    cursor: "pointer",
    fontFamily: "var(--mono)",
    fontSize: "0.78rem",
  };
}
