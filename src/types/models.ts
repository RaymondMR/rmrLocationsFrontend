export type Guid = string;

export interface GeoJSONPoint {
  type: "Point";
  coordinates: [number, number]; // [longitud, latitud] — ⚠️ orden GeoJSON
}

export type LocationStatus = "Draft" | "Published" | "Archived";
export type MediaType = "Image" | "Video";
export type CollectionVisibility = "Private" | "Unlisted" | "Public";
export type DayOfWeekName =
  | "Sunday" | "Monday" | "Tuesday" | "Wednesday"
  | "Thursday" | "Friday" | "Saturday";
export type RoleName = "Admin" | "User" | "UserL1" | "UserL2" | "UserL3";

/** Campos de auditoría presentes en todos los agregados raíz. */
interface Auditable {
  createdAtUtc: string;
  updatedAtUtc?: string | null;
  isDeleted: boolean;
  deletedAtUtc?: string | null;
  version: number; // xmin — solo lectura, NUNCA enviar en writes
}

export interface Address {
  name?: string | null;
  street?: string | null;
  exteriorNumber?: string | null;
  interiorNumber?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  countryCode?: string | null;
}

export interface Location extends Auditable {
  id: Guid;
  name: string;
  slug: string;
  description?: string | null;
  coordinates: GeoJSONPoint;
  address: Address;
  status: LocationStatus;
  isPublic: boolean;
  websiteUrl?: string | null;
  phoneNumber?: string | null;
  averageRating: number;
  reviewCount: number;
  ownerId: Guid;
  owner?: ApiUser | null;
  locationCategories?: LocationCategory[];
  locationTags?: LocationTag[];
  media?: LocationMedia[];
  reviews?: Review[];
  openingHours?: OpeningHour[];
  latitude: number;
  longitude: number;
}

export interface LocationCategory {
  locationId: Guid;
  categoryId: Guid;
  category?: Category | null;
  isPrimary: boolean;
  createdAtUtc: string;
}

export interface LocationTag {
  locationId: Guid;
  tagId: Guid;
  tag?: Tag | null;
  addedByUserId?: Guid | null;
  createdAtUtc: string;
}

export interface Category extends Auditable {
  id: Guid;
  name: string;
  slug: string;
  description?: string | null;
  iconName?: string | null;
  colorHex?: string | null;
  sortOrder: number;
  parentCategoryId?: Guid | null;
  parentCategory?: Category | null;
  children?: Category[];
  locationCategories?: LocationCategory[];
}

export interface Tag extends Auditable {
  id: Guid;
  name: string;
  slug: string;
  description?: string | null;
  usageCount: number;
  locationTags?: LocationTag[];
}

export interface Review extends Auditable {
  id: Guid;
  locationId: Guid;
  location?: Location | null;
  userId: Guid;
  user?: ApiUser | null;
  rating: number;
  title?: string | null;
  body?: string | null;
  visitedOn?: string | null;
}

export interface LocationMedia extends Auditable {
  id: Guid;
  locationId: Guid;
  url: string;
  thumbnailUrl?: string | null;
  caption?: string | null;
  type: MediaType;
  isCover: boolean;
  sortOrder: number;
  uploadedByUserId?: Guid | null;
}

export interface LocationCollection extends Auditable {
  id: Guid;
  name: string;
  description?: string | null;
  visibility: CollectionVisibility;
  ownerId: Guid;
  owner?: ApiUser | null;
  items?: CollectionItem[];
}

export interface CollectionItem {
  collectionId: Guid;
  locationId: Guid;
  location?: Location | null;
  sortOrder: number;
  notes?: string | null;
  createdAtUtc: string;
}

export interface OpeningHour {
  id: Guid;
  locationId: Guid;
  dayOfWeek: DayOfWeekName;
  opensAt: string;
  closesAt: string;
  isClosed: boolean;
}

export interface ApiUser {
  id: Guid;
  userName: string;
  displayName?: string | null;
  avatarUrl?: string | null;
}

// ---- DTOs de auth ----
export interface RegisterRequest { userName: string; email: string; password: string; }
export interface LoginRequest { userName: string; email: string; password: string; }
export interface TokenResponse { accessToken: string; refreshToken: string; }
export interface RefreshRequest { userId: Guid; refreshToken: string; }
export interface ChangePasswordRequest { currentPassword: string; newPassword: string; }
export interface RegisteredUser { id: Guid; userName: string; email: string; roles: RoleName[]; }

// ---- Respuestas compuestas ----
export interface NearbyResult { location: Location; distanceMeters: number; }

export interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface JwtPayload {
  sub: Guid;
  name: string;
  jti: string;
  role?: RoleName | RoleName[];
  exp: number; iss: string; aud: string;
}

export interface AddCollectionItemRequest { locationId: Guid; notes?: string | null; }

export interface ProblemDetails { type?: string; title?: string; status?: number; detail?: string; }
export interface ValidationProblemDetails extends ProblemDetails {
  errors?: Record<string, string[]>;
}
