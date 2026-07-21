import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Tag, Plus, Search } from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import LoadingSkeleton from "@/components/shared/LoadingSkeleton";
import EmptyState from "@/components/shared/EmptyState";
import ErrorState from "@/components/shared/ErrorState";
import { cn } from "@/lib/utils";
import api from "@/lib/axios";
import { useAuthStore } from "@/stores/auth-store";
import type { Tag as TagType } from "@/types/models";

/* ────────────────────────────────────────────── */
/*  TagsPage                                      */
/* ────────────────────────────────────────────── */
export default function TagsPage() {
  const { roles } = useAuthStore();
  const isAdmin = roles.includes("Admin");
  const [searchFilter, setSearchFilter] = useState("");

  const tagsQuery = useQuery({
    queryKey: ["tags"],
    queryFn: () =>
      api.get<TagType[]>("/api/tag").then((r) => r.data),
    staleTime: 120_000,
  });

  /* ── Filter tags by local search ──────────── */
  const filteredTags = useMemo(() => {
    if (!tagsQuery.data) return [];
    if (!searchFilter.trim()) return tagsQuery.data;
    const q = searchFilter.toLowerCase();
    return tagsQuery.data.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        (t.description ?? "").toLowerCase().includes(q),
    );
  }, [tagsQuery.data, searchFilter]);

  /* ── Determine badge size based on usageCount ── */
  function getSizeClass(count: number): "sm" | "md" | "lg" {
    if (!tagsQuery.data) return "sm";
    const counts = tagsQuery.data
      .map((t) => t.usageCount)
      .filter((c) => c > 0);
    if (counts.length === 0) return "sm";
    const max = Math.max(...counts);
    const ratio = count / max;
    if (ratio > 0.6) return "lg";
    if (ratio > 0.25) return "md";
    return "sm";
  }

  const sizeMap = {
    sm: { padding: "4px 10px", fontSize: "0.75rem" },
    md: { padding: "6px 14px", fontSize: "0.85rem" },
    lg: { padding: "8px 18px", fontSize: "0.95rem" },
  };

  /* ══════════════════════════════════════════════ */
  /*  STATES                                       */
  /* ══════════════════════════════════════════════ */
  if (tagsQuery.isLoading) {
    return (
      <div>
        <PageHeader title="Tags" />
        <LoadingSkeleton variant="text" count={8} />
      </div>
    );
  }

  if (tagsQuery.isError) {
    return (
      <div>
        <PageHeader title="Tags" />
        <ErrorState
          message={
            (tagsQuery.error as Error)?.message ??
            "No pudimos cargar los tags"
          }
          onRetry={() => tagsQuery.refetch()}
        />
      </div>
    );
  }

  if (filteredTags.length === 0 && !searchFilter.trim()) {
    return (
      <div>
        <PageHeader
          title="Tags"
          subtitle="Etiquetas para clasificar lugares"
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
                }}
              >
                <Plus size={16} />
                Nuevo tag
              </button>
            ) : undefined
          }
        />
        <EmptyState
          icon={<Tag size={28} />}
          title="Sin tags"
          description="Aun no hay tags disponibles."
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
        title="Tags"
        subtitle="Etiquetas para clasificar lugares"
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
              }}
            >
              <Plus size={16} />
              Nuevo tag
            </button>
          ) : undefined
        }
      />

      {/* ── Local search filter ──────────────── */}
      <div
        style={{
          position: "relative",
          maxWidth: "400px",
          marginBottom: "1.5rem",
        }}
      >
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
          placeholder="Buscar tags…"
          value={searchFilter}
          onChange={(e) => setSearchFilter(e.target.value)}
          style={{
            width: "100%",
            padding: "10px 12px 10px 36px",
            borderRadius: "8px",
            border: "1px solid var(--border)",
            background: "var(--surface)",
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

      {/* ── Tag cloud ──────────────────────────── */}
      {filteredTags.length === 0 && searchFilter.trim() && (
        <EmptyState
          title="Sin resultados"
          description={`No hay tags que coincidan con "${searchFilter}".`}
        />
      )}

      {filteredTags.length > 0 && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "0.6rem",
            alignItems: "center",
          }}
        >
          {filteredTags.map((tag) => {
            const size = getSizeClass(tag.usageCount);
            const style = sizeMap[size];

            return (
              <Link
                key={tag.id}
                to={`/tags/${tag.id}`}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  padding: style.padding,
                  borderRadius: "8px",
                  background:
                    "color-mix(in srgb, var(--primary) 8%, transparent)",
                  color: "var(--primary)",
                  textDecoration: "none",
                  fontFamily: "var(--sans)",
                  fontSize: style.fontSize,
                  fontWeight: 600,
                  lineHeight: 1.3,
                  border: "1px solid transparent",
                  transition:
                    "border-color 0.15s, box-shadow 0.15s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor =
                    "var(--primary)";
                  (e.currentTarget as HTMLElement).style.boxShadow =
                    "0 2px 8px rgba(0,0,0,0.06)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor =
                    "transparent";
                  (e.currentTarget as HTMLElement).style.boxShadow = "none";
                }}
              >
                <span>{tag.name}</span>
                <span
                  style={{
                    fontFamily: "var(--mono)",
                    fontSize:
                      size === "lg"
                        ? "0.8rem"
                        : size === "md"
                          ? "0.72rem"
                          : "0.65rem",
                    color: "var(--primary)",
                    opacity: 0.7,
                  }}
                >
                  {tag.usageCount}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
