# rmrLocations — Especificación de Frontend para Claude Design

> **Versión 1.0 — 2026-07-19.**
> Documento autocontenido: contiene todo lo necesario para diseñar y construir el frontend sin acceso al repositorio del backend.
> **Todo el contrato de API descrito aquí fue verificado línea por línea contra el código fuente real** (controllers, services, modelos, DbContext y `Program.cs`) en el commit `56ce2bb`. Cuando este documento contradiga a `Frontend.md` o a `rmrLocations_help.md`, **este documento gana** (ver Apéndice A con las discrepancias detectadas y corregidas).
> **Actualización 2026-07-19:** se aplicaron al backend los puntos #1–4 del Apéndice B (autorización por roles/dueño, `[JsonIgnore]` en campos sensibles de `User`, errores 409/400 con `detail` para constraints, búsqueda por nombre con índice trigram y paginación server-side en locations), todos verificados end-to-end. Este documento ya refleja ese comportamiento.

---

## 0. Cómo usar este documento

1. Leerlo completo antes de escribir código.
2. La sección 3 (contrato de API) y la sección 4 (tipos TypeScript) son **normativas**: no inventar endpoints, parámetros ni campos que no estén aquí.
3. La sección 3.10 lista las **limitaciones reales del API** y la estrategia obligatoria del lado del cliente para cada una. No intentar "resolverlas" llamando endpoints que no existen.
4. La sección 7 define la dirección de diseño. Es una dirección concreta, no una sugerencia: seguirla salvo indicación explícita del usuario.
5. Requisitos no negociables: **diseño moderno, 100 % responsive (mobile-first), dark mode, y los 4 estados de UI (loading / empty / error / success) en cada vista asíncrona.**

---

## 1. El producto

**rmrLocations** es una plataforma de descubrimiento de lugares: un directorio geoespacial donde la comunidad registra lugares (restaurantes, cafés, parques…), los reseña con calificaciones de 1 a 5 estrellas, los organiza por categorías jerárquicas y tags, los guarda en colecciones personales y los encuentra mediante búsqueda por cercanía (PostGIS).

- **Audiencia:** público hispanohablante; el centro geográfico por defecto es CDMX (`19.4326, -99.1332`).
- **Dos caras:** una experiencia pública de exploración (mapa, cards, detalle, reseñas) y una capa de gestión (crear/editar lugares, administrar categorías, tags y contenido).
- **El trabajo de la página:** que en menos de 10 segundos cualquier visitante encuentre un lugar cerca de él que valga la pena visitar.

---

## 2. Stack tecnológico (obligatorio)

| Capa | Tecnología |
|---|---|
| Framework | React 19 + Vite |
| Lenguaje | TypeScript estricto |
| Estilos | TailwindCSS 4 |
| Ruteo | React Router v7 |
| Server state | TanStack Query (React Query) v5 |
| Estado global cliente | Zustand (auth + UI) |
| Formularios | React Hook Form + Zod (`@hookform/resolvers`) |
| HTTP | Axios con interceptors JWT |
| Mapas | Leaflet + react-leaflet v5 (tiles OpenStreetMap) |
| Íconos | Lucide React |
| Notificaciones | Sonner |
| Componentes base | shadcn/ui (Radix + Tailwind) |
| JWT | `jwt-decode` |
| Fuentes | `@fontsource-variable/*` (self-hosted, ver §7) |

```bash
npm create vite@latest rmr-locations-frontend -- --template react-ts
cd rmr-locations-frontend
npm i react-router-dom zustand @tanstack/react-query axios react-hook-form zod @hookform/resolvers jwt-decode
npm i leaflet react-leaflet @types/leaflet lucide-react sonner
npm i tailwindcss @tailwindcss/vite
npm i @fontsource-variable/bricolage-grotesque @fontsource-variable/instrument-sans @fontsource/ibm-plex-mono
npm i -D @types/node
npx shadcn@latest init
npx shadcn@latest add button card input textarea select dialog sheet dropdown-menu tabs badge avatar skeleton command popover slider switch checkbox label separator tooltip
```

---

## 3. Contrato de API (verificado contra el código)

### 3.1 Base URLs y entornos

| Entorno | URL base | Notas |
|---|---|---|
| Desarrollo local | `http://localhost:5113` | Perfil `http` de `dotnet run`. **Es HTTP, no HTTPS.** |
| Desarrollo local (https) | `https://localhost:7105` | Perfil `https`; certificado de desarrollo. |
| Producción (VPS) | `https://92.118.59.247/rmrlocations` | Traefik + certificado autofirmado (el navegador advierte). Futuro DNS: `https://api.rmrlocations.com`. |

- **CORS permitido hoy:** `http://localhost:3000`, `http://localhost:5113`, `http://localhost:5173`, `https://localhost:5173`. El dev server de Vite (5173) funciona directo, **sin proxy**.
- ⚠️ **Ningún origen de producción está permitido en CORS.** Antes de desplegar el frontend a un dominio real, el backend debe agregar ese origen a `MyCorsPolicy`. Documentarlo en el README del frontend.
- Swagger disponible en `/swagger` solo en Development.

```env
# .env
VITE_API_URL=http://localhost:5113
VITE_APP_NAME=rmrLocations
VITE_DEFAULT_MAP_CENTER=19.4326,-99.1332
VITE_DEFAULT_MAP_ZOOM=12
```

### 3.2 Convenciones globales de serialización

Verificadas en `Program.cs` (Newtonsoft.Json con camelCase, `StringEnumConverter`, `PointJsonConverter`, `ReferenceLoopHandling.Ignore`):

1. **JSON en camelCase** en respuestas y aceptado en requests (`name`, `averageRating`, `isPublic`…).
2. **Enums como strings**: `status: "Draft" | "Published" | "Archived"`, `type: "Image" | "Video"`, `visibility: "Private" | "Unlisted" | "Public"`, `dayOfWeek: "Sunday" … "Saturday"`.
3. **Coordenadas como GeoJSON Point**: `{ "type": "Point", "coordinates": [longitud, latitud] }`. ⚠️ Orden `[lng, lat]` (estándar GeoJSON). El backend también acepta en escritura `{ "lat": …, "lng": … }` o `{ "latitude": …, "longitude": … }`, pero **el frontend debe estandarizar en GeoJSON**. Las respuestas de Location incluyen además los campos calculados de solo lectura `latitude` y `longitude` (números planos) — usarlos para leer, nunca para escribir.
4. **Fechas**: `DateTimeOffset` → ISO 8601 con offset (`"2026-07-19T18:00:00+00:00"`); `visitedOn` (`DateOnly`) → `"YYYY-MM-DD"`; `opensAt`/`closesAt` (`TimeOnly`) → `"HH:mm:ss"` (al leer puede traer fracciones — parsear con tolerancia, p. ej. `value.slice(0, 5)` para mostrar `HH:mm`).
5. **`version`** (token de concurrencia `xmin` de PostgreSQL): número de solo lectura. **Nunca enviarlo en POST/PUT.**
6. **Ciclos de referencia se omiten silenciosamente** (`ReferenceLoopHandling.Ignore`): las propiedades de navegación pueden faltar en cualquier nivel de anidamiento. **Tipar todas las navegaciones como opcionales y programar defensivamente** (`location.locationCategories?.[0]?.category?.name`).
7. **Soft delete transparente**: filtros globales de EF ocultan todo registro con `isDeleted: true`. La API **nunca** devuelve elementos eliminados (no existe forma de listarlos).
8. **Campos con validación implícita**: las propiedades string no anulables del modelo (`name`, `slug`, `url`…) y `coordinates` son **requeridas** en cualquier body; si faltan, la API responde 400 con `ValidationProblemDetails`.

**Formato de errores:**

| Código | Cuándo | Cuerpo |
|---|---|---|
| 400 | Validación de modelo | `ValidationProblemDetails`: `{ title, status, errors: { campo: ["mensaje"] } }` |
| 400 | Reglas de negocio (register, add item a colección) | String plano con el mensaje (`"Username already exists."`) |
| 401 | Login inválido / token vencido o ausente | String plano o vacío |
| 403 | Permiso insuficiente: sin rol Admin en categorías/tags, o modificando un recurso ajeno (no dueño) | Vacío |
| 404 | No encontrado — **y también conflicto de concurrencia en PUT** (el backend devuelve `false` en ambos casos) | Vacío |
| 400 | Check de BD (rating fuera de 1–5) o referencia FK inexistente | `ProblemDetails` con `detail` específico (p. ej. `"Rating must be between 1 and 5."`) |
| 409 | Conflicto de datos: slug/nombre duplicado, review repetida, segunda portada, categoría primaria repetida, o eliminar categoría con dependencias | `ProblemDetails` con `detail` específico (p. ej. `"A location with this slug already exists."`) |
| 500 | Excepción no controlada (las violaciones de constraints ya **no** llegan aquí: se mapean a 409/400) | `ProblemDetails`: `{ status: 500, title: "Internal Server Error", detail: "An unexpected error occurred…" }` |

✅ Desde el 2026-07-19 los duplicados devuelven **409 Conflict** y los checks/referencias inválidas **400**, ambos con `detail` específico en inglés. El frontend traduce ese `detail` a un mensaje sobre el campo correspondiente; la pre-validación de slugs en cliente queda como mejora de UX, no como necesidad.

### 3.3 Autenticación — `/api/auth`

| Método | Ruta | Auth | Body | Respuesta OK |
|---|---|---|---|---|
| POST | `/api/auth/register` | No | `{ userName, email, password }` (los 3 requeridos) | **200** `{ id, userName, email, roles }` — sin tokens |
| POST | `/api/auth/login` | No | `{ userName, email, password }` — busca **solo por `userName`**; `email` se ignora pero el campo debe existir (puede ir `""`) | 200 `{ accessToken, refreshToken }` |
| POST | `/api/auth/logout` | 🔒 Bearer | — | 200 `"Logged out successfully."` |
| POST | `/api/auth/change-password` | 🔒 Bearer | `{ currentPassword, newPassword }` | 200 `"Password updated successfully. Please log in again."` |
| POST | `/api/auth/refresh-token` | No | `{ userId, refreshToken }` ⚠️ **requiere el GUID del usuario** | 200 `{ accessToken, refreshToken }` |
| GET | `/api/auth` | 🔒 Bearer | — | 200 `"You are authenticated!"` (endpoint de prueba) |
| GET | `/api/auth/admin-only` | 🔒 rol Admin | — | 200 `"You are an admin!"` (endpoint de prueba) |

