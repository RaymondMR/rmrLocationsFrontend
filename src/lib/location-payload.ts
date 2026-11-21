import { toGeoJSON } from "@/lib/geo";
import type { LocationEditValues, LocationFormValues } from "@/types/forms";
import type {
  Address,
  CreateLocationRequest,
  Location,
  UpdateLocationRequest,
} from "@/types/models";

/**
 * "09:00" → "09:00:00".
 * El API deserializa estas horas como TimeOnly y responde 400 si faltan los
 * segundos; <input type="time"> entrega solo "HH:mm".
 */
export function toTimeOnly(value: string): string {
  return /^\d{2}:\d{2}$/.test(value) ? `${value}:00` : value;
}

/** Texto recortado, o undefined si queda vacío (el API recibe null en vez de ""). */
function clean(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

/** Dirección sin campos vacíos; el código de país (ISO 3166-1 alpha-2) va en mayúsculas. */
function buildAddress(values: LocationFormValues["address"]): Address {
  return {
    name: clean(values.name),
    street: clean(values.street),
    exteriorNumber: clean(values.exteriorNumber),
    interiorNumber: clean(values.interiorNumber),
    neighborhood: clean(values.neighborhood),
    city: clean(values.city),
    state: clean(values.state),
    postalCode: clean(values.postalCode),
    countryCode: clean(values.countryCode)?.toUpperCase(),
  };
}

/** Convierte los valores validados del formulario en el cuerpo de POST /api/location. */
export function buildLocationPayload(values: LocationFormValues): CreateLocationRequest {
  return {
    name: values.name.trim(),
    slug: values.slug,
    description: clean(values.description),
    // Lat/lng llegan como texto ya validado; toGeoJSON aplica el orden [lng, lat].
    coordinates: toGeoJSON(Number(values.latitude), Number(values.longitude)),
    address: buildAddress(values.address),
    status: values.status,
    isPublic: values.isPublic,
    websiteUrl: clean(values.websiteUrl),
    phoneNumber: clean(values.phoneNumber),
    locationCategories: values.categoryId
      ? [{ categoryId: values.categoryId, isPrimary: true }]
      : [],
    locationTags: values.tagIds.map((tagId) => ({ tagId })),
    // Sin "Definir horarios" no se envía ninguno: así no se publican horas inventadas.
    openingHours: values.defineHours
      ? values.openingHours.map((hour) => ({
          dayOfWeek: hour.dayOfWeek,
          opensAt: hour.isClosed ? "00:00:00" : toTimeOnly(hour.opensAt),
          closesAt: hour.isClosed ? "00:00:00" : toTimeOnly(hour.closesAt),
          isClosed: hour.isClosed,
        }))
      : [],
  };
}

/** Convierte los valores validados del formulario de edición en el cuerpo de PUT /api/location/{id}. */
export function buildLocationUpdatePayload(
  values: LocationEditValues,
  location: Pick<Location, "id" | "coordinates">,
): UpdateLocationRequest {
  return {
    id: location.id,
    name: values.name.trim(),
    slug: values.slug,
    description: clean(values.description),
    // El body exige `coordinates` aunque el PUT no las modifica: se reenvían las cargadas.
    coordinates: location.coordinates,
    // El PUT reemplaza el objeto Address entero: van todos sus campos, incluido
    // address.name, que la pantalla no muestra pero llega en los defaultValues.
    address: buildAddress(values.address),
    status: values.status,
    isPublic: values.isPublic,
    websiteUrl: clean(values.websiteUrl),
    phoneNumber: clean(values.phoneNumber),
  };
}
