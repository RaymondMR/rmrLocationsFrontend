import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Bookmark,
  Plus,
  Globe,
  Lock,
  Eye,
  EyeOff,
  MapPin,
} from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import LoadingSkeleton from "@/components/shared/LoadingSkeleton";
import EmptyState from "@/components/shared/EmptyState";
import ErrorState from "@/components/shared/ErrorState";
import { cn } from "@/lib/utils";
import api from "@/lib/axios";
import { useAuthStore } from "@/stores/auth-store";
import type { LocationCollection } from "@/types/models";

/* ────────────────────────────────────────────── */
/*  Visibility badge config                       */
/* ────────────────────────────────────────────── */
const visibilityConfig: Record<
  string,
  { label: string; color: string; bg: string; icon: React.ReactNode }
> = {
  Private: {
    label: "Privada",
    color: "var(--danger)",
    bg: "color-mix(in srgb, var(--danger) 10%, transparent)",
    icon: <Lock size={12} />,
  },
  Unlisted: {
    label: "No listada",
    color: "var(--rating)",
    bg: "color-mix(in srgb, var(--rating) 10%, transparent)",
    icon: <EyeOff size={12} />,
  },
  Public: {
    label: "Publica",
    color: "var(--success)",
    bg: "color-mix(in srgb, var(--success) 10%, transparent)",
    icon: <Globe size={12} />,
  },
};

/* ────────────────────────────────────────────── */
/*  CollectionsPage                               */
/* ────────────────────────────────────────────── */
export default function CollectionsPage() {
  const navigate = useNavigate();
  const { userId } = useAuthStore();

  const collectionsQuery = useQuery({
    queryKey: ["collections", userId],
    queryFn: () =>
      api
        .get<LocationCollection[]>(`/api/collection/user/${userId}`)
        .then((r) => r.data),
    enabled: !!userId,
    staleTime: 30_000,
  });

  /* ══════════════════════════════════════════════ */
  /*  STATES                                       */
  /* ══════════════════════════════════════════════ */
  if (collectionsQuery.isLoading) {
    return (
      <div>
        <PageHeader title="Mis colecciones" />
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "1rem",
          }}
        >
          <LoadingSkeleton variant="card" count={4} />
        </div>
      </div>
    );
  }

  if (collectionsQuery.isError) {
    return (
      <div>
        <PageHeader title="Mis colecciones" />
        <ErrorState
          message={
            (collectionsQuery.error as Error)?.message ??
            "No pudimos cargar tus colecciones"
          }
          onRetry={() => collectionsQuery.refetch()}
        />
      </div>
    );
  }

  const collections = collectionsQuery.data ?? [];

  if (collections.length === 0) {
    return (
      <div>
        <PageHeader
          title="Mis colecciones"
          subtitle="Guarda tus lugares favoritos en colecciones"
          action={
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
              Nueva coleccion
            </button>
          }
        />
        <EmptyState
          icon={<Bookmark size={28} />}
          title="Crea tu primera coleccion"
          description="Guarda lugares que te gusten y organizalos como quieras."
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
        title="Mis colecciones"
        subtitle="Guarda tus lugares favoritos en colecciones"
        action={
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
            Nueva coleccion
          </button>
        }
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fill, minmax(280px, 1fr))",
          gap: "1rem",
        }}
      >
        {collections.map((col) => {
          const vis = visibilityConfig[col.visibility] ?? visibilityConfig.Private;

          return (
            <Link
              key={col.id}
              to={`/collections/${col.id}`}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
                padding: "1.25rem",
                borderRadius: "12px",
                background: "var(--surface)",
                border: "1px solid var(--border)",
                textDecoration: "none",
                transition:
                  "box-shadow 0.15s, transform 0.15s",
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
              {/* Title + visibility */}
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  gap: "0.5rem",
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--display)",
                    fontSize: "1.05rem",
                    fontWeight: 700,
                    color: "var(--ink)",
                    lineHeight: 1.3,
                  }}
                >
                  {col.name}
                </span>

                {/* Visibility badge */}
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.25rem",
                    padding: "2px 8px",
                    borderRadius: "4px",
                    background: vis.bg,
                    color: vis.color,
                    fontFamily: "var(--mono)",
                    fontSize: "0.7rem",
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                  }}
                >
                  {vis.icon}
                  {vis.label}
                </span>
              </div>

              {/* Description */}
              {col.description && (
                <span
                  style={{
                    fontSize: "0.8rem",
                    color: "var(--ink-muted)",
                    lineHeight: 1.5,
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {col.description}
                </span>
              )}

              {/* Item count */}
              <span
                style={{
                  fontFamily: "var(--mono)",
                  fontSize: "0.75rem",
                  color: "var(--ink-muted)",
                }}
              >
                {col.items?.length ?? 0}{" "}
                {(col.items?.length ?? 0) === 1
                  ? "lugar"
                  : "lugares"}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