Errores: register → 400 `"Username already exists."` (aplica si el userName **o** el email ya existen); login → 401 `"Invalid credentials."`; refresh → 401 `"Invalid refresh token."`; change-password → 400 `"Invalid current password or user not found."`.

**Hechos verificados que definen el flujo del cliente:**

- El access token expira en **1 hora** (HMAC-SHA512). El refresh token es opaco, expira en **7 días** y es **rotativo**: cada refresh devuelve un refresh token nuevo — reemplazar siempre ambos.
- El refresh token vive en una sola columna del usuario → **una sola sesión activa por usuario**: iniciar sesión en otro dispositivo invalida el refresh anterior (el access sigue válido hasta expirar).
- `register` **no devuelve tokens** → tras registro exitoso, hacer login automático con las mismas credenciales.
- `change-password` invalida el refresh token en el servidor → tras éxito, **cerrar sesión localmente y redirigir a login** (el mensaje del backend lo pide explícitamente).
- Payload del JWT (verificado en `AuthService`): `{ sub: "<userId GUID>", name: "<userName>", jti, role: "Admin" | ["Admin","User"] | …, exp, iss, aud }`. `role` es string si hay un solo rol y array si hay varios — normalizar a array al decodificar. De aquí salen `userId`, `userName` y `roles` para toda la app (no existe endpoint de perfil).
- Roles posibles: `Admin`, `User`, `UserL1`, `UserL2`, `UserL3`. Al registrarse se asigna `User`. Usuario semilla: `admin` / `Admin123!` (rol `Admin`).

### 3.4 Locations — `/api/location` *(singular; el ruteo es case-insensitive)*

