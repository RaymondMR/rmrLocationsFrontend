# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

`rmrLocationsFrontend` is the React frontend for the rmrLocations platform — a geo-spatial location discovery app backed by an ASP.NET API (see `rmrLocationsApi`). Users discover, review, and save places on a map. Full spec at the API repo: `FRONTEND_DESIGN_SPEC.md`.

**Stack:** React 19 · TypeScript 6 · Vite 8 · Tailwind CSS v4 · React Router v7 · TanStack Query v5 · Zustand · React Hook Form + Zod · Axios · Leaflet + react-leaflet · shadcn/ui (Radix primitives) · Lucide React · Sonner

## Commands

```bash
npm run dev       # Start dev server on port 7914
npm run build     # Vite production build (outputs to dist/)
npm run lint      # ESLint
npm run preview   # Preview production build locally
```

No tests yet.

## Architecture

```
src/
├── main.tsx              # Entry point — QueryClientProvider + BrowserRouter + App + Toaster
├── App.tsx               # All routes defined here, with ProtectedRoute for auth-gated pages
├── index.css             # Tailwind v4 import + CSS custom properties (design tokens) + font imports
│
├── types/
│   ├── models.ts         # Canonical TS types matching every API entity (Location, Review, etc.)
│   └── forms.ts          # Zod schemas for all forms (login, location, review, collection, etc.)
│
├── stores/
│   ├── auth-store.ts     # Zustand: accessToken (memory), refreshToken/userId (localStorage),
│   │                     #   userName, roles, status ("loading"|"authenticated"|"anonymous"),
│   │                     #   setTokens(access, refresh), logout(), bootstrap()
│   └── ui-store.ts       # Zustand: theme (light/dark, persisted + prefers-color-scheme), drawerOpen
│
├── lib/
│   ├── axios.ts          # Axios instance with JWT request interceptor + single-flight refresh
│   │                     #   on 401 responses (queue-based, no concurrent refresh races)
│   ├── refresh-token.ts  # Standalone refresh function for session bootstrap on app mount
│   ├── geo.ts            # toLeaflet([lng,lat]→[lat,lng]), toGeoJSON, haversineMeters, formatDistance,
│   │                     #   formatCoordinates ("19.4326° N · 99.1332° O")
│   ├── slug.ts           # slugify, formatDate (es-MX), timeAgo (Intl.RelativeTimeFormat), truncate
│   ├── constants.ts      # DEFAULT_MAP_CENTER (CDMX), DAYS_OF_WEEK, COMMON_COUNTRIES,
│   │                     #   CATEGORY_ICONS (~40 Lucide names), COLOR_SWATCHES (12 colors)
│   ├── api-error.ts      # getApiErrorMessage — maps HTTP status codes to user-friendly Spanish messages
│   └── utils.ts          # cn() helper — clsx + tailwind-merge
│
├── hooks/
│   ├── use-auth.ts        # useLogin, useRegister, useLogout, useChangePassword mutations
│   ├── use-locations.ts   # useLocations(filters), useLocation(id), useNearbyLocations, useSearchLocations
│   ├── use-categories.ts  # useCategories, useCategory, useCreateCategory, useUpdateCategory, useDeleteCategory
│   ├── use-tags.ts        # useTags, useTag, useCreateTag, useUpdateTag, useDeleteTag
│   ├── use-reviews.ts     # useReviews(locationId), useCreateReview, useUpdateReview, useDeleteReview
│   ├── use-collections.ts # useUserCollections, useCollection, useCreateCollection, useUpdate/DeleteCollection,
│   │                      #   useAddToCollection, useRemoveFromCollection
│   ├── use-media.ts       # useMedia(locationId), useCreateMedia, useUpdateMedia, useDeleteMedia
│   └── use-geolocation.ts # requestLocation() — prompts only on user gesture, states idle/granted/denied
│
├── components/
│   ├── ui/               # button, input, textarea, select, badge (CategoryBadge), dialog
│   ├── layout/           # AppShell (Navbar+Outlet+Footer), Navbar (responsive, auth-aware),
│   │                     #   Footer, Breadcrumbs
│   ├── auth/             # LoginForm, RegisterForm, ChangePasswordDialog, ProtectedRoute
│   ├── locations/        # LocationCard ("ficha cartográfica"), LocationFilters,
│   │                     #   CoordinatesLabel (copy), OpeningHoursDisplay
│   ├── reviews/          # ReviewCard, ReviewList, ReviewFormDialog, StarRating, RatingDistribution
│   ├── collections/      # CollectionCard, CollectionFormDialog, AddToCollectionDialog
│   ├── categories/       # CategoryTree (builds tree from flat list)
│   ├── tags/             # TagCloud (3-size badges by usage count)
│   ├── media/            # MediaGallery (cover + thumbnails + lightbox)
│   └── shared/           # EmptyState, ErrorState, LoadingSkeleton, ConfirmDialog, Pagination,
│                         #   PageHeader, StatusBadge, ColorPicker, CategoryIconPicker
│
└── pages/               # 16 pages — one per route (see Routes section below)
```

