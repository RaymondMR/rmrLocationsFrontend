import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Layers, Plus, Utensils } from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import LoadingSkeleton from "@/components/shared/LoadingSkeleton";
import EmptyState from "@/components/shared/EmptyState";
import ErrorState from "@/components/shared/ErrorState";
import { cn } from "@/lib/utils";
import api from "@/lib/axios";
import { useAuthStore } from "@/stores/auth-store";
import type { Category } from "@/types/models";

/* ────────────────────────────────────────────── */
/*  Build tree from flat list                     */
/* ────────────────────────────────────────────── */
function buildCategoryTree(categories: Category[]): Category[] {
  const map = new Map<string, Category>();
  const roots: Category[] = [];

  for (const cat of categories) {
    map.set(cat.id, { ...cat, children: [] });
  }

  for (const cat of categories) {
    const node = map.get(cat.id)!;
    if (cat.parentCategoryId && map.has(cat.parentCategoryId)) {
      const parent = map.get(cat.parentCategoryId)!;
      parent.children = parent.children ?? [];
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots.sort((a, b) => a.sortOrder - b.sortOrder);
}

/* ────────────────────────────────────────────── */
/*  CategoriesPage                                */
/* ────────────────────────────────────────────── */
export default function CategoriesPage() {
  const { roles } = useAuthStore();
  const isAdmin = roles.includes("Admin");

  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: () =>
      api.get<Category[]>("/api/category").then((r) => r.data),
    staleTime: 120_000,
  });

  const categoryTree = useMemo(
    () =>
      categoriesQuery.data
        ? buildCategoryTree(categoriesQuery.data)
        : [],
    [categoriesQuery.data],
  );

  /* ══════════════════════════════════════════════ */
  /*  STATES                                       */
  /* ══════════════════════════════════════════════ */
  if (categoriesQuery.isLoading) {
    return (
      <div>
        <PageHeader title="Categorias" />
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fill, minmax(260px, 1fr))",
            gap: "1rem",
          }}
        >
          <LoadingSkeleton variant="card" count={6} />
        </div>
      </div>
    );
  }

  if (categoriesQuery.isError) {
    return (
      <div>
        <PageHeader title="Categorias" />
        <ErrorState
          message={
            (categoriesQuery.error as Error)?.message ??
            "No pudimos cargar las categorias"
          }
          onRetry={() => categoriesQuery.refetch()}
        />
      </div>
    );
  }

  if (categoryTree.length === 0) {
    return (
      <div>
        <PageHeader title="Categorias" />
        <EmptyState
          icon={<Layers size={28} />}
          title="Sin categorias"
          description="Aun no hay categorias disponibles."
        />
      </div>
    );
  }

  /* ══════════════════════════════════════════════ */
  /*  RENDER                                       */
  /* ══════════════════════════════════════════════ */
  return (
    <div>
      <PageHeader
        title="Categorias"
        subtitle="Explora lugares por categoria"
        action={
          isAdmin ? (
            <button
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.35rem",
                padding: "9px 16px",
                borderRadius: "8px",
                border: "none",
                background: "var(--primary)",
                color: "#fff",
                cursor: "pointer",
                fontFamily: "var(--sans)",
                fontSize: "0.85rem",
                fontWeight: 600,
                transition: "opacity 0.15s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.opacity = "0.9";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.opacity = "1";
              }}
            >
              <Plus size={16} />
              Nueva categoria
            </button>
          ) : undefined
        }
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fill, minmax(260px, 1fr))",
          gap: "1rem",
        }}
      >
        {categoryTree.map((cat) => (
          <Link
            key={cat.id}
            to={`/categories/${cat.id}`}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.75rem",
              padding: "1.25rem",
              borderRadius: "12px",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderTop: cat.colorHex
                ? `3px solid ${cat.colorHex}`
                : "3px solid var(--border)",
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
            {/* Icon + name row */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
              }}
            >
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  background: cat.colorHex
                    ? `color-mix(in srgb, ${cat.colorHex} 14%, transparent)`
                    : "var(--background)",
                  color: cat.colorHex ?? "var(--ink-muted)",
                  fontSize: "1.15rem",
                }}
              >
                <Utensils size={20} />
              </div>
              <div style={{ minWidth: 0 }}>
                <span
                  style={{
                    fontFamily: "var(--display)",
                    fontSize: "1rem",
                    fontWeight: 700,
                    color: "var(--ink)",
                    display: "block",
                    lineHeight: 1.3,
                  }}
                >
                  {cat.name}
                </span>
                {cat.description && (
                  <span
                    style={{
                      fontSize: "0.8rem",
                      color: "var(--ink-muted)",
                      display: "block",
                      marginTop: "0.15rem",
                      lineHeight: 1.4,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {cat.description}
                  </span>
                )}
              </div>
            </div>

            {/* Children chips */}
            {cat.children && cat.children.length > 0 && (
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "0.35rem",
                }}
              >
                {cat.children.slice(0, 6).map((child) => (
                  <span
                    key={child.id}
                    style={{
                      padding: "2px 8px",
                      borderRadius: "4px",
                      background:
                        "color-mix(in srgb, var(--primary) 6%, transparent)",
                      color: "var(--primary)",
                      fontFamily: "var(--mono)",
                      fontSize: "0.65rem",
                      fontWeight: 500,
                    }}
                    onClick={(e) => {
                      e.preventDefault();
                      window.location.href = `/categories/${child.id}`;
                    }}
                  >
                    {child.name}
                  </span>
                ))}
                {cat.children.length > 6 && (
                  <span
                    style={{
                      fontSize: "0.65rem",
                      color: "var(--ink-muted)",
                      fontFamily: "var(--mono)",
                    }}
                  >
                    +{cat.children.length - 6}
                  </span>
                )}
              </div>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
