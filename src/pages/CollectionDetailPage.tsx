import { useState, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Bookmark,
  Globe,
  Lock,
  EyeOff,
  MapPin,
  Star,
  Edit3,
  Trash2,
  Share2,
  ChevronRight,
} from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import LoadingSkeleton from "@/components/shared/LoadingSkeleton";
import EmptyState from "@/components/shared/EmptyState";
import ErrorState from "@/components/shared/ErrorState";
import Breadcrumbs from "@/components/layout/Breadcrumbs";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
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
/*  CollectionDetailPage                          */
/* ────────────────────────────────────────────── */
export default function CollectionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { userId } = useAuthStore();
  const [deleteOpen, setDeleteOpen] = useState(false);

  const collectionQuery = useQuery({
    queryKey: ["collections", "detail", id],
    queryFn: () =>
      api
        .get<LocationCollection>(`/api/collection/${id}`)
        .then((r) => r.data),
    enabled: !!id,
    staleTime: 30_000,
    retry: false,
  });

  const isOwner =
    !!userId &&
    collectionQuery.data?.ownerId === userId;

  /* ── Delete mutation (soft delete) ────────── */
  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/api/collection/${id}`),
    onSuccess: () => {
      navigate("/collections", { replace: true });
    },
  });

  const handleDelete = useCallback(() => {
    deleteMutation.mutate();
  }, [deleteMutation]);

  const handleCopyLink = useCallback(() => {
    navigator.clipboard.writeText(window.location.href);
  }, []);

  /* ══════════════════════════════════════════════ */
  /*  STATES                                       */
  /* ══════════════════════════════════════════════ */
  if (collectionQuery.isLoading) {
    return (
      <div>
        <LoadingSkeleton variant="detail" />
      </div>
    );
  }

  /* ── Handle 404 / private ─────────────────── */
  if (collectionQuery.isError) {
    const status = (collectionQuery.error as { response?: { status?: number } })
      ?.response?.status;
    if (status === 404 || status === 403 || status === 401) {
      return (
        <EmptyState
          icon={<Lock size={28} />}
          title="Coleccion no disponible"
          description="Esta coleccion es privada o ya no existe."
          action={{
            label: "Mis colecciones",
            onClick: () => navigate("/collections"),
          }}
        />
      );
    }
    return (
      <ErrorState
        message={
          (collectionQuery.error as Error)?.message ??
          "No pudimos cargar la coleccion"
        }
        onRetry={() => collectionQuery.refetch()}
      />
    );
  }

  const col = collectionQuery.data!;
  const vis = visibilityConfig[col.visibility] ?? visibilityConfig.Private;

  /* ══════════════════════════════════════════════ */
  /*  RENDER                                       */
  /* ══════════════════════════════════════════════ */
  return (
    <div>
      <Breadcrumbs
        items={[
          { label: "Colecciones", href: "/collections" },
          { label: col.name },
        ]}
      />

      {/* ── Header ────────────────────────────── */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "1rem",
          padding: "1.5rem",
          borderRadius: "14px",
          background: "var(--surface)",
          border: "1px solid var(--border)",
          marginBottom: "2rem",
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              marginBottom: "0.5rem",
            }}
          >
            <h1
              style={{
                fontFamily: "var(--display)",
                fontSize: "clamp(1.3rem, 3vw, 1.6rem)",
                fontWeight: 700,
                color: "var(--ink)",
                margin: 0,
                lineHeight: 1.2,
              }}
            >
              {col.name}
            </h1>

            {/* Visibility badge */}
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.25rem",
                padding: "3px 8px",
                borderRadius: "4px",
                background: vis.bg,
                color: vis.color,
                fontFamily: "var(--mono)",
                fontSize: "0.7rem",
                fontWeight: 600,
                whiteSpace: "nowrap",
              }}
            >
              {vis.icon}
              {vis.label}
            </span>
          </div>

          {col.description && (
            <p
              style={{
                margin: "0 0 0.5rem 0",
                fontSize: "0.9rem",
                color: "var(--ink-muted)",
                lineHeight: 1.5,
              }}
            >
              {col.description}
            </p>
          )}

          <p
            style={{
              margin: 0,
              fontFamily: "var(--mono)",
              fontSize: "0.8rem",
              color: "var(--ink-muted)",
            }}
          >
            {col.items?.length ?? 0}{" "}
            {(col.items?.length ?? 0) === 1
              ? "lugar"
              : "lugares"}
            {col.owner && (
              <> &middot; por {col.owner.displayName ?? col.owner.userName}</>
            )}
          </p>
        </div>

        {/* Owner actions */}
        {isOwner && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              flexShrink: 0,
            }}
          >
            <button
              onClick={handleCopyLink}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.35rem",
                padding: "9px 14px",
                borderRadius: "8px",
                border: "1px solid var(--border)",
                background: "var(--surface)",
                color: "var(--ink)",
                cursor: "pointer",
                fontFamily: "var(--sans)",
                fontSize: "0.8rem",
                fontWeight: 500,
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background =
                  "var(--background)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background =
                  "var(--surface)";
              }}
            >
              <Share2 size={14} />
              Copiar enlace
            </button>

            <button
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.35rem",
                padding: "9px 14px",
                borderRadius: "8px",
                border: "1px solid var(--border)",
                background: "var(--surface)",
                color: "var(--ink)",
                cursor: "pointer",
                fontFamily: "var(--sans)",
                fontSize: "0.8rem",
                fontWeight: 500,
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background =
                  "var(--background)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background =
                  "var(--surface)";
              }}
            >
              <Edit3 size={14} />
              Editar
            </button>

            <button
              onClick={() => setDeleteOpen(true)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: "38px",
                height: "38px",
                borderRadius: "8px",
                border: "1px solid var(--border)",
                background: "var(--surface)",
                color: "var(--danger)",
                cursor: "pointer",
                transition: "background 0.15s",
              }}
              title="Eliminar coleccion"
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background =
                  "color-mix(in srgb, var(--danger) 8%, transparent)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background =
                  "var(--surface)";
              }}
            >
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </div>

      {/* ── Location list ──────────────────────── */}
      {(!col.items || col.items.length === 0) && (
        <EmptyState
          icon={<MapPin size={28} />}
          title="Coleccion vacia"
          description="Aun no has agregado lugares a esta coleccion."
        />
      )}

      {col.items && col.items.length > 0 && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.75rem",
          }}
        >
          {col.items
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map((item) => (
              <Link
                key={item.locationId}
                to={`/locations/${item.locationId}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "1rem",
                  padding: "1rem 1.25rem",
                  borderRadius: "10px",
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  textDecoration: "none",
                  transition:
                    "box-shadow 0.15s, transform 0.15s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow =
                    "0 2px 8px rgba(0,0,0,0.04)";
                  (e.currentTarget as HTMLElement).style.transform =
                    "translateX(4px)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow = "none";
                  (e.currentTarget as HTMLElement).style.transform = "none";
                }}
              >
                {/* Location info */}
                <div
                  style={{
                    flex: 1,
                    minWidth: 0,
                  }}
                >
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
                    {item.location?.name ?? "Lugar"}
                  </span>

                  {item.notes && (
                    <span
                      style={{
                        fontSize: "0.8rem",
                        color: "var(--ink-muted)",
                        display: "block",
                        marginTop: "0.2rem",
                        fontStyle: "italic",
                      }}
                    >
                      "{item.notes}"
                    </span>
                  )}

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      marginTop: "0.35rem",
                    }}
                  >
                    {item.location && (
                      <>
                        <span
                          style={{
                            fontSize: "0.75rem",
                            color: "var(--ink-muted)",
                          }}
                        >
                          {[
                            item.location.address?.neighborhood,
                            item.location.address?.city,
                          ]
                            .filter(Boolean)
                            .join(", ") || "Sin direccion"}
                        </span>
                        <span
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.2rem",
                          }}
                        >
                          <Star
                            size={11}
                            style={{
                              color: "var(--rating)",
                              fill: "var(--rating)",
                            }}
                          />
                          <span
                            style={{
                              fontFamily: "var(--mono)",
                              fontSize: "0.75rem",
                              color: "var(--ink)",
                              fontWeight: 600,
                            }}
                          >
                            {item.location.averageRating.toFixed(1)}
                          </span>
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <ChevronRight
                  size={16}
                  style={{
                    color: "var(--ink-muted)",
                    flexShrink: 0,
                  }}
                />
              </Link>
            ))}
        </div>
      )}

      {/* ── Delete confirmation ────────────────── */}
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Eliminar coleccion"
        description="Esta accion no se puede deshacer. La coleccion se eliminara permanentemente."
        confirmLabel="Eliminar"
        variant="danger"
        onConfirm={handleDelete}
      />
    </div>
  );
}
