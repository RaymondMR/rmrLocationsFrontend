import { z } from "zod";

export const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const loginSchema = z.object({
  userName: z.string().min(1, "Escribe tu usuario"),
  password: z.string().min(1, "Escribe tu contraseña"),
});

export const registerSchema = z.object({
  userName: z.string().min(3, "Mínimo 3 caracteres").max(64),
  email: z.string().email("Email inválido").max(256),
  password: z.string().min(8, "Mínimo 8 caracteres"),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword,
  { path: ["confirmPassword"], message: "Las contraseñas no coinciden" });

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8, "Mínimo 8 caracteres"),
  confirmPassword: z.string(),
}).refine(d => d.newPassword === d.confirmPassword,
  { path: ["confirmPassword"], message: "Las contraseñas no coinciden" });

export const addressSchema = z.object({
  name: z.string().max(200).optional().or(z.literal("")),
  street: z.string().max(200).optional().or(z.literal("")),
  exteriorNumber: z.string().max(20).optional().or(z.literal("")),
  interiorNumber: z.string().max(20).optional().or(z.literal("")),
  neighborhood: z.string().max(120).optional().or(z.literal("")),
  city: z.string().max(120).optional().or(z.literal("")),
  state: z.string().max(120).optional().or(z.literal("")),
  postalCode: z.string().max(20).optional().or(z.literal("")),
  countryCode: z.string().length(2, "Código de 2 letras").optional().or(z.literal("")),
});

export const locationSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio").max(200),
  slug: z.string().min(1).max(220).regex(slugRegex, "Solo minúsculas, números y guiones"),
  description: z.string().max(4000).optional().or(z.literal("")),
  coordinates: z.object({
    type: z.literal("Point"),
    coordinates: z.tuple([z.number().min(-180).max(180), z.number().min(-90).max(90)]),
  }),
  address: addressSchema,
  status: z.enum(["Draft", "Published", "Archived"]),
  isPublic: z.boolean(),
  websiteUrl: z.string().url("URL inválida").max(2048).optional().or(z.literal("")),
  phoneNumber: z.string().max(32).optional().or(z.literal("")),
});

// ---------------------------------------------------------------------------
// Formulario "Nuevo lugar" (LocationNewPage)
//
// Los inputs HTML entregan texto, así que latitud y longitud viajan como string y
// se convierten a número al armar el payload (lib/location-payload.ts).
// El backend NO valida campos vacíos ni rangos (acepta name:"" y coordenadas como
// [-999, 95]), así que toda esa validación vive aquí.
// ---------------------------------------------------------------------------

export const DAY_OF_WEEK_VALUES = [
  "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday",
] as const;

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

