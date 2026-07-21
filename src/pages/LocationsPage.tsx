import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  MapPin,
  List,
  Map,
  Star,
  SlidersHorizontal,
  X,
  ArrowUpDown,
  Crosshair,
} from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import LoadingSkeleton from "@/components/shared/LoadingSkeleton";
import EmptyState from "@/components/shared/EmptyState";
import ErrorState from "@/components/shared/ErrorState";
import { cn } from "@/lib/utils";
import api from "@/lib/axios";
import { formatCoordinates, formatDistance, haversineMeters } from "@/lib/geo";
import { SEARCH_DEBOUNCE_MS } from "@/lib/constants";
import type { Location, Category, Tag, PagedResult } from "@/types/models";

/* ────────────────────────────────────────────── */
/*  Sort options                                  */
/* ────────────────────────────────────────────── */
const SORT_OPTIONS = [
  { value: "name", label: "Nombre" },
  { value: "rating", label: "Calificacion" },
  { value: "recent", label: "Recientes" },
] as const;

/* ────────────────────────────────────────────── */
/*  LocationsPage                                 */
/* ────────────────────────────────────────────── */
export default function LocationsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  /* ── Read filters from URL ────────────────── */
  const q = searchParams.get("q") ?? "";
  const categoryId = searchParams.get("categoryId") ?? "";
  const sort = searchParams.get("sort") ?? "";
  const view = searchParams.get("view") ?? "list";
  const page = parseInt(searchParams.get("page") ?? "1", 10);

  /* ── Local state ──────────────────────────── */
  const [searchInput, setSearchInput] = useState(q);
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(
    null,
  );
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  /* ── Sync debounced search to URL ─────────── */
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams);
      if (searchInput.trim()) {
        params.set("q", searchInput.trim());
      } else {
        params.delete("q");
      }
      params.set("page", "1");
      setSearchParams(params, { replace: true });
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchInput]);

  /* ── Try geolocation for distance ─────────── */
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) =>
          setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {},
        { timeout: 5000, enableHighAccuracy: false },
      );
    }
  }, []);

  /* ── Helpers ──────────────────────────────── */
  const setParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams);
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.set("page", "1");
      setSearchParams(params, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const clearFilters = useCallback(() => {
    setSearchParams({}, { replace: true });
    setSearchInput("");
  }, [setSearchParams]);

  const setPage = useCallback(
    (p: number) => {
      const params = new URLSearchParams(searchParams);
      params.set("page", String(p));
      setSearchParams(params, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  /* ── Build query string for API ───────────── */
  const buildQueryString = useCallback(() => {
    const parts: string[] = [];
    if (q) parts.push(`name=${encodeURIComponent(q)}`);
    if (categoryId) parts.push(`categoryId=${encodeURIComponent(categoryId)}`);
    if (sort) parts.push(`sort=${encodeURIComponent(sort)}`);
    parts.push(`page=${page}`);
    parts.push("pageSize=20");
    return parts.join("&");
  }, [q, categoryId, sort, page]);

  /* ── Queries ──────────────────────────────── */
  const locationsQuery = useQuery({
    queryKey: ["locations", { q, categoryId, sort, page }],
    queryFn: () =>
      api
        .get<PagedResult<Location>>(`/api/location?${buildQueryString()}`)
        .then((r) => r.data),
    staleTime: 60_000,
  });

  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: () =>
      api.get<Category[]>("/api/category").then((r) => r.data),
    staleTime: 120_000,
  });

  /* ── Derived ──────────────────────────────── */
  const locations = locationsQuery.data?.items ?? [];
  const totalPages = locationsQuery.data?.totalPages ?? 1;
  const currentPage = locationsQuery.data?.page ?? page;
  const categories = categoriesQuery.data ?? [];

  /* ══════════════════════════════════════════════ */
  /*  RENDER                                       */
  /* ══════════════════════════════════════════════ */
  return (
    <div>
      <PageHeader
        title="Explorar lugares"
        subtitle="Encuentra el lugar perfecto para tu proxima salida"
      />

      {/* ── Filter bar ─────────────────────────── */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "0.75rem",
          alignItems: "center",
          marginBottom: "1.5rem",
          padding: "1rem",
          borderRadius: "12px",
          background: "var(--surface)",
          border: "1px solid var(--border)",
        }}
      >
        {/* Search input */}
        <div style={{ position: "relative", flex: 1, minWidth: "200px" }}>
          <Search
            size={16}
            style={{
              position: "absolute",
              left: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--ink-muted)",
              pointerEvents: "none",
            }}
          />
          <input
            type="text"
            placeholder="Buscar por nombre…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            style={{
              width: "100%",
              padding: "9px 12px 9px 36px",
              borderRadius: "8px",
              border: "1px solid var(--border)",
              background: "var(--background)",
              color: "var(--ink)",
              fontFamily: "var(--sans)",
              fontSize: "0.85rem",
              outline: "none",
              transition: "border-color 0.15s",
            }}
            onFocus={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor =
                "var(--primary)";
            }}
            onBlur={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor =
                "var(--border)";
            }}
          />
        </div>

        {/* Category select */}
        <select
          value={categoryId}
          onChange={(e) => setParam("categoryId", e.target.value)}
          style={{
            padding: "9px 32px 9px 12px",
            borderRadius: "8px",
            border: "1px solid var(--border)",
            background: "var(--background)",
            color: "var(--ink)",
            fontFamily: "var(--sans)",
            fontSize: "0.85rem",
            outline: "none",
            cursor: "pointer",
            appearance: "none",
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236E6A85' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "right 10px center",
            minWidth: "150px",
          }}
        >
          <option value="">Todas las categorias</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>

        {/* Sort dropdown */}
        <div style={{ position: "relative" }}>
          <ArrowUpDown
            size={14}
            style={{
              position: "absolute",
              left: "10px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--ink-muted)",
              pointerEvents: "none",
            }}
          />
          <select
            value={sort}
            onChange={(e) => setParam("sort", e.target.value)}
            style={{
              padding: "9px 32px 9px 30px",
              borderRadius: "8px",
              border: "1px solid var(--border)",
              background: "var(--background)",
              color: "var(--ink)",
              fontFamily: "var(--sans)",
              fontSize: "0.85rem",
              outline: "none",
              cursor: "pointer",
              appearance: "none",
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236E6A85' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 10px center",
            }}
          >
            <option value="">Ordenar</option>
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* View toggle */}
        <div
          style={{
            display: "flex",
            borderRadius: "8px",
            border: "1px solid var(--border)",
            overflow: "hidden",
          }}
        >
          <button
            onClick={() => setParam("view", "list")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "9px 12px",
              border: "none",
              cursor: "pointer",
              background:
                view === "list" ? "var(--primary)" : "var(--background)",
              color: view === "list" ? "#fff" : "var(--ink-muted)",
              transition: "background 0.15s",
            }}
            title="Vista lista"
          >
            <List size={16} />
          </button>
          <button
            onClick={() => setParam("view", "map")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "9px 12px",
              border: "none",
              borderLeft: "1px solid var(--border)",
              cursor: "pointer",
              background:
                view === "map" ? "var(--primary)" : "var(--background)",
              color: view === "map" ? "#fff" : "var(--ink-muted)",
              transition: "background 0.15s",
            }}
            title="Vista mapa"
          >
            <Map size={16} />
          </button>
        </div>

        {/* Clear filters */}
        <button
          onClick={clearFilters}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.3rem",
            padding: "9px 14px",
            borderRadius: "8px",
            border: "1px solid var(--border)",
            background: "transparent",
            color: "var(--ink-muted)",
            cursor: "pointer",
            fontFamily: "var(--sans)",
            fontSize: "0.8rem",
            fontWeight: 500,
            transition: "color 0.15s, border-color 0.15s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.color = "var(--danger)";
            (e.currentTarget as HTMLElement).style.borderColor =
              "var(--danger)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.color = "var(--ink-muted)";
            (e.currentTarget as HTMLElement).style.borderColor =
              "var(--border)";
          }}
        >
          <X size={14} />
          Limpiar filtros
        </button>
      </div>

      {/* ── Map view placeholder ──────────────── */}
      {view === "map" && (
        <div
          style={{
            width: "100%",
            height: "480px",
            borderRadius: "12px",
            border: "1px solid var(--border)",
            background:
              "repeating-linear-gradient(45deg, var(--background) 0px, var(--background) 20px, var(--surface) 20px, var(--surface) 40px)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.75rem",
            color: "var(--ink-muted)",
            marginBottom: "1.5rem",
            fontFamily: "var(--display)",
            fontSize: "1.1rem",
            fontWeight: 600,
          }}
        >
          <MapPin size={32} style={{ color: "var(--primary)" }} />
          <span>Mapa interactivo</span>
          <span
            style={{
              fontFamily: "var(--sans)",
              fontSize: "0.85rem",
              fontWeight: 400,
            }}
          >
            La vista de mapa estara disponible en una proxima fase
          </span>
        </div>
      )}

      {/* ── Loading state ─────────────────────── */}
      {locationsQuery.isLoading && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "1rem",
          }}
        >
          <LoadingSkeleton variant="card" count={6} />
        </div>
      )}

      {/* ── Error state ───────────────────────── */}
      {locationsQuery.isError && (
        <ErrorState
          message={
            (locationsQuery.error as Error)?.message ??
            "No pudimos cargar los lugares"
          }
          onRetry={() => locationsQuery.refetch()}
        />
      )}

      {/* ── Empty state ───────────────────────── */}
      {locationsQuery.isSuccess && locations.length === 0 && (
        <EmptyState
          icon={<MapPin size={28} />}
          title="Sin resultados"
          description={
            q || categoryId || sort
              ? "Intenta ajustar los filtros de busqueda."
              : "Aun no hay lugares registrados."
          }
          action={
            q || categoryId || sort
              ? { label: "Limpiar filtros", onClick: clearFilters }
              : undefined
          }
        />
      )}

      {/* ── Location cards grid ────────────────── */}
      {locationsQuery.isSuccess && locations.length > 0 && (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fill, minmax(280px, 1fr))",
              gap: "1rem",
              marginBottom: "1.5rem",
            }}
          >
            {locations.map((loc) => {
              const distance =
                userPos &&
                haversineMeters(userPos, {
                  lat: loc.latitude,
                  lng: loc.longitude,
                });
              const primaryCat = loc.locationCategories?.find(
                (lc) => lc.isPrimary,
              )?.category;

              return (
                <Link
                  key={loc.id}
                  to={`/locations/${loc.id}`}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.6rem",
                    padding: "1.25rem",
                    borderRadius: "12px",
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    borderLeft: primaryCat?.colorHex
                      ? `4px solid ${primaryCat.colorHex}`
                      : "4px solid var(--border)",
                    textDecoration: "none",
                    transition: "box-shadow 0.15s, transform 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.boxShadow =
                      "0 4px 16px rgba(0,0,0,0.06)";
                    (e.currentTarget as HTMLElement).style.transform =
                      "translateY(-2px)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.boxShadow = "none";
                    (e.currentTarget as HTMLElement).style.transform = "none";
                  }}
                >
                  {/* Category chip */}
                  {primaryCat && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.35rem",
                        fontSize: "0.75rem",
                        color: primaryCat.colorHex ?? "var(--ink-muted)",
                        fontWeight: 600,
                      }}
                    >
                      <span
                        style={{
                          width: "8px",
                          height: "8px",
                          borderRadius: "50%",
                          background: primaryCat.colorHex ?? "var(--border)",
                          display: "inline-block",
                        }}
                      />
                      {primaryCat.name}
                    </div>
                  )}

                  {/* Name */}
                  <span
                    style={{
                      fontFamily: "var(--display)",
                      fontSize: "1.05rem",
                      fontWeight: 700,
                      color: "var(--ink)",
                      lineHeight: 1.3,
                    }}
                  >
                    {loc.name}
                  </span>

                  {/* Address */}
                  <span
                    style={{
                      fontSize: "0.8rem",
                      color: "var(--ink-muted)",
                      lineHeight: 1.4,
                    }}
                  >
                    {[
                      loc.address?.neighborhood,
                      loc.address?.city,
                    ]
                      .filter(Boolean)
                      .join(", ") || "Sin direccion"}
                  </span>

                  {/* Coordinates mono */}
                  <span
                    style={{
                      fontFamily: "var(--mono)",
                      fontSize: "0.7rem",
                      color: "var(--ink-muted)",
                    }}
                  >
                    {formatCoordinates(loc.latitude, loc.longitude)}
                  </span>

                  {/* Distance + Rating row */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginTop: "0.25rem",
                    }}
                  >
                    {/* Distance chip */}
                    {distance !== undefined && distance !== false && (
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.25rem",
                          padding: "3px 8px",
                          borderRadius: "6px",
                          background:
                            "color-mix(in srgb, var(--route) 10%, transparent)",
                          color: "var(--route)",
                          fontFamily: "var(--mono)",
                          fontSize: "0.7rem",
                          fontWeight: 600,
                        }}
                      >
                        <Crosshair size={10} />
                        {formatDistance(distance)}
                      </span>
                    )}

                    {/* Rating */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.25rem",
                      }}
                    >
                      <Star
                        size={13}
                        style={{
                          color: "var(--rating)",
                          fill: "var(--rating)",
                        }}
                      />
                      <span
                        style={{
                          fontFamily: "var(--mono)",
                          fontSize: "0.8rem",
                          color: "var(--ink)",
                          fontWeight: 600,
                        }}
                      >
                        {loc.averageRating.toFixed(1)}
                      </span>
                      <span
                        style={{
                          fontSize: "0.7rem",
                          color: "var(--ink-muted)",
                        }}
                      >
                        ({loc.reviewCount})
                      </span>
                    </div>
                  </div>

                  {/* Tag badges */}
                  {loc.locationTags &&
                    loc.locationTags.length > 0 && (
                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: "0.35rem",
                          marginTop: "0.2rem",
                        }}
                      >
                        {loc.locationTags
                          .slice(0, 4)
                          .map((lt) => (
                            <span
                              key={lt.tagId}
                              style={{
                                padding: "2px 8px",
                                borderRadius: "4px",
                                background:
                                  "color-mix(in srgb, var(--primary) 8%, transparent)",
                                color: "var(--primary)",
                                fontFamily: "var(--mono)",
                                fontSize: "0.65rem",
                                fontWeight: 500,
                              }}
                            >
                              {lt.tag?.name ?? lt.tagId.slice(0, 8)}
                            </span>
                          ))}
                        {(loc.locationTags.length ?? 0) > 4 && (
                          <span
                            style={{
                              fontSize: "0.65rem",
                              color: "var(--ink-muted)",
                              fontFamily: "var(--mono)",
                            }}
                          >
                            +{loc.locationTags.length - 4}
                          </span>
                        )}
                      </div>
                    )}
                </Link>
              );
            })}
          </div>

          {/* ── Pagination ─────────────────────── */}
          {totalPages > 1 && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                padding: "1rem 0",
              }}
            >
              <button
                onClick={() => setPage(currentPage - 1)}
                disabled={currentPage <= 1}
                style={{
                  padding: "8px 16px",
                  borderRadius: "8px",
                  border: "1px solid var(--border)",
                  background: "var(--surface)",
                  color:
                    currentPage <= 1
                      ? "var(--ink-muted)"
                      : "var(--ink)",
                  cursor: currentPage <= 1 ? "not-allowed" : "pointer",
                  fontFamily: "var(--sans)",
                  fontSize: "0.85rem",
                  fontWeight: 500,
                  opacity: currentPage <= 1 ? 0.5 : 1,
                }}
              >
                Anterior
              </button>

              {Array.from(
                { length: Math.min(totalPages, 7) },
                (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 7) {
                    pageNum = i + 1;
                  } else if (currentPage <= 4) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 3) {
                    pageNum = totalPages - 6 + i;
                  } else {
                    pageNum = currentPage - 3 + i;
                  }
                  return pageNum;
                },
              ).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "8px",
                    border: "none",
                    background:
                      p === currentPage
                        ? "var(--primary)"
                        : "var(--surface)",
                    color:
                      p === currentPage ? "#fff" : "var(--ink)",
                    cursor: "pointer",
                    fontFamily: "var(--mono)",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    transition: "background 0.15s",
                  }}
                >
                  {p}
                </button>
              ))}

              <button
                onClick={() => setPage(currentPage + 1)}
                disabled={currentPage >= totalPages}
                style={{
                  padding: "8px 16px",
                  borderRadius: "8px",
                  border: "1px solid var(--border)",
                  background: "var(--surface)",
                  color:
                    currentPage >= totalPages
                      ? "var(--ink-muted)"
                      : "var(--ink)",
                  cursor:
                    currentPage >= totalPages
                      ? "not-allowed"
                      : "pointer",
                  fontFamily: "var(--sans)",
                  fontSize: "0.85rem",
                  fontWeight: 500,
                  opacity: currentPage >= totalPages ? 0.5 : 1,
                }}
              >
                Siguiente
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