🔒 **Los endpoints de datos exigen autorización desde el 2026-07-19** (Apéndice B #1–2 aplicados y verificados): lecturas públicas (salvo colecciones — ver 3.9), escrituras con Bearer (401 sin token), editar/borrar solo dueño o Admin (403), categorías y tags solo Admin. Los ids de dueño/autor se fijan desde el token, no desde el body. La matriz completa está en §13. Enviar siempre el Bearer cuando exista sesión.

| Método | Ruta | Respuesta | Notas verificadas |
|---|---|---|---|
| GET | `/api/location?name=&categoryId=&tagIds=&status=&sort=name\|rating\|recent&page=1&pageSize=20` | 200 `PagedResult<Location>` | **Paginado server-side**: `{ items, page, pageSize, totalCount, totalPages }` (`pageSize` 1–100, default 20). `name` filtra con ILIKE (índice trigram); `tagIds` CSV con lógica AND; `sort` default `name`. **Visibilidad en servidor:** anónimo ve solo `Published`+público, autenticado además sus propios lugares, Admin todo (`status` filtra encima). Los items incluyen solo `locationCategories[].category` y `locationTags[].tag` (sin media/reviews/horarios/owner). |
| GET | `/api/location/{id}` | 200 `Location` / 404 | Incluye categorías+tags, `media[]`, `openingHours[]` y `reviews[]` (⚠️ reviews **sin** el objeto `user` — usar 3.7 para mostrarlas con autor). No filtra visibilidad: un Draft/privado es accesible por id directo (semántica de enlace no listado). |
| POST | `/api/location` | 201 `Location` | 🔒 Requiere sesión. Acepta el **grafo completo**: `locationCategories: [{categoryId, isPrimary}]`, `locationTags: [{tagId}]`, `openingHours: […]` se insertan junto con el lugar. `ownerId` lo fija el servidor al usuario del token (solo Admin puede asignar otro). Requeridos: `name`, `slug`, `coordinates`. |
| PUT | `/api/location/{id}` | 204 / 403 / 404 | 🔒 Dueño o Admin. ⚠️ **Solo actualiza:** `name`, `slug`, `description`, `websiteUrl`, `phoneNumber`, `status`, `isPublic`, `address`. **NO actualiza** `coordinates`, `ownerId`, categorías, tags ni horarios (se ignoran aunque se envíen). El body igual debe incluir `name`, `slug` y `coordinates` para pasar la validación → reenviar las coordenadas cargadas. 404 también significa conflicto de concurrencia. |
| DELETE | `/api/location/{id}` | 204 / 403 / 404 | 🔒 Dueño o Admin. ⚠️ Es **soft delete SIN cascada** (interceptor de SaveChanges). Media/reviews del lugar quedarían huérfanos visibles → **el frontend debe usar siempre `soft-delete`, nunca DELETE, para lugares.** |
| POST | `/api/location/{id}/soft-delete` | 204 / 403 / 404 | 🔒 Dueño o Admin. Soft delete **con cascada lógica**: marca media y reviews como eliminados; borra físicamente horarios, favoritos, items de colección y joins de categorías/tags; decrementa `usageCount`. **Este es el borrado correcto.** |
| POST | `/api/location/{id}/restore` | 204 / 403 / 404 | 🔒 Dueño o Admin. Restaura el lugar (no restaura media/reviews en cascada). |
| GET | `/api/location/nearby?latitude=&longitude=&radiusMeters=5000&take=20` | 200 `[{ location, distanceMeters }]` | `latitude` y `longitude` **requeridos**; `radiusMeters` default 5000; `take` default 20. Solo devuelve `Published` + `isPublic`, ordenado por cercanía. `distanceMeters` viene redondeado a 0.1 m. Sin media en `location`. |
| GET | `/api/location/search?latitude=&longitude=&radiusMeters=5000&categoryIds=&tagIds=&name=` | 200 `Location[]` | `latitude`/`longitude` **requeridos**. `categoryIds`/`tagIds`: GUIDs separados por coma (`"id1,id2"`); tags con lógica **AND**; `name` opcional (ILIKE por subcadena). Solo `Published` + público, ordenado por distancia, incluye categorías y tags. **No devuelve la distancia** → calcularla en cliente (haversine) si se quiere mostrar. |

### 3.5 Categories — `/api/category`

🔒 Escritura (POST/PUT/DELETE): **solo rol Admin** (401 sin token, 403 sin rol). Lecturas públicas.

| Método | Ruta | Respuesta | Notas |
|---|---|---|---|
| GET | `/api/category` | 200 `Category[]` | Lista **plana** con `children[]` y `parentCategory` incluidos, pero con huecos por ciclos → **reconstruir el árbol en cliente usando `parentCategoryId`** e ignorar las navegaciones anidadas. |
| GET | `/api/category/{id}` | 200 / 404 | Incluye además `locationCategories[].location` (lugares de la categoría). |
| POST | `/api/category` | 201 | Body: `{ name, slug, description?, iconName?, colorHex?, sortOrder, parentCategoryId? }`. |
| PUT | `/api/category/{id}` | 204 / 404 | Actualiza: name, slug, description, iconName, colorHex, sortOrder, parentCategoryId. |
| DELETE | `/api/category/{id}` | 204 / 404 / **409 si tiene lugares o subcategorías** | El servidor valida dependencias antes de borrar y responde `ProblemDetails` con `detail: "The category has locations or subcategories and cannot be deleted."` |

`colorHex` formato `#RRGGBB` (máx. 7 chars). `iconName`: nombre de ícono Lucide en kebab-case (máx. 64).

### 3.6 Tags — `/api/tag`

🔒 Escritura (POST/PUT/DELETE): **solo rol Admin** (401 sin token, 403 sin rol). Lecturas públicas.

| Método | Ruta | Notas |
|---|---|---|
| GET | `/api/tag` | 200 `Tag[]`, incluye `locationTags[]`. ⚠️ `usageCount` **nunca se incrementa en el backend** (solo se decrementa al soft-borrar lugares) → **usar `locationTags.length` como conteo real** para la nube de tags. |
| GET | `/api/tag/{id}` | Incluye `locationTags[].location`. |
| POST | `/api/tag` | `{ name, slug, description? }`. `name` y `slug` únicos (duplicado → **409**). |
| PUT | `/api/tag/{id}` | Actualiza name, slug, description. |
| DELETE | `/api/tag/{id}` | 204 / 404. Soft delete; los lugares dejan de mostrar el tag (puede venir `tag: null` dentro de `locationTags` viejos → filtrar nulls). |

### 3.7 Reviews — `/api/review`

| Método | Ruta | Notas |
|---|---|---|
| GET | `/api/review/location/{locationId}` | 200 `Review[]` **con `user` incluido**, orden `createdAtUtc` desc. Fuente para la lista de reseñas del detalle. |
| GET | `/api/review/{id}` | Con `user` y `location`. |
| POST | `/api/review` | 🔒 Requiere sesión. Body: `{ locationId, rating (1–5), title?, body?, visitedOn? }` — el `userId` lo fija el servidor desde el token (si se envía, se ignora). Recalcula `averageRating`/`reviewCount` del lugar automáticamente. ⚠️ **Una review viva por usuario por lugar** → duplicado = **409** (`"This user already has a review for this location."`); rating fuera de 1–5 → **400**. UX: si el usuario ya tiene review, ofrecer editar en vez de crear. |
| PUT | `/api/review/{id}` | 🔒 Autor o Admin (403 si no). Actualiza rating, title, body, visitedOn. Recalcula rating. |
| DELETE | `/api/review/{id}` | 🔒 Autor o Admin (403 si no). Soft delete + recálculo de rating. |

⚠️ **Tras cualquier mutación de review: invalidar las queries de la location** (`['locations']`, `['locations', id]`) además de `['reviews', locationId]`, porque `averageRating`/`reviewCount` cambian en el servidor.

✅ **Nota de seguridad (resuelta el 2026-07-19):** `passwordHash`, `email`, `refreshToken` y `refreshTokenExpiryTime` tienen `[JsonIgnore]` en el modelo `User` y **ya no viajan en ninguna respuesta** (verificado). El objeto `user` de las reviews expone `id`, `userName`, `displayName`, `avatarUrl`, `roles` y metadatos de auditoría.

### 3.8 Media — `/api/media`

| Método | Ruta | Notas |
|---|---|---|
| GET | `/api/media/location/{locationId}` | 200 `LocationMedia[]` ordenado por `sortOrder`. |
| GET | `/api/media/{id}` | Con `location`. |
| POST | `/api/media` | 🔒 Dueño de la location o Admin. `{ locationId, url, thumbnailUrl?, caption?, type: "Image"\|"Video", isCover, sortOrder }` — `uploadedByUserId` lo fija el servidor (solo Admin puede indicar otro). `locationId` inexistente → 404. |
| PUT | `/api/media/{id}` | 🔒 Dueño de la location o Admin. Actualiza url, thumbnailUrl, caption, type, isCover, sortOrder (no `locationId`). |
| DELETE | `/api/media/{id}` | 🔒 Dueño de la location o Admin. Soft delete. |

⚠️ **Solo una portada viva por lugar** (índice único filtrado). Para cambiar portada: primero PUT quitando `isCover` a la actual, luego PUT/POST con `isCover: true` en la nueva. Hacerlo en ese orden o habrá **409** (`"This location already has a cover media item."`).

No hay upload de archivos: la API almacena **URLs** (el archivo vive en un storage externo). El "MediaUploader" del frontend es un formulario de URL con previsualización, no un drag & drop de archivos binarios.

### 3.9 Collections — `/api/collection`

| Método | Ruta | Notas |
|---|---|---|
| GET | `/api/collection/user/{userId}` | 🔒 Solo el propio usuario o Admin (403 si no); incluye privadas. 200 `LocationCollection[]` con `items[].location`, orden creación desc. |
| GET | `/api/collection/{id}` | Público para `Public`/`Unlisted` (con `items[].location` y `owner`). Las `Private` devuelven **404** salvo para su dueño o Admin → enviar Bearer si hay sesión; ante 404 mostrar "Colección privada o inexistente". |
| POST | `/api/collection` | 🔒 Requiere sesión. `{ name, description?, visibility }` — `ownerId` lo fija el servidor al usuario del token. Nombre único por usuario (duplicado → **409**). |
| PUT | `/api/collection/{id}` | 🔒 Dueño o Admin. Actualiza name, description, visibility. |
| DELETE | `/api/collection/{id}` | 🔒 Dueño o Admin. Soft delete. |
| POST | `/api/collection/{collectionId}/items` | 🔒 Dueño o Admin. `{ locationId, notes? }` → 204. `sortOrder` lo asigna el servidor (max+1). 400 string si el lugar no existe o ya está en la colección. |
| DELETE | `/api/collection/{collectionId}/items/{locationId}` | 🔒 Dueño o Admin. 204 / 403 / 404. |

⚠️ **No existe endpoint para reordenar items** (`sortOrder` de items no es editable) → no implementar drag & drop de reordenamiento (ver §3.10).

### 3.10 Limitaciones del API y estrategia obligatoria en el cliente

Esta tabla es el mapa de decisiones ya tomadas. **No** diseñar UI que dependa de capacidades ausentes.

| # | Limitación verificada | Estrategia del frontend |
|---|---|---|
| 1 | ~~Sin búsqueda por texto~~ **Resuelto:** `?name=` en `GET /api/location` y en `search` (ILIKE + índice trigram) | Buscar por nombre vía servidor con debounce ~350 ms. Cubre solo `name`; refinar por descripción/ciudad sería filtrado client-side de la página actual. |
| 2 | ~~Sin paginación server-side~~ **Resuelto para locations:** `PagedResult` con `page`/`pageSize` (máx 100) y `sort` | Explorar usa paginación de servidor (12–20 por página, estado en URL). Categorías, tags y reviews siguen sin paginar (listas pequeñas → cliente). |
| 3 | `GET /api/location` (lista) **no incluye media** → no hay foto de portada en listados | Las cards **no usan fotografías**: su visual es la "ficha cartográfica" (§7.4) — color e ícono de la categoría primaria + coordenadas. Las fotos aparecen solo en el detalle. |
| 4 | ~~La lista devolvía Draft/Archived/no públicos~~ **Resuelto:** el servidor limita visibilidad (anónimo: publicados; autenticado: + los suyos; Admin: todo) | Sin filtrado de visibilidad en cliente; mostrar badge de estado en lugares propios/admin y usar `?status=` en vistas de gestión. ⚠️ El GET por id no filtra (enlace directo). |
| 5 | PUT de location no modifica coordenadas, categorías, tags ni horarios | El formulario de **edición** solo ofrece los campos editables; coordenadas/categorías/tags/horarios se muestran **en solo lectura** con tooltip "Se define al crear el lugar". El formulario de **creación** sí los captura todos (POST acepta el grafo completo). |
| 6 | No hay endpoints de favoritos (la tabla existe pero no el controller) | **Fuera de alcance v1.** No mostrar corazones/likes. El equivalente funcional es "Guardar en colección". |
| 7 | No hay endpoints de usuario (perfil, avatar, lista de usuarios, reviews por usuario) | El perfil se construye con los claims del JWT + colecciones propias. Sin edición de avatar/displayName. Sin sección "mis reseñas". |
| 8 | No se pueden listar elementos eliminados (soft-deleted invisibles) | No hay "papelera". Tras un soft-delete, ofrecer **deshacer inmediato**: toast con acción "Deshacer" que llama a `/restore` con el id recién borrado. |
| 9 | No hay reordenamiento de items de colección | Mostrar items ordenados por `sortOrder`; sin drag & drop. |
| 10 | ~~Constraints → 500~~ **Resuelto:** 409 (duplicados/dependencias) y 400 (checks/FK) con `detail` | Mapear el `detail` del `ProblemDetails` al campo correspondiente; pre-validar slugs en cliente solo como mejora de UX. |
| 11 | 404 en PUT puede ser concurrencia (`xmin`) | Mensaje: "No se pudo guardar: el registro no existe o fue modificado por alguien más. Recarga e intenta de nuevo." + botón recargar datos. |
| 12 | ~~Endpoints de datos sin `[Authorize]`~~ **Resuelto el 2026-07-19:** el servidor aplica la matriz de §13 | Enviar Bearer en toda petición con sesión; manejar 401 (refresh automático) y 403 ("No tienes permisos"). La UI sigue ocultando acciones según rol. |
| 13 | `search` no devuelve distancia | Utilidad `haversineMeters(a, b)` en `lib/geo.ts` para los chips de distancia. |
| 14 | `usageCount` de tags no se incrementa | Contar con `locationTags.length`. |

---

## 4. Tipos TypeScript canónicos (`src/types/models.ts`)

Copiar tal cual. Toda navegación es opcional (ver §3.2.6).

```typescript
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
  createdAtUtc: string;            // ISO 8601 con offset
  updatedAtUtc?: string | null;
  isDeleted: boolean;              // siempre false en respuestas (filtro global)
  deletedAtUtc?: string | null;
  version: number;                 // xmin — solo lectura, NUNCA enviar en writes
}

export interface Address {
  name?: string | null;            // máx 200
  street?: string | null;          // máx 200
  exteriorNumber?: string | null;  // máx 20
  interiorNumber?: string | null;  // máx 20
  neighborhood?: string | null;    // máx 120
  city?: string | null;            // máx 120
  state?: string | null;           // máx 120
  postalCode?: string | null;      // máx 20
  countryCode?: string | null;     // ISO 3166-1 alpha-2, exactamente 2 chars
}

export interface Location extends Auditable {
  id: Guid;
  name: string;                    // máx 200, requerido
  slug: string;                    // máx 220, único (case-insensitive), requerido
  description?: string | null;     // máx 4000
  coordinates: GeoJSONPoint;       // requerido
  address: Address;
  status: LocationStatus;
  isPublic: boolean;
  websiteUrl?: string | null;      // máx 2048
  phoneNumber?: string | null;     // máx 32
  averageRating: number;           // 0..5, denormalizado (lo mantiene el backend)
  reviewCount: number;             // denormalizado
  ownerId: Guid;
  owner?: ApiUser | null;
  locationCategories?: LocationCategory[];
  locationTags?: LocationTag[];
  media?: LocationMedia[];         // solo en GET por id
  reviews?: Review[];              // solo en GET por id (sin user)
  openingHours?: OpeningHour[];    // solo en GET por id
  latitude: number;                // calculado, solo lectura
  longitude: number;               // calculado, solo lectura
}

export interface LocationCategory {
  locationId: Guid;
  categoryId: Guid;
  category?: Category | null;
  isPrimary: boolean;              // solo una primaria por lugar
  createdAtUtc: string;
}

export interface LocationTag {
  locationId: Guid;
  tagId: Guid;
  tag?: Tag | null;                // puede venir null si el tag fue eliminado
  addedByUserId?: Guid | null;
  createdAtUtc: string;
}

export interface Category extends Auditable {
  id: Guid;
  name: string;                    // máx 120
  slug: string;                    // máx 140, único
  description?: string | null;     // máx 1000
  iconName?: string | null;        // nombre Lucide kebab-case, máx 64
  colorHex?: string | null;        // "#RRGGBB"
  sortOrder: number;
  parentCategoryId?: Guid | null;
  parentCategory?: Category | null; // no confiable por ciclos — usar parentCategoryId
  children?: Category[];            // no confiable por ciclos — armar árbol en cliente
  locationCategories?: LocationCategory[]; // solo en GET por id
}

export interface Tag extends Auditable {
  id: Guid;
  name: string;                    // máx 60, único
  slug: string;                    // máx 80, único
  description?: string | null;     // máx 500
  usageCount: number;              // ⚠️ no confiable — usar locationTags.length
  locationTags?: LocationTag[];
}

export interface Review extends Auditable {
  id: Guid;
  locationId: Guid;
  location?: Location | null;
  userId: Guid;
  user?: ApiUser | null;           // presente en GET /api/review/location/{id}
  rating: number;                  // entero 1..5
  title?: string | null;           // máx 200
  body?: string | null;            // máx 4000
  visitedOn?: string | null;       // "YYYY-MM-DD"
}

export interface LocationMedia extends Auditable {
  id: Guid;
  locationId: Guid;
  url: string;                     // máx 2048, requerido
  thumbnailUrl?: string | null;    // máx 2048
  caption?: string | null;         // máx 300
  type: MediaType;
  isCover: boolean;                // solo una portada viva por lugar
  sortOrder: number;
  uploadedByUserId?: Guid | null;
}

export interface LocationCollection extends Auditable {
  id: Guid;
  name: string;                    // máx 150, único por usuario
  description?: string | null;     // máx 1000
  visibility: CollectionVisibility;
  ownerId: Guid;
  owner?: ApiUser | null;
  items?: CollectionItem[];
}

export interface CollectionItem {
  collectionId: Guid;
  locationId: Guid;
  location?: Location | null;
  sortOrder: number;               // lo asigna el servidor
  notes?: string | null;           // máx 500
  createdAtUtc: string;
}

export interface OpeningHour {
  id: Guid;
  locationId: Guid;
  dayOfWeek: DayOfWeekName;
  opensAt: string;                 // "HH:mm:ss"
  closesAt: string;                // "HH:mm:ss"
  isClosed: boolean;
}

/**
 * Usuario tal como lo serializa el backend dentro de reviews/owner.
 * Los campos sensibles (passwordHash, email, refreshToken, refreshTokenExpiryTime)
 * tienen [JsonIgnore] desde el 2026-07-19 y no viajan en ninguna respuesta.
 */
export interface ApiUser {
  id: Guid;
  userName: string;
  displayName?: string | null;
  avatarUrl?: string | null;
}

// ---- DTOs de auth ----
export interface RegisterRequest { userName: string; email: string; password: string; }
export interface LoginRequest    { userName: string; email: string; password: string; } // email: "" permitido
export interface TokenResponse   { accessToken: string; refreshToken: string; }
export interface RefreshRequest  { userId: Guid; refreshToken: string; }
export interface ChangePasswordRequest { currentPassword: string; newPassword: string; }
export interface RegisteredUser  { id: Guid; userName: string; email: string; roles: RoleName[]; }

// ---- Respuestas compuestas ----
export interface NearbyResult { location: Location; distanceMeters: number; }

export interface PagedResult<T> {
  items: T[];
  page: number;          // 1-based
  pageSize: number;      // 1..100 (default 20)
  totalCount: number;
  totalPages: number;
}

export interface JwtPayload {
  sub: Guid;                       // userId
  name: string;                    // userName
  jti: string;
  role?: RoleName | RoleName[];    // string si 1 rol, array si varios — normalizar
  exp: number; iss: string; aud: string;
}

export interface AddCollectionItemRequest { locationId: Guid; notes?: string | null; }

export interface ProblemDetails { type?: string; title?: string; status?: number; detail?: string; }
export interface ValidationProblemDetails extends ProblemDetails {
  errors?: Record<string, string[]>;
}
```

---

## 5. Autenticación en el cliente

### 5.1 Persistencia y stores

- `accessToken`: **solo en memoria** (Zustand).
- `refreshToken` + `userId`: `localStorage` (claves `rmr.refreshToken`, `rmr.userId`).
- Al montar la app: si hay `refreshToken` + `userId` en localStorage → intentar `POST /api/auth/refresh-token` silencioso; si falla, limpiar y quedar anónimo. Mostrar un splash/skeleton mínimo mientras se resuelve para evitar parpadeo de navbar.
- Del `accessToken` decodificar (`jwt-decode`) `sub`, `name`, `role` → estado `{ userId, userName, roles: RoleName[], isAdmin }`.

```typescript
// stores/auth-store.ts — contrato mínimo
interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  userId: string | null;
  userName: string | null;
  roles: RoleName[];
  status: "loading" | "authenticated" | "anonymous";
  setTokens(access: string, refresh: string): void; // decodifica y persiste
  logout(): void;                                   // limpia store + localStorage
}
```

### 5.2 Axios con refresh automático (single-flight)

```typescript
// lib/axios.ts
import axios from "axios";
import { useAuthStore } from "@/stores/auth-store";

const BASE = import.meta.env.VITE_API_URL ?? "http://localhost:5113";
const api = axios.create({ baseURL: BASE, headers: { "Content-Type": "application/json" } });

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshing: Promise<string | null> | null = null; // single-flight: un solo refresh simultáneo

async function refreshAccessToken(): Promise<string | null> {
  const { userId, refreshToken, setTokens, logout } = useAuthStore.getState();
  if (!userId || !refreshToken) return null;
  try {
    // axios "crudo" para no entrar en bucle de interceptors
    const { data } = await axios.post(`${BASE}/api/auth/refresh-token`, { userId, refreshToken });
    setTokens(data.accessToken, data.refreshToken); // ⚠️ rotativo: guardar AMBOS
    return data.accessToken;
  } catch {
    logout();
    return null;
  }
}

api.interceptors.response.use(
  (r) => r,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry && !original.url?.includes("/api/auth/")) {
      original._retry = true;
      refreshing ??= refreshAccessToken().finally(() => (refreshing = null));
      const newToken = await refreshing;
      if (newToken) {
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
```

### 5.3 Flujos

| Flujo | Pasos |
|---|---|
| Registro | POST register → si 200, POST login automático → guardar tokens → toast "Cuenta creada" → redirect a `/` o a la ruta de origen. Si 400: mostrar "Ese usuario o email ya existe." |
| Login | POST login (`email: ""`) → tokens → redirect a ruta de origen (`location.state.from`) o `/`. |
| Logout | POST logout (ignorar error de red) → `logout()` del store → redirect `/`. |
| Cambio de contraseña | Dialog en perfil → POST → si 200: toast "Contraseña actualizada. Inicia sesión de nuevo." → `logout()` → `/login`. |
| Sesión expirada | Interceptor agota refresh → `logout()` → toast "Tu sesión expiró" → redirect a `/login` guardando la ruta actual. |

### 5.4 Guardas de ruta

```tsx
<ProtectedRoute>            // requiere sesión (cualquier rol)
<ProtectedRoute role="Admin"> // requiere rol específico
```
Mientras `status === "loading"`, renderizar skeleton (no redirigir). Anónimo → `/login` con `state.from`.

---

## 6. Arquitectura del proyecto

### 6.1 Rutas

| Ruta | Página | Acceso |
|---|---|---|
| `/` | HomePage | Público |
| `/login`, `/register` | Auth | Público (si ya hay sesión → redirect `/`) |
| `/locations` | Explorar (lista + mapa) | Público |
| `/locations/:id` | Detalle de lugar | Público |
| `/locations/new` | Crear lugar | 🔒 Autenticado |
| `/locations/:id/edit` | Editar lugar | 🔒 Owner o Admin |
| `/categories` | Categorías (árbol) | Público; gestión solo Admin |
| `/categories/:id` | Detalle de categoría | Público |
| `/tags` | Nube de tags | Público; gestión solo Admin |
| `/tags/:id` | Detalle de tag | Público |
| `/collections` | Mis colecciones | 🔒 Autenticado |
| `/collections/:id` | Detalle de colección | Público si Public/Unlisted; owner si Private |
| `/profile` | Perfil | 🔒 Autenticado |
| `/admin` | Dashboard admin | 🔒 Admin |
| `*` | NotFoundPage | Público |

La búsqueda no tiene página propia: la barra de búsqueda navega a `/locations?q=texto` y Explorar lee los filtros de la URL (`q`, `categoryId`, `tagIds`, `sort`, `view`, `page`) — **URL como estado compartible**.

### 6.2 Estructura de carpetas

```
src/
├── main.tsx / App.tsx / index.css
├── lib/            axios.ts · utils.ts (cn, formatDate, formatDistance) · geo.ts (haversine,
│                   toLeaflet, toGeoJSON) · slug.ts (slugify) · constants.ts · api-error.ts
├── types/          models.ts · forms.ts (schemas Zod §14)
├── stores/         auth-store.ts · ui-store.ts (theme, drawer)
├── hooks/          use-auth.ts · use-locations.ts · use-categories.ts · use-tags.ts
│                   use-reviews.ts · use-media.ts · use-collections.ts · use-geolocation.ts
├── components/
│   ├── ui/         (shadcn)
│   ├── layout/     AppShell · Navbar · Footer · Breadcrumbs · AdminSidebar
│   ├── auth/       LoginForm · RegisterForm · ChangePasswordDialog · ProtectedRoute
│   ├── locations/  LocationCard · LocationGrid · LocationFilters · LocationForm (tabs)
│   │               LocationMap · LocationPicker · NearbyMap · SearchRadiusSlider
│   │               StatusBadge · OpeningHoursEditor · OpeningHoursDisplay · CoordinatesLabel
│   ├── categories/ CategoryCard · CategoryTree · CategoryFormDialog · CategoryIconPicker
│   ├── tags/       TagCloud · TagBadge · TagFormDialog · TagSelector
│   ├── reviews/    ReviewList · ReviewCard · ReviewFormDialog · StarRating · RatingDistribution
│   ├── media/      MediaGallery · MediaCard · MediaFormDialog · Lightbox
│   ├── collections/CollectionCard · CollectionFormDialog · CollectionDetail
│   │               AddToCollectionDialog
│   └── shared/     EmptyState · ErrorState · LoadingSkeleton · ConfirmDialog · Pagination
│                   ColorPicker · PageHeader
└── pages/          (una por ruta de §6.1)
```

### 6.3 React Query — claves e invalidación

| Query key | Endpoint | Invalidar cuando |
|---|---|---|
| `['locations', filtros]` (name, categoryId, tagIds, status, sort, page) | GET /api/location paginado | mutación de location o **de review** (invalidar el prefijo `['locations']`) |
| `['locations', id]` | GET /api/location/{id} | ídem |
| `['locations','nearby',{lat,lng,r}]` | nearby | mutación de location |
| `['categories']` / `['categories', id]` | category | mutación de category |
| `['tags']` / `['tags', id]` | tag | mutación de tag o soft-delete de location |
| `['reviews', locationId]` | review/location | mutación de review |
| `['media', locationId]` | media/location | mutación de media |
| `['collections', userId]` / `['collections','detail', id]` | collection | mutación de collection/items |

Defaults: `staleTime: 120_000`, `retry: 1`, `refetchOnWindowFocus: false`.

---

## 7. Dirección de diseño — "Cartografía contemporánea"

### 7.1 Concepto

La identidad sale del mundo del producto: **mapas**. No mapas decorativos, sino el lenguaje gráfico de la cartografía — retícula, coordenadas, rutas, pins — aplicado con disciplina de producto moderno. Dos decisiones definen todo:

1. **El color funcional viene de los datos.** Cada categoría tiene `colorHex` e `iconName` en la base de datos; ese color tiñe pins del mapa, chips y el canto de las cards. El chrome de la app permanece neutro para que el color de las categorías sea la información.
2. **Las coordenadas son tipografía.** Todo lugar exhibe sus coordenadas en monoespaciada (`19.4326° N · 99.1332° O`) como "eyebrow" técnico. Es el sello de la marca: verosímil, útil y ningún template lo tiene.

La solución al hecho de que los listados **no traen fotos** (§3.10.3) es identitaria, no un parche: las cards son **fichas cartográficas**, no miniaturas de fotos.

### 7.2 Tokens de color

Definir como variables CSS en `:root` / `.dark` y mapear a Tailwind.

| Token | Light | Dark | Uso |
|---|---|---|---|
| `--background` | `#F7F6F3` papel | `#131022` mapa nocturno | Fondo general |
| `--surface` | `#FFFFFF` | `#1B1830` | Cards, modales, navbar |
| `--ink` | `#23203F` tinta | `#EDECF6` | Texto principal, headings |
| `--ink-muted` | `#6E6A85` | `#A5A1BF` | Texto secundario, metadata |
| `--primary` | `#4F46E5` índigo brújula | `#818CF8` | Acciones, links, focos, marca |
| `--primary-strong` | `#4338CA` | `#6366F1` | Hover/pressed |
| `--route` | `#EA580C` naranja ruta | `#FB923C` | **Solo**: CTA "Cerca de mí", pin activo, chips de distancia |
| `--rating` | `#F59E0B` ámbar | `#FBBF24` | Estrellas |
| `--success` | `#10B981` | `#34D399` | Confirmaciones |
| `--danger` | `#EF4444` | `#F87171` | Destructivo, errores |
| `--border` | `#E7E5F0` | `#2A2745` | Bordes, divisores |

Reglas: el naranja ruta aparece **una sola vez por vista** como máximo. Los colores de categoría (`colorHex`) se usan al 100 % solo en puntos/pins/ticks pequeños; para fondos de chips usarlos al 12–15 % de opacidad con texto en el color pleno (garantiza contraste en ambos temas). Fallback cuando `colorHex` es null: `--primary`.

### 7.3 Tipografía

| Rol | Fuente | Uso |
|---|---|---|
| Display | **Bricolage Grotesque** (variable) | H1–H2, hero, cifras grandes. Pesos 600–800, `tracking-tight`. |
| Cuerpo/UI | **Instrument Sans** (variable) | Todo lo demás. 400/500/600. |
| Datos | **IBM Plex Mono** | Coordenadas, distancias, slugs, horarios, badges técnicos. Es la firma — usarla en cada lugar donde aparezca un dato "de mapa", y en ningún otro. |

Escala: 12 / 14 / 16 (base) / 18 / 20 / 24 / 30 / 38 / 48–60 (hero). Line-height 1.5 cuerpo, 1.1–1.2 display. No usar la display en párrafos ni en botones.

### 7.4 Firma visual: la ficha cartográfica (LocationCard)

```
┌─────────────────────────────────┐
│▌ [◉ icono cat.]      ★ 4.6 (23) │   ▌ = tick de 3px en el color de la
│▌                                │       categoría primaria (borde izq.)
│▌ Café de la Esquina             │   ◉ = ícono Lucide de la categoría
│▌ Roma Norte · CDMX              │       sobre disco de su color al 12%
│▌                                │
│▌ 19.4192° N · 99.1615° O   1.2 km│  ← IBM Plex Mono, --ink-muted;
│▌ [café] [wifi] [+2]             │     distancia en --route si hay geoloc
└─────────────────────────────────┘
```

Fondo `--surface`, radio 12 px, sombra suave solo en hover (elevación + 2 px translate-y, 150 ms). La zona superior de la card lleva un **patrón de retícula sutil** (CSS puro: `repeating-linear-gradient` a 1 px, opacidad 4–6 %) teñido con el color de la categoría — evoca papel milimétrico de mapa. Sin imágenes externas.

### 7.5 Otros elementos del sistema

- **Pins del mapa:** `L.divIcon` con SVG inline en forma de gota, relleno del color de la categoría primaria, borde blanco 2 px. Pin seleccionado: escala 1.15 + color `--route`. (Usar divIcon evita el bug clásico de los PNG de Leaflet con Vite.)
- **Hero (Home):** fondo `--background` con retícula cartográfica CSS y 2–3 "curvas de nivel" (radial-gradients suaves al 3 %). Titular en Bricolage 800. Única animación orquestada de la app: titular → subtítulo → barra de búsqueda con fade/rise escalonado de ~500 ms total, una sola vez.
- **Botones:** primario relleno `--primary`; secundario outline; destructivo `--danger`; ghost para acciones de card. Radio 10 px. Sin gradientes.
- **Badges de estado:** `Draft` gris, `Published` success, `Archived` ámbar apagado; siempre con punto de color + texto, en Plex Mono 12 px.
- **Estrellas:** llenas/medias en `--rating`, vacías en `--border`. Tamaño 16 px en cards, 20 px en detalle, 28 px interactivas en el formulario de review.
- **Dark mode:** obligatorio. Toggle en navbar (persistido en `localStorage`, default `prefers-color-scheme`), estrategia de clase `.dark`. Los mapas usan el mismo tile OSM en ambos temas con un filtro CSS suave (`brightness(0.85) contrast(1.05)`) en dark — no invertir colores del tile.
- **Motion:** micro-interacciones de 150–200 ms (hover de cards, estrellas, toggles). Skeletons con pulso. **Nada más se anima.** Respetar `prefers-reduced-motion: reduce` desactivando todas las transiciones no esenciales.
- **Accesibilidad (piso de calidad):** contraste AA, focus visible en todo elemento interactivo (anillo `--primary` 2 px offset 2 px), targets táctiles ≥ 44 px, `aria-label` en botones de solo ícono, formularios con labels reales, lightbox y dialogs con focus trap (Radix lo da).
- **Voz y copy:** español, tono directo y concreto, sentence case. Verbos exactos: "Guardar cambios", "Publicar lugar", "Eliminar reseña". Los errores dicen qué pasó y qué hacer; los vacíos invitan a actuar ("Aún no hay reseñas. Sé el primero en contar cómo te fue."). La misma acción conserva el mismo nombre en botón → toast.

---

## 8. Layout global

### 8.1 AppShell

```
┌──────────────────────────────────────────────┐
│ Navbar (sticky, --surface, borde inferior)   │
├──────────────────────────────────────────────┤
│ <Outlet/>  (max-w-7xl mx-auto px-4/6/8)      │
├──────────────────────────────────────────────┤
│ Footer                                       │
└──────────────────────────────────────────────┘
```

### 8.2 Navbar

- **Desktop (≥1024):** logo (wordmark "rmr**Locations**" con pin en `--primary`) · búsqueda (Command ⌘K + input que navega a `/locations?q=`) · links: Explorar, Categorías, Tags, Colecciones (solo autenticado) · botón "+ Nuevo lugar" (autenticado) · toggle tema · avatar con DropdownMenu (Perfil, Admin si aplica, Cerrar sesión) o botones "Entrar / Crear cuenta".
- **Mobile (<1024):** logo · ícono búsqueda (expande input full-width) · hamburguesa → `Sheet` lateral con toda la navegación, datos del usuario arriba y toggle de tema abajo.
- Estado admin: link "Admin" visible solo con rol `Admin`.

### 8.3 Footer

Tres columnas (apiladas en mobile): marca + tagline; navegación; "Hecho con rmrLocationsApi" + enlaces. Fondo `--surface`, texto `--ink-muted`.

### 8.4 Breadcrumbs

En páginas de detalle y formularios: `Inicio > Explorar > {nombre}`. Componente shadcn-like, truncar el último segmento con ellipsis en mobile.

### 8.5 Admin layout

`/admin` usa un layout de dos columnas en desktop: sidebar fija (Resumen, Lugares, Categorías, Tags) + contenido. En mobile la sidebar se convierte en `Tabs` horizontales scrolleables bajo el header.

---

## 9. Especificación por página

Formato: **Datos** (queries) · **Estructura** · **Interacciones** · **Responsive**. Los 4 estados de UI (§12) aplican a toda sección con datos.

### 9.1 HomePage `/`

- **Datos:** `['categories']`; destacados: `GET /api/location?sort=rating&pageSize=8` (el servidor ya limita a publicados); si hay geolocalización concedida, sustituir por `nearby` con radio 5 km.
- **Estructura:**
  1. **Hero** (§7.5): titular "Descubre lugares que valen la pena", subtítulo "Encuentra, reseña y comparte los mejores lugares cerca de ti", barra de búsqueda grande (input + botón "Explorar") y botón secundario en `--route` "📍 Cerca de mí" (pide geolocalización y navega a `/locations?view=map`).
  2. **Categorías** — grid de cards compactas (ícono en disco de color + nombre + nº de lugares si está disponible); top 8 por `sortOrder`; click → `/locations?categoryId={id}`. CTA "Ver todas" → `/categories`.
  3. **Mejor valorados** — grid de `LocationCard` (top 8). Encabezado con eyebrow mono "★ 4.0+".
  4. **Cómo funciona** — 3 columnas: Busca / Descubre / Comparte (ícono Lucide + 1 línea). Sin numeración.
  5. **CTA final** — banda `--primary` con texto blanco: "¿Conoces un lugar imperdible?" + botón "Crear cuenta" (anónimo) o "Publicar un lugar" (autenticado).
- **Responsive:** hero centrado en mobile / alineado a la izquierda en desktop; categorías 2→4 cols; destacados 1→2→3→4 cols.

### 9.2 LoginPage `/login` · 9.3 RegisterPage `/register`

- Card centrada (max-w-sm) sobre fondo con retícula sutil; logo arriba.
- Login: userName + password (toggle mostrar/ocultar) + submit "Entrar" + link "¿No tienes cuenta? Regístrate". Enviar `email: ""`.
- Register: userName (3–64), email, password (≥8), confirmar password (validación cruzada Zod). Tras éxito: login automático (§5.3).
- Errores de credenciales **inline en la card**, no en toast. Botón con spinner y deshabilitado durante submit.
- Responsive: full-width con padding en mobile; página sin footer extra de distracción.

### 9.4 LocationsPage `/locations` — Explorar

La página central. Dos vistas conmutables persistidas en URL: **`view=list`** (default) y **`view=map`**.

- **Datos:** `['locations', filtros]` (paginado server-side) + `['categories']` + `['tags']`. En modo mapa: `['locations','nearby',{lat,lng,r}]` (o `search` si hay filtros de texto/categoría/tag activos).
- **Filtros (en URL, resueltos por el servidor):** texto `q` → `?name=` (ILIKE, debounce ~350 ms), `categoryId`, `tagIds` (AND), `sort` (`name` | `rating` | `recent`; `distance` solo en modo mapa vía nearby), `page`/`pageSize`.
- **Estructura desktop:** header con título + contador de resultados en mono ("128 lugares") + toggle Lista/Mapa · barra de filtros sticky (input búsqueda, select categoría, tags, sort, botón limpiar) · grid 3 cols de `LocationCard` · `Pagination`.
- **Modo mapa:** split 40/60 (lista scrolleable de cards compactas | `NearbyMap` con pins por categoría). `SearchRadiusSlider` (100 m–50 km, escala logarítmica) flotante sobre el mapa. Hover en card ⇄ resalta pin; click en pin → popup con mini-card y link al detalle. Botón "Buscar en esta zona" al mover el mapa (usa el centro actual).
- La visibilidad la resuelve el servidor. Para Admin, el toggle "Ver todos los estados" añade/quita `?status=` y muestra badges Draft/Archived.
- **Responsive:** filtros colapsan a un botón "Filtros" que abre `Sheet` inferior (mobile); modo mapa en mobile = mapa full-height con la lista como bottom-sheet deslizable (dos snap points: 30 % y 70 %); grid 1→2→3.

### 9.5 LocationDetailPage `/locations/:id`

- **Datos:** `['locations', id]` + `['reviews', id]` + `['media', id]` (media también viene en el detalle; usar la query dedicada como fuente para la galería porque se invalida sola tras mutaciones).
- **Estructura:**
  1. **Header:** breadcrumbs · nombre (Bricolage 38) · eyebrow mono con coordenadas (`CoordinatesLabel`, click = copiar) · chips de categorías (colores) y tags · rating grande (estrella + `4.6` + "(23 reseñas)" con anchor a la sección) · `StatusBadge` si el viewer es owner/admin · acciones: "Guardar" (AddToCollectionDialog), "Compartir" (copiar URL), y menú ⋯ para owner/admin (Editar, Eliminar → soft-delete con ConfirmDialog + toast Deshacer).
  2. **Galería:** si hay media → `MediaGallery` (portada grande + tira de thumbnails; lightbox con teclado; videos con ícono play). Si no hay → banner cartográfico generado (retícula + color de categoría) con botón "Agregar fotos" para owner/admin.
  3. **Cuerpo en 2 columnas (desktop):**
     - Izquierda: descripción · sección **Reseñas**: `RatingDistribution` (barras 5→1 calculadas de la lista) + `ReviewList` con paginación client-side (5 por página) + botón "Escribir reseña" (si autenticado y sin review propia; si ya tiene → "Editar tu reseña"). `ReviewCard`: avatar (inicial si no hay `avatarUrl`), userName, estrellas, fecha relativa, "Visitado el …" si existe, título y cuerpo; menú editar/eliminar solo para el autor o Admin.
     - Derecha (sidebar sticky): `LocationMap` (pin único, popup con dirección) · dirección formateada + botón "Cómo llegar" (link a Google Maps con lat/lng) · `OpeningHoursDisplay` (7 días, hoy resaltado, "Cerrado" en muted; ocultar sección si no hay horarios) · teléfono (tel:) y sitio web (rel noopener) · metadata mono (slug, creado el).
  4. **Gestión de media** (solo owner/admin, bajo la galería): grid de `MediaCard` con acciones editar/eliminar/portada (§3.8) + botón "Agregar media" → `MediaFormDialog` (url con preview en vivo, thumbnailUrl, caption, tipo, sortOrder).
- **Responsive:** columnas se apilan (mapa y horarios después de la descripción); galería full-bleed en mobile; barra de acciones inferior fija en mobile con "Guardar" y "Escribir reseña".

### 9.6 LocationNewPage `/locations/new` 🔒

Formulario multi-paso con `Tabs` (desktop) / acordeón secuencial (mobile). **El único momento donde se capturan coordenadas, categorías, tags y horarios (§3.10.5).**

1. **Información:** nombre → autogenera slug editable (slugify: minúsculas, sin acentos, guiones; validar patrón `^[a-z0-9-]+$` y unicidad best-effort contra `['locations']` cargado) · descripción (contador /4000) · teléfono · sitio web.
2. **Dirección:** campos de `Address` agrupados (calle + números en una fila, colonia/ciudad/estado, CP + país con select ISO-2 de países comunes).
3. **Ubicación:** `LocationPicker` — mapa con pin arrastrable + click para colocar; inputs numéricos lat/lng sincronizados (paso 0.0001); botón "Usar mi ubicación". Obligatorio antes de publicar.
4. **Clasificación:** categorías multi-select con radio "principal" (exactamente una `isPrimary`) · tags con `TagSelector` (autocompletar sobre `['tags']`; crear tag inline si es Admin).
5. **Horarios:** `OpeningHoursEditor` — fila por día (switch abierto/cerrado + time inputs `HH:mm`, enviar `HH:mm:00`); acción "Copiar a todos los días".
6. **Publicación:** radio cards `Draft` ("Solo tú lo ves") / `Published` ("Visible para todos") · switch `isPublic` · resumen de validación.

Submit → POST con el grafo completo (`status`, `coordinates` GeoJSON; el `ownerId` lo asigna el servidor desde el token) → toast "Lugar creado" → navegar al detalle. Si el usuario agrega fotos en el paso 6 (opcional, lista de URLs), hacer POSTs a `/api/media` tras crear. Guardar borrador local (localStorage) contra pérdida accidental; avisar con dialog al salir con cambios sin guardar.

### 9.7 LocationEditPage `/locations/:id/edit` 🔒 owner/admin

- Mismo layout de tabs, pero **solo Información, Dirección y Publicación son editables**.
- Ubicación, Clasificación y Horarios se muestran **en solo lectura** con nota: "El API actual no permite editar esto después de crear el lugar" (mapa estático, chips, tabla de horarios).
- La gestión de media vive en el detalle (§9.5.4), no aquí.
- PUT reenvía `coordinates` y demás campos cargados (§3.4). 404 → mensaje de concurrencia (§3.10.11).

### 9.8 CategoriesPage `/categories`

- **Datos:** `['categories']`; árbol construido en cliente por `parentCategoryId`, ordenado por `sortOrder`.
- **Estructura:** header + (solo Admin) botón "Nueva categoría" · árbol de 2 niveles: card por categoría raíz (disco de color + ícono + nombre + descripción truncada) con children como chips indentados debajo. Click → detalle. Acciones admin por fila (⋯ editar/eliminar).
- `CategoryFormDialog`: nombre → slug auto · descripción · `CategoryIconPicker` (grid buscable de ~40 Lucide curados: utensils, coffee, trees, landmark, music, dumbbell, store, hotel, beer, camera…) · `ColorPicker` (12 swatches + input hex validado `#RRGGBB`) · sortOrder · select de categoría padre (solo raíces, para mantener 2 niveles).
- Eliminar con lugares/hijos → 500 → mensaje específico (§3.5).
- **Responsive:** grid 1→2→3; dialog full-screen en mobile.

### 9.9 CategoryDetailPage `/categories/:id`

Header con identidad de la categoría (disco grande de color, nombre, descripción, breadcrumb con el padre si existe) · chips de subcategorías · grid de lugares asociados (de `locationCategories[].location`, filtrando `Published+isPublic` para no-admin) reutilizando `LocationCard` · CTA "Explorar {nombre} en el mapa" → `/locations?view=map&categoryId={id}`.

### 9.10 TagsPage `/tags`

- **Datos:** `['tags']`.
- Nube de tags: `TagBadge` escalado en 3 tamaños por `locationTags.length` (no `usageCount`), orden descendente, buscador local arriba. Conteo en mono dentro del badge (`wifi-gratis · 12`).
- Admin: botón "Nuevo tag" + edición/eliminación vía `TagFormDialog` (nombre, slug auto, descripción).
- **Responsive:** la nube fluye con flex-wrap; en mobile lista compacta de 2 columnas.

### 9.11 TagDetailPage `/tags/:id`

Header (nombre en mono estilo etiqueta, descripción, conteo) + grid de lugares que lo usan (misma regla de visibilidad) + link "Buscar lugares con este tag cerca de mí" → `/locations?view=map&tagIds={id}`.

### 9.12 CollectionsPage `/collections` 🔒

- **Datos:** `['collections', userId]`.
- Grid de `CollectionCard`: nombre, badge de visibilidad (candado Private / eslabón Unlisted / globo Public, en mono), nº de lugares, descripción truncada, mosaico de hasta 4 discos de color de las categorías de sus items. Botón "Nueva colección" → `CollectionFormDialog` (nombre, descripción, radio cards de visibilidad con explicación de cada una).
- Empty state: "Crea tu primera colección para guardar lugares" + CTA.

### 9.13 CollectionDetailPage `/collections/:id`

- **Datos:** `['collections','detail', id]`.
- Privacidad (§3.9): el servidor devuelve 404 para privadas ajenas → `ErrorState` "Esta colección es privada o ya no existe" (la petición lleva Bearer automáticamente si hay sesión, así el dueño sí la ve).
- Header: nombre, badge visibilidad, owner (userName), descripción; acciones owner: editar (dialog), eliminar (confirm + toast Deshacer), "Copiar enlace" si no es Private.
- Lista de items ordenada por `sortOrder`: `LocationCard` extendida con las `notes` del item (en cursiva, estilo anotación de margen) y botón quitar (owner). Sin drag & drop (§3.10.9).
- `AddToCollectionDialog` (global, se abre desde cualquier LocationCard/detalle): lista de colecciones propias con checkmark si el lugar ya está, campo notas opcional, acción crear colección inline. Item ya existente → el backend responde 400 string → toast informativo "Ya está en esa colección".

### 9.14 ProfilePage `/profile` 🔒

- **Datos:** claims del token + `['collections', userId]`.
- Card de identidad: avatar (inicial sobre disco `--primary`), userName en display, roles como badges mono, botón "Cambiar contraseña" (`ChangePasswordDialog`).
- Sección "Mis colecciones" (reuso de grid) y "Mis lugares" (filtrar `['locations']` por `ownerId === userId`, mostrando estado Draft/Published — aquí el owner ve sus borradores).
- Nota explícita: sin edición de avatar/nombre ni "mis reseñas" (§3.10.7).

### 9.15 AdminDashboardPage `/admin` 🔒 Admin

- **Resumen:** stat-tiles calculados client-side de las queries existentes — total de lugares (desglose Published/Draft/Archived), categorías, tags, reseñas totales (suma de `reviewCount`), rating promedio global. Números en Bricolage, etiquetas en mono.
- **Lugares:** tabla (nombre, categoría primaria, estado, rating, creado) con búsqueda y filtro por estado; acciones por fila: ver, editar, **soft-delete** (confirm + toast "Deshacer" que llama restore), publicar/archivar rápido (PUT de `status`). En mobile la tabla se convierte en cards apiladas.
- **Categorías / Tags:** las mismas gestiones de §9.8/§9.10 embebidas.
- Sin papelera (§3.10.8): incluir nota en la UI "Los elementos eliminados solo pueden restaurarse con Deshacer inmediato".

### 9.16 NotFoundPage `*`

Ilustración CSS del sistema: pin caído sobre retícula con "404" en Bricolage gigante y coordenadas absurdas en mono (`0.0000° N · 0.0000° O — aquí no hay nada`). Texto "La página que buscas no está en el mapa." + botones "Volver al inicio" y "Explorar lugares".

---

## 10. Componentes geoespaciales

### 10.1 Conversión de coordenadas (regla de oro)

```typescript
// lib/geo.ts
import type { GeoJSONPoint } from "@/types/models";

/** API (GeoJSON [lng,lat]) → Leaflet ([lat,lng]) */
export const toLeaflet = (p: GeoJSONPoint): [number, number] =>
  [p.coordinates[1], p.coordinates[0]];

/** Leaflet → API */
export const toGeoJSON = (lat: number, lng: number): GeoJSONPoint =>
  ({ type: "Point", coordinates: [lng, lat] });

/** Distancia en metros entre dos puntos (para search, que no la devuelve) */
export function haversineMeters(a: {lat:number;lng:number}, b: {lat:number;lng:number}): number { /* … */ }

/** "850 m" | "1.2 km" — para chips de distancia */
export function formatDistance(meters: number): string { /* … */ }
```

Prohibido pasar arrays "a mano" entre sistemas: siempre por estas dos funciones. Incluir un test mental en el código de ejemplo: CDMX es `lat 19.4326, lng -99.1332` → GeoJSON `[-99.1332, 19.4326]`.

### 10.2 Componentes

| Componente | Comportamiento |
|---|---|
| `LocationMap` | Pin único no interactivo + popup con nombre/dirección. Altura responsive (§11). Scroll-zoom desactivado hasta click (evita secuestrar el scroll de la página). |
| `LocationPicker` | Pin arrastrable + click para recolocar + inputs lat/lng sincronizados + "Usar mi ubicación" (`use-geolocation`). Emite GeoJSON. |
| `NearbyMap` | Pins por categoría (divIcon §7.5), círculo del radio activo (stroke `--route` 1px, fill 6 %), popup mini-card, sincronía hover lista⇄pin, botón "Buscar en esta zona". |
| `SearchRadiusSlider` | Slider shadcn con stops 100 m / 500 m / 1 km / 5 km / 10 km / 50 km; valor mostrado en mono; debounce 400 ms antes de re-query. |

- Tiles: `https://tile.openstreetmap.org/{z}/{x}/{y}.png` con atribución obligatoria `© OpenStreetMap contributors`.
- `use-geolocation`: pide permiso solo tras gesto del usuario (nunca al cargar); estados `idle/granted/denied/unavailable`; fallback al centro de `.env`; si se niega, mostrar hint "Activa la ubicación para ver distancias".

---

## 11. Reglas responsive globales

Mobile-first con breakpoints Tailwind: `sm 640` · `md 768` · `lg 1024` · `xl 1280`.

| Elemento | < 640 | 640–1024 | > 1024 |
|---|---|---|---|
| Grid de cards | 1 col | 2 cols | 3 cols (4 en xl para categorías) |
| Navbar | Hamburguesa + Sheet | Compacta | Completa con búsqueda |
| Formularios | 1 col, tabs→acordeón | 1–2 cols | 2 cols agrupadas + tabs |
| Mapas | altura 300 px (full-height en modo mapa) | 400 px | 500 px |
| Tablas admin | Cards apiladas | Scroll horizontal | Tabla completa |
| Dialogs | Full-screen (`Sheet` inferior si es acción rápida) | Centrados | Centrados max-w-lg |
| Detalle de lugar | 1 col + action bar inferior fija | 1 col | 2 cols con sidebar sticky |

Además: sin scroll horizontal de página en ningún ancho (verificar 320 px); imágenes `max-w-full` + `aspect-ratio` reservado (sin layout shift); `safe-area-inset` en la action bar de mobile; tipografía fluida solo en el hero (`clamp()`).

---

## 12. Estados de UI y manejo de errores

Todo componente con datos remotos implementa los 4 estados:

1. **Loading:** `LoadingSkeleton` con la silueta real del contenido (cards fantasma en grids, filas en tablas). Nunca spinner a pantalla completa salvo el bootstrap de sesión.
2. **Empty:** `EmptyState` con ilustración CSS del sistema (pin/retícula), mensaje específico y acción ("Sin resultados con estos filtros" + "Limpiar filtros").
3. **Error:** `ErrorState` con mensaje según la tabla siguiente + botón "Reintentar" (`refetch`).
4. **Success:** contenido.

**Mapa de errores → mensaje (`lib/api-error.ts`):**

| Situación | Mensaje al usuario |
|---|---|
| Network / timeout | "No hay conexión con el servidor. Revisa tu red e intenta de nuevo." |
| 400 con `errors` | Pintar cada error bajo su campo (RHF `setError`); toast solo si no hay campo asociado |
| 400 string | Mostrar el texto traducido al contexto (p. ej. register → "Ese usuario o email ya existe.") |
| 401 tras refresh fallido | "Tu sesión expiró. Inicia sesión de nuevo." |
| 403 | "No tienes permisos para esta acción." |
| 404 en GET | EmptyState "No encontramos este {recurso}." |
| 404 en PUT/DELETE | "El registro no existe o fue modificado por alguien más. Recarga e intenta de nuevo." |
| 409 en mutación | Traducir el `detail`: "Ese slug ya existe", "Ya reseñaste este lugar", "Ya hay una portada", "La categoría tiene lugares o subcategorías". |
| 500 resto | "Algo salió mal en el servidor. Intenta de nuevo en unos momentos." |

**Feedback:**
- Toasts (Sonner, esquina inferior derecha, 4 s) para todo éxito de mutación: "Lugar publicado", "Reseña eliminada", "Guardado en {colección}".
- Soft-deletes: toast con acción **"Deshacer"** (llama a restore; solo locations lo soportan — para el resto el toast es informativo).
- `ConfirmDialog` para todo destructivo, nombrando el objeto: "¿Eliminar 'Café de la Esquina'? Podrás deshacer esta acción por unos segundos."
- Optimistic updates **solo** en: quitar item de colección y eliminar review propia (rollback si falla). Todo lo demás: mutación → invalidate → refetch (el recálculo de rating es server-side).
- Botones de submit: estado loading con spinner inline + disabled; nunca doble submit.

---

## 13. Roles y permisos en la UI

Vigente en la UI **y en el servidor** desde el 2026-07-19 (401 sin sesión, 403 sin permiso). Excepción server-side: los listados públicos siguen devolviendo Draft/Archived/no públicos, así que filtrar borradores en vistas públicas sigue siendo tarea del cliente (§3.10.4):

| Acción | Anónimo | User | Owner del recurso | Admin |
|---|---|---|---|---|
| Ver lugares/categorías/tags/reseñas públicos | ✅ | ✅ | ✅ | ✅ |
| Ver Draft/Archived/no públicos | — | — | ✅ (los suyos) | ✅ |
| Crear lugar | — (CTA → login) | ✅ | — | ✅ |
| Editar / soft-delete / restore lugar | — | — | ✅ | ✅ |
| Gestionar media de un lugar | — | — | ✅ | ✅ |
| Crear reseña | — (CTA → login) | ✅ (1 por lugar) | — | ✅ |
| Editar/eliminar reseña | — | autor | autor | ✅ |
| Colecciones (CRUD + items) | — | ✅ (propias) | ✅ | ✅ |
| Gestionar categorías y tags | — | — | — | ✅ |
| Dashboard admin | — | — | — | ✅ |

Regla de UX: para el anónimo, las acciones que requieren cuenta **no se ocultan** — se muestran y al pulsarlas llevan a `/login` con retorno (`state.from`), porque son el funnel de registro. Lo que sí se oculta por completo: edición ajena y todo lo admin.

---

## 14. Validación (Zod) — alineada a los límites reales de la BD

```typescript
// types/forms.ts (extracto normativo)
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
  name: z.string().max(200).optional(), street: z.string().max(200).optional(),
  exteriorNumber: z.string().max(20).optional(), interiorNumber: z.string().max(20).optional(),
  neighborhood: z.string().max(120).optional(), city: z.string().max(120).optional(),
  state: z.string().max(120).optional(), postalCode: z.string().max(20).optional(),
  countryCode: z.string().length(2, "Código de 2 letras").optional().or(z.literal("")),
});

export const locationSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio").max(200),
  slug: z.string().min(1).max(220).regex(slugRegex, "Solo minúsculas, números y guiones"),
  description: z.string().max(4000).optional(),
  coordinates: z.object({ type: z.literal("Point"),
    coordinates: z.tuple([z.number().min(-180).max(180), z.number().min(-90).max(90)]) }),
  address: addressSchema,
  status: z.enum(["Draft", "Published", "Archived"]),
  isPublic: z.boolean(),
  websiteUrl: z.string().url("URL inválida").max(2048).optional().or(z.literal("")),
  phoneNumber: z.string().max(32).optional(),
});

export const categorySchema = z.object({
  name: z.string().min(1).max(120),
  slug: z.string().min(1).max(140).regex(slugRegex),
  description: z.string().max(1000).optional(),
  iconName: z.string().max(64).optional(),
  colorHex: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Formato #RRGGBB").optional().or(z.literal("")),
  sortOrder: z.number().int().min(0),
  parentCategoryId: z.string().uuid().optional().or(z.literal("")),
});

export const tagSchema = z.object({
  name: z.string().min(1).max(60),
  slug: z.string().min(1).max(80).regex(slugRegex),
  description: z.string().max(500).optional(),
});

export const reviewSchema = z.object({
  rating: z.number().int().min(1, "Elige una calificación").max(5),
  title: z.string().max(200).optional(),
  body: z.string().max(4000).optional(),
  visitedOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal("")),
});

export const collectionSchema = z.object({
  name: z.string().min(1).max(150),
  description: z.string().max(1000).optional(),
  visibility: z.enum(["Private", "Unlisted", "Public"]),
});

export const mediaSchema = z.object({
  url: z.string().url("URL inválida").max(2048),
  thumbnailUrl: z.string().url().max(2048).optional().or(z.literal("")),
  caption: z.string().max(300).optional(),
  type: z.enum(["Image", "Video"]),
  isCover: z.boolean(), sortOrder: z.number().int().min(0),
});
```

`lib/slug.ts`: minúsculas → quitar acentos (`normalize("NFD")` + strip diacríticos) → no alfanumérico a `-` → colapsar/recortar guiones. El slug se regenera del nombre mientras el usuario no lo haya editado a mano.

---

## 15. Orden de implementación

| Fase | Entregable verificable |
|---|---|
| 1. Fundaciones | Proyecto Vite + Tailwind 4 + shadcn; tokens y fuentes (§7); tipos (§4); axios (§5.2); stores; AppShell + Navbar + Footer + dark mode; rutas con placeholders. |
| 2. Auth | Login/Register/Logout/ChangePassword completos contra la API; refresh automático; ProtectedRoute; bootstrap de sesión. |
| 3. Explorar + Detalle | LocationCard/Grid/filtros/paginación; Home completa; detalle con mapa, horarios, galería (lectura); componentes geo (§10). |
| 4. Crear/Editar + Media | Formulario multi-tab con LocationPicker; edición restringida (§9.7); gestión de media; soft-delete/restore con Deshacer. |
| 5. Reviews + Colecciones | Review CRUD con invalidación de rating; distribución de estrellas; colecciones CRUD + AddToCollectionDialog. |
| 6. Categorías/Tags/Admin + pulido | Gestión admin; dashboard; NotFound; barrido final de estados, a11y, responsive 320→1536 y dark mode. |

Cada fase termina probada contra la API local (`dotnet run` → `http://localhost:5113`, usuario `admin`/`Admin123!`).

## 16. Criterios de aceptación (checklist final)

- [ ] Todas las páginas usables y sin scroll horizontal en 320, 375, 768, 1024, 1280 y 1536 px.
- [ ] Dark y light mode completos (incluidos mapas, skeletons y estados vacíos); toggle persistido.
- [ ] Los 4 estados de UI presentes en cada vista con datos; ningún "flash" de vacío durante loading.
- [ ] Coordenadas correctas ida y vuelta (pin en CDMX = `[-99.1332, 19.4326]` en el body del POST).
- [ ] Refresh de token automático y transparente en un 401; sesión restaurada al recargar la página.
- [ ] Tras crear/editar/eliminar una review, el rating del lugar se actualiza en pantalla sin recargar.
- [ ] Soft-delete de lugar usa `/soft-delete` (nunca DELETE) y el toast "Deshacer" restaura.
- [ ] Cambiar portada de media sigue el orden correcto de PUTs y un 409 inesperado se muestra con mensaje claro.
- [ ] Ningún dato sensible del `user` incluido (passwordHash, refreshToken, email ajeno) se muestra ni persiste.
- [ ] Navegación completa por teclado con focus visible; `prefers-reduced-motion` respetado; contraste AA.
- [ ] La UI aplica la matriz de permisos de §13 (el servidor también la exige: manejar 401 → refresh y 403 → mensaje claro).
- [ ] Ningún llamado a endpoints/parámetros inexistentes (revisar contra §3).

---

## Apéndice A — Discrepancias detectadas entre la documentación previa y el código

Resueltas a favor del código fuente (verificación del 2026-07-19):

| # | Afirmación en docs | Realidad verificada en el código |
|---|---|---|
| 1 | `rmrLocations_help.md`: rutas en plural (`/api/locations`, `/api/categories`…) | Rutas en **singular**: `/api/location`, `/api/category`, `/api/tag`, `/api/review`, `/api/media`, `/api/collection` (case-insensitive). |
| 2 | help: "todos los endpoints requieren autenticación; escritura requiere Admin" | Al verificar (commit `56ce2bb`) los controllers de datos no tenían `[Authorize]`. **Corregido el 2026-07-19:** ahora rige la matriz de §13 (lecturas públicas, escrituras con sesión y dueño/Admin, categorías y tags solo Admin). |
| 3 | help: nearby con `lat`, `lng`, `radiusKm`, `limit` | Parámetros reales: `latitude`, `longitude`, `radiusMeters` (default 5000), `take` (default 20). |
| 4 | help: search con `name`, `categoryId`, `tagIds[]` | Sin parámetro de texto. Reales: `latitude`/`longitude` (requeridos), `radiusMeters`, `categoryIds`/`tagIds` (CSV). |
| 5 | help: refresh-token con solo `{ refreshToken }` | Requiere `{ userId, refreshToken }`. |
| 6 | help: DELETE location = "hard delete" | Todo DELETE de agregados es **soft delete** (interceptor de SaveChanges), y el DELETE simple **no cascadea** — usar `/soft-delete`. |
| 7 | Frontend.md: API en `https://localhost:5113` | 5113 es **HTTP**; HTTPS local es 7105. |
| 8 | Ambos: PUT actualiza la entidad completa | PUT de location solo actualiza escalares + address (sin coordenadas/categorías/tags/horarios). PUTs de las demás entidades también son parciales (campos listados en §3). |
| 9 | Frontend.md: review duplicada/rating inválido → 400 | Llegan como **500** (constraint de BD + handler global). |
| 10 | Frontend.md: colecciones con drag & drop para reordenar | No existe endpoint para actualizar `sortOrder` de items. |
| 11 | Frontend.md: login valida email | El login busca **solo por `userName`**; el campo email debe enviarse pero se ignora. |
| 12 | Frontend.md: register response 200 con tokens implícitos en el flujo | Register devuelve el usuario **sin tokens** → login automático posterior. |
| 13 | Frontend.md: lista de locations con imagen de portada | `GET /api/location` **no incluye media** → cards sin fotos (ficha cartográfica §7.4). |
| 14 | Frontend.md: página de perfil con reviews del usuario y avatar editable | No existen endpoints de usuario ni de reviews-por-usuario. |
| 15 | Frontend.md: favoritos (prioridad baja) | Sin endpoints de favoritos — fuera de alcance v1. |
| 16 | help: credenciales admin con login por email | Login del seed: userName `admin`, password `Admin123!` (el email `admin@rmrlocations.com` no sirve para login). |
| 17 | Ambos docs (y la lectura del código) implicaban que `POST /api/location` acepta el grafo completo | En la práctica la validación implícita de MVC exigía las navegaciones non-nullable de los join models y el POST con `locationCategories`/`locationTags`/`openingHours` devolvía **400**. **Corregido el 2026-07-19** (navegaciones anulables): el grafo se inserta correctamente. |
| 18 | help/spec: "no se puede eliminar categoría con lugares (Restrict → error)" | El DELETE soft nunca disparaba el FK: la categoría se borraba dejando referencias colgantes. **Corregido el 2026-07-19:** validación explícita de dependencias → **409**. |

## Apéndice B — Mejoras recomendadas al backend (no bloquean el frontend v1)

Ordenadas por impacto; las #1–4 ya fueron aplicadas, y el frontend está especificado para funcionar sin el resto y aprovecharlas cuando lleguen:

1. ✅ **Hecho (2026-07-19) — serialización de `User`:** `[JsonIgnore]` en `PasswordHash`, `Email`, `RefreshToken` y `RefreshTokenExpiryTime` (`Models/User.cs`). Verificado: ya no viajan en reviews, colecciones ni media.
2. ✅ **Hecho (2026-07-19) — `[Authorize]` en controllers de datos:** matriz de §13 aplicada — lecturas anónimas, escrituras con sesión, dueño-o-Admin para editar/borrar, Admin para categorías/tags; `ownerId`/`userId`/`uploadedByUserId` se fijan desde el token.
3. ✅ **Hecho (2026-07-19):** constraints de BD → **409** (únicos y dependencias de categoría) o **400** (checks y FKs inexistentes) con `detail` específico, vía `DbErrorMapper` en los controllers y en `GlobalExceptionHandler`.
4. ✅ **Hecho (2026-07-19):** `GET /api/location` con `?name=` (ILIKE + trigram), filtros `categoryId`/`tagIds`/`status`, orden `sort` y paginación `PagedResult` (máx 100); `search` geoespacial también acepta `name`. (Categorías/tags/reviews sin paginar: listas pequeñas.)
5. 🟡 **PUT de coordenadas** y endpoints para gestionar categorías/tags/horarios de un lugar existente.
6. 🟢 Endpoints de **usuario** (GET perfil, PATCH displayName/avatar, reviews por usuario).
7. 🟢 Endpoints de **favoritos** (la tabla `user_favorite_locations` ya existe).
8. 🟢 **Reordenar items** de colección (PUT sortOrder).
9. 🟢 Listar **eliminados** para una papelera admin (`IgnoreQueryFilters` + rol Admin).
10. 🟢 Incrementar **`Tag.UsageCount`** al asociar tags (hoy solo se decrementa).
11. 🟢 Incluir la **media de portada** en `GET /api/location` (o un campo `coverUrl` proyectado) para cards con foto.
12. 🟢 Agregar el **origen del frontend de producción al CORS** antes del despliegue.
13. 🟢 Register: devolver **201** y considerar devolver tokens para evitar el doble round-trip.
