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

export const mediaSchema = z.object({
  url: z.string().url("URL inválida").max(2048),
  thumbnailUrl: z.string().url().max(2048).optional().or(z.literal("")),
  caption: z.string().max(300).optional().or(z.literal("")),
  type: z.enum(["Image", "Video"]),
  isCover: z.boolean(),
  sortOrder: z.number().int().min(0),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;
export type AddressFormData = z.infer<typeof addressSchema>;
export type LocationFormData = z.infer<typeof locationSchema>;
export type CategoryFormData = z.infer<typeof categorySchema>;
export type TagFormData = z.infer<typeof tagSchema>;
export type ReviewFormData = z.infer<typeof reviewSchema>;
export type CollectionFormData = z.infer<typeof collectionSchema>;
export type MediaFormData = z.infer<typeof mediaSchema>;
