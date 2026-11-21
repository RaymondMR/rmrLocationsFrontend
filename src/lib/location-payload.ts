import { toGeoJSON } from "@/lib/geo";
import type { LocationFormValues } from "@/types/forms";
import type { Address, CreateLocationRequest } from "@/types/models";

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

/** Convierte los valores validados del formulario en el cuerpo de POST /api/location. */
export function buildLocationPayload(values: LocationFormValues): CreateLocationRequest {
  const address: Address = {
    name: clean(values.address.name),
    street: clean(values.address.street),
    exteriorNumber: clean(values.address.exteriorNumber),
    interiorNumber: clean(values.address.interiorNumber),
    neighborhood: clean(values.address.neighborhood),
    city: clean(values.address.city),
    state: clean(values.address.state),
    postalCode: clean(values.address.postalCode),
    countryCode: clean(values.address.countryCode),
  };

  return {
    name: values.name.trim(),
    slug: values.slug,
    description: clean(values.description),
    // Lat/lng llegan como texto ya validado; toGeoJSON aplica el orden [lng, lat].
    coordinates: toGeoJSON(Number(values.latitude), Number(values.longitude)),
    address,
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