/** Solo http(s): el valor se renderiza como href en el detalle del lugar. */
function isHttpUrl(value: string): boolean {
  if (!/^https?:\/\//i.test(value)) return false;
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

function coordinateField(label: string, min: number, max: number) {
  return z
    .string()
    .refine((v) => v.trim() !== "", `${label} es obligatoria`)
    .refine((v) => {
      if (v.trim() === "") return true; // el caso vacío ya lo reporta la regla anterior
      const n = Number(v);
      return Number.isFinite(n) && n >= min && n <= max;
    }, `${label} debe ser un número entre ${min} y ${max}`);
}

export const locationFormSchema = z
  .object({
    name: z.string().trim().min(1, "El nombre es obligatorio").max(200, "Máximo 200 caracteres"),
    slug: z
      .string()
      .min(1, "El slug es obligatorio")
      .max(220, "Máximo 220 caracteres")
      .regex(slugRegex, "Solo minúsculas, números y guiones"),
    description: z.string().max(4000, "Máximo 4000 caracteres"),
    websiteUrl: z
      .string()
      .max(2048, "Máximo 2048 caracteres")
      .refine((v) => v.trim() === "" || isHttpUrl(v.trim()), "URL inválida: debe empezar con http:// o https://"),
    phoneNumber: z.string().max(32, "Máximo 32 caracteres"),
    address: addressSchema,
    latitude: coordinateField("La latitud", -90, 90),
    longitude: coordinateField("La longitud", -180, 180),
    categoryId: z.string(),
    tagIds: z.array(z.string()),
    // Si es false no se envía ningún horario (el detalle muestra "—" en cada día).
    defineHours: z.boolean(),
    openingHours: z.array(
      z.object({
        dayOfWeek: z.enum(DAY_OF_WEEK_VALUES),
        opensAt: z.string(),
        closesAt: z.string(),
        isClosed: z.boolean(),
      }),
    ),
    status: z.enum(["Draft", "Published"]),
    isPublic: z.boolean(),
  })
  .superRefine((values, ctx) => {
    if (!values.defineHours) return;
    values.openingHours.forEach((hour, index) => {
      if (hour.isClosed) return;
      for (const field of ["opensAt", "closesAt"] as const) {
        if (!timeRegex.test(hour[field])) {
          ctx.addIssue({
            code: "custom",
            path: ["openingHours", index, field],
            message: "Hora inválida",
          });
        }
      }
    });
  });

// Edición de un lugar (LocationEditPage): reutiliza las reglas de información básica y
// dirección del formulario de alta. Ubicación, clasificación y horarios no se editan
// (el PUT del API los ignora) y, a diferencia del alta, el estado admite "Archived".
const locationBase = locationFormSchema.shape;

export const locationEditSchema = z.object({
  name: locationBase.name,
  slug: locationBase.slug,
  description: locationBase.description,
  websiteUrl: locationBase.websiteUrl,
  phoneNumber: locationBase.phoneNumber,
  address: locationBase.address,
  status: z.enum(["Draft", "Published", "Archived"]),
  isPublic: z.boolean(),
});

export const categorySchema = z.object({
  name: z.string().min(1).max(120),
  slug: z.string().min(1).max(140).regex(slugRegex),
  description: z.string().max(1000).optional().or(z.literal("")),
  iconName: z.string().max(64).optional().or(z.literal("")),
  colorHex: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Formato #RRGGBB").optional().or(z.literal("")),
  sortOrder: z.number().int().min(0),
  parentCategoryId: z.string().uuid().optional().or(z.literal("")),
});

export const tagSchema = z.object({
  name: z.string().min(1).max(60),
  slug: z.string().min(1).max(80).regex(slugRegex),
  description: z.string().max(500).optional().or(z.literal("")),
});

export const reviewSchema = z.object({
  rating: z.number().int().min(1, "Elige una calificación").max(5),
  title: z.string().max(200).optional().or(z.literal("")),
  body: z.string().max(4000).optional().or(z.literal("")),
  visitedOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal("")),
});

export const collectionSchema = z.object({
  name: z.string().min(1).max(150),
  description: z.string().max(1000).optional().or(z.literal("")),
  visibility: z.enum(["Private", "Unlisted", "Public"]),
});

// Medios de un lugar (MediaFormDialog). Solo URLs http(s): la dirección se pinta en <img src> y se guarda
// tal cual; con z.string().url() valía cualquier esquema (javascript:, data:, ftp:…).
export const mediaSchema = z.object({
  url: z
    .string()
    .trim()
    .min(1, "La URL es obligatoria")
    .max(2048, "Máximo 2048 caracteres")
    .refine(isHttpUrl, "URL inválida: debe empezar con http:// o https://"),
  thumbnailUrl: z
    .string()
    .max(2048, "Máximo 2048 caracteres")
    .refine((v) => v.trim() === "" || isHttpUrl(v.trim()), "URL inválida: debe empezar con http:// o https://"),
  caption: z.string().max(300, "Máximo 300 caracteres"),
  type: z.enum(["Image", "Video"]),
  isCover: z.boolean(),
  sortOrder: z
    .number({ message: "Escribe un número entero" })
    .int("Debe ser un número entero")
    .min(0, "No puede ser negativo"),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;
export type AddressFormData = z.infer<typeof addressSchema>;
export type LocationFormData = z.infer<typeof locationSchema>;
export type LocationFormValues = z.infer<typeof locationFormSchema>;
export type LocationEditValues = z.infer<typeof locationEditSchema>;
export type CategoryFormData = z.infer<typeof categorySchema>;
export type TagFormData = z.infer<typeof tagSchema>;
export type ReviewFormData = z.infer<typeof reviewSchema>;
export type CollectionFormData = z.infer<typeof collectionSchema>;
export type MediaFormData = z.infer<typeof mediaSchema>;