## Routes

| Route | Page | Access |
|---|---|---|
| `/` | HomePage | Public |
| `/login`, `/register` | Auth | Public (redirect `/` if authed) |
| `/locations` | LocationsPage (explore list/map) | Public |
| `/locations/:id` | LocationDetailPage | Public |
| `/locations/new` | LocationNewPage | Authenticated |
| `/locations/:id/edit` | LocationEditPage | Owner or Admin |
| `/categories` | CategoriesPage | Public |
| `/categories/:id` | CategoryDetailPage | Public |
| `/tags` | TagsPage | Public |
| `/tags/:id` | TagDetailPage | Public |
| `/collections` | CollectionsPage | Authenticated |
| `/collections/:id` | CollectionDetailPage | Mixed (Private→owner only) |
| `/profile` | ProfilePage | Authenticated |
| `/admin` | AdminDashboardPage | Admin only |
| `*` | NotFoundPage | Public |

## Key Patterns

### Design System ("Cartografía contemporánea")

CSS custom properties in `:root` and `.dark` define the entire theme. Colors: `--background` (papel), `--surface` (cards), `--ink` (text), `--ink-muted`, `--primary` (índigo), `--route` (naranja, CTAs only), `--rating` (ámbar), `--danger`, `--border`. Fonts: `--display` (Bricolage Grotesque, headings), `--sans` (Instrument Sans, body/UI), `--mono` (IBM Plex Mono, coordinates/technical data). Use inline `style` props referencing CSS variables for colors — not Tailwind color classes.

The `cn()` helper (`clsx` + `tailwind-merge`) is used for conditional Tailwind classes. The project skill at `.skills/React_Tailwind_Mastery/SKILL.md` documents design philosophy.

### Authentication Flow

- `accessToken` lives only in Zustand memory. `refreshToken` + `userId` persist in `localStorage` (keys `rmr.refreshToken`, `rmr.userId`).
- On app mount, `App.tsx` attempts silent refresh. If refresh fails, user becomes anonymous.
- Axios interceptor handles 401s with single-flight refresh (one refresh at a time, queued requests retry with new token).
- `ProtectedRoute` checks `status`: `"loading"` → skeleton, `"anonymous"` → redirect `/login` with `state.from`, `"authenticated"` → render children. Optional `role="Admin"` prop.
- Login POST `/api/auth/login` with `{ userName, email: "", password }`. Register `POST /api/auth/register` then auto-login.
- Logout calls POST `/api/auth/logout` (ignores network errors), clears store + localStorage.

### API Contract

Backend at `VITE_API_URL` (default `http://localhost:5113`). All routes singular: `/api/location`, `/api/category`, `/api/tag`, `/api/review`, `/api/media`, `/api/collection`. Coordinates as GeoJSON `{ type: "Point", coordinates: [lng, lat] }`. Dates are ISO 8601. Enums serialized as strings. The full contract is in `FRONTEND_DESIGN_SPEC.md` §3.

### Geo Coordinates (critical rule)

API uses GeoJSON order `[lng, lat]`. Leaflet uses `[lat, lng]`. Always convert via `toLeaflet()` / `toGeoJSON()` from `lib/geo.ts`. Never pass arrays manually between systems.

### 4 UI States

Every data-fetching component must handle: loading (LoadingSkeleton matching real layout), empty (EmptyState with specific message + action), error (ErrorState with retry button), and success (actual content).

### Soft Delete

Use `/soft-delete` for locations (never DELETE). Show toast with "Deshacer" action that calls `/restore`. Other resources (reviews, media) use regular DELETE (soft-deleted server-side).

## Backend Reference

The backend ASP.NET project is at `../rmrLocationsApi/`. Key docs there:
- `FRONTEND_DESIGN_SPEC.md` — authoritative API contract + full design spec
- `rmrLocations_help.md` — supplementary API documentation
- `Program.cs` — CORS policy, JSON serialization config, auth setup

Seed admin credentials: `admin` / `Admin123!`
