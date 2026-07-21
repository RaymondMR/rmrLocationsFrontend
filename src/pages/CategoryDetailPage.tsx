import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Map, MapPin, Star, Utensils } from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import LoadingSkeleton from "@/components/shared/LoadingSkeleton";
import EmptyState from "@/components/shared/EmptyState";
import ErrorState from "@/components/shared/ErrorState";
import Breadcrumbs from "@/components/layout/Breadcrumbs";
import { cn } from "@/lib/utils";
import api from "@/lib/axios";
import type { Category, Location, PagedResult } from "@/types/models";

/* ────────────────────────────────────────────── */
/*  CategoryDetailPage                            */
/* ────────────────────────────────────────────── */
export default function CategoryDetailPage() {
  const { id } = useParams<{ id: string }>();

  const categoryQuery = useQuery({
    queryKey: ["categories", id],
    queryFn: () =>
      api.get<Category>(`/api/category/${id}`).then((r) => r.data),
    enabled: !!id,
    staleTime: 60_000,
    retry: false,
  });

  const locationsQuery = useQuery({
    queryKey: ["locations", { categoryId: id }],
    queryFn: () =>
      api
        .get<PagedResult<Location>>(
          `/api/location?categoryId=${id}&pageSize=20`,
        )
        .then((r) => r.data),
    enabled: !!id,
    staleTime: 60_000,
  });

  /* ══════════════════════════════════════════════ */
  /*  STATES                                       */
  /* ══════════════════════════════════════════════ */
  if (categoryQuery.isLoading) {
    return (
      <div>
        <LoadingSkeleton variant="detail" />
      </div>
    );
  }

  if (categoryQuery.isError) {
    const status = (categoryQuery.error as { response?: { status?: number } })
      ?.response?.status;
    if (status === 404) {
      return (
        <EmptyState
          icon={<MapPin size={28} />}
          title="Categoria no encontrada"
          description="La categoria que buscas no existe."
          action={{
            label: "Ver categorias",
            onClick: () => (window.location.href = "/categories"),
          }}
        />
      );
    }
    return (
      <ErrorState
        message={
          (categoryQuery.error as Error)?.message ??
          "No pudimos cargar la categoria"
        }
        onRetry={() => categoryQuery.refetch()}
      />
    );
  }

  const cat = categoryQuery.data!;
  const locations = locationsQuery.data?.items ?? [];

  /* ══════════════════════════════════════════════ */
  /*  RENDER                                       */
  /* ══════════════════════════════════════════════ */
  return (
    <div>
      <Breadcrumbs
        items={[
          { label: "Categorias", href: "/categories" },
          { label: cat.name },
        ]}
      />

      {/* ── Category identity header ──────────── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "1.25rem",
          padding: "1.5rem",
          borderRadius: "14px",
          background: "var(--surface)",
          border: "1px solid var(--border)",
          marginBottom: "2rem",
        }}
      >
        <div
          style={{
            width: "64px",
            height: "64px",
            borderRadius: "16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            background: cat.colorHex
              ? `color-mix(in srgb, ${cat.colorHex} 14%, transparent)`
              : "var(--background)",
            color: cat.colorHex ?? "var(--ink-muted)",
            fontSize: "1.5rem",
          }}
        >
          <Utensils size={28} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <h1
            style={{
              fontFamily: "var(--display)",
              fontSize: "clamp(1.4rem, 3.5vw, 1.8rem)",
              fontWeight: 700,
              color: "var(--ink)",
              margin: 0,
              lineHeight: 1.2,
            }}
          >
            {cat.name}
          </h1>
          {cat.description && (
            <p
              style={{
                margin: "0.35rem 0 0 0",
                fontSize: "0.9rem",
                color: "var(--ink-muted)",
                lineHeight: 1.5,
              }}
            >
              {cat.description}
            </p>
          )}
        </div>

        {/* CTA */}
        <Link
          to={`/locations?view=map&categoryId=${cat.id}`}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.4rem",
            padding: "10px 18px",
            borderRadius: "8px",
            background: "var(--route)",
            color: "#fff",
            textDecoration: "none",
            fontFamily: "var(--sans)",
            fontSize: "0.85rem",
            fontWeight: 600,
            whiteSpace: "nowrap",
            transition: "opacity 0.15s",
            flexShrink: 0,
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.opacity = "0.9";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.opacity = "1";
          }}
        >
          <Map size={16} />
          Explorar en el mapa
        </Link>
      </div>

      {/* ── Subcategories ─────────────────────── */}
      {cat.children && cat.children.length > 0 && (
        <div style={{ marginBottom: "2rem" }}>
          <h2
            style={{
              fontFamily: "var(--display)",
              fontSize: "1rem",
              fontWeight: 600,
              color: "var(--ink)",
              margin: "0 0 0.75rem 0",
            }}
          >
            Subcategorias
          </h2>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "0.5rem",
            }}
          >
            {cat.children.map((child) => (
              <Link
                key={child.id}
                to={`/categories/${child.id}`}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.35rem",
                  padding: "6px 14px",
                  borderRadius: "8px",
                  background: child.colorHex
                    ? `color-mix(in srgb, ${child.colorHex} 10%, transparent)`
                    : "var(--background)",
                  color: child.colorHex ?? "var(--ink)",
                  textDecoration: "none",
                  fontFamily: "var(--sans)",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  border: "1px solid var(--border)",
                  transition: "box-shadow 0.15s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow =
                    "0 2px 8px rgba(0,0,0,0.06)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow = "none";
                }}
              >
                <Utensils size={12} />
                {child.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── Locations in this category ────────── */}
      <h2
        style={{
          fontFamily: "var(--display)",
          fontSize: "1.1rem",
          fontWeight: 700,
          color: "var(--ink)",
          margin: "0 0 1rem 0",
        }}
      >
        Lugares en esta categoria
      </h2>

      {locationsQuery.isLoading && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fill, minmax(260px, 1fr))",
            gap: "1rem",
          }}
        >
          <LoadingSkeleton variant="card" count={4} />
        </div>
      )}

      {locationsQuery.isError && (
        <ErrorState
          message={
            (locationsQuery.error as Error)?.message ??
            "No pudimos cargar los lugares"
          }
          onRetry={() => locationsQuery.refetch()}
        />
      )}

      {locationsQuery.isSuccess && locations.length === 0 && (
        <EmptyState
          icon={<MapPin size={28} />}
          title="Sin lugares"
          description={`Aun no hay lugares en la categoria "${cat.name}".`}
        />
      )}

      {locations.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fill, minmax(260px, 1fr))",
            gap: "1rem",
          }}
        >
          {locations.map((loc) => (
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
              <span
                style={{
                  fontFamily: "var(--display)",
                  fontSize: "1rem",
                  fontWeight: 700,
                  color: "var(--ink)",
                  lineHeight: 1.3,
                }}
              >
                {loc.name}
              </span>

              <span
                style={{
                  fontSize: "0.8rem",
                  color: "var(--ink-muted)",
                }}
              >
                {[loc.address?.neighborhood, loc.address?.city]
                  .filter(Boolean)
                  .join(", ") || "Sin direccion"}
              </span>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.35rem",
                }}
              >
                <Star
                  size={14}
                  style={{
                    color: "var(--rating)",
                    fill: "var(--rating)",
                  }}
                />
                <span
                  style={{
                    fontFamily: "var(--mono)",
                    fontSize: "0.85rem",
                    color: "var(--ink)",
                    fontWeight: 600,
                  }}
                >
                  {loc.averageRating.toFixed(1)}
                </span>
                <span
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--ink-muted)",
                  }}
                >
                  ({loc.reviewCount} resenas)
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
