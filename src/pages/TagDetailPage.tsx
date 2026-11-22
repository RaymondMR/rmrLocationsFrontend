import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Map, MapPin, Star, Tag, Edit3, Trash2 } from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import LoadingSkeleton from "@/components/shared/LoadingSkeleton";
import EmptyState from "@/components/shared/EmptyState";
import ErrorState from "@/components/shared/ErrorState";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import Breadcrumbs from "@/components/layout/Breadcrumbs";
import TagFormDialog from "@/components/tags/TagFormDialog";
import { cn } from "@/lib/utils";
import api from "@/lib/axios";
import { getApiErrorMessage } from "@/lib/api-error";
import { useAuthStore } from "@/stores/auth-store";
import { useUpdateTag, useDeleteTag } from "@/hooks/use-tags";
import type { Tag as TagType, Location, PagedResult } from "@/types/models";
import type { TagFormData } from "@/types/forms";

/* ────────────────────────────────────────────── */
/*  TagDetailPage                                 */
/* ────────────────────────────────────────────── */
export default function TagDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { roles } = useAuthStore();
  const isAdmin = roles.includes("Admin");
  const navigate = useNavigate();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const updateMutation = useUpdateTag();
  const deleteMutation = useDeleteTag();

  // Si falla, TagFormDialog muestra el error y se queda abierto (antes se atrapaba aquí y el diálogo
  // se cerraba como si la edición hubiera ido bien).
  const handleEdit = async (data: TagFormData) => {
    if (!id) return;
    await updateMutation.mutateAsync({
      id,
      name: data.name,
      slug: data.slug,
      description: data.description || undefined,
    });
  };

  const handleDelete = async () => {
    if (!id) return;
    try {
      await deleteMutation.mutateAsync(id);
      navigate("/tags", { replace: true });
    } catch (e) {
      toast.error(getApiErrorMessage(e));
    }
  };

  const tagQuery = useQuery({
    queryKey: ["tags", id],
    queryFn: () =>
      api.get<TagType>(`/api/tag/${id}`).then((r) => r.data),
    enabled: !!id,
    staleTime: 60_000,
    retry: false,
  });

  const locationsQuery = useQuery({
    queryKey: ["locations", { tagId: id }],
    queryFn: () =>
      api
        .get<PagedResult<Location>>(
          `/api/location?tagIds=${id}&pageSize=20`,
        )
        .then((r) => r.data),
    enabled: !!id,
    staleTime: 60_000,
  });

  /* ══════════════════════════════════════════════ */
  /*  STATES                                       */
  /* ══════════════════════════════════════════════ */
  if (tagQuery.isLoading) {
    return (
      <div>
        <LoadingSkeleton variant="detail" />
      </div>
    );
  }

  if (tagQuery.isError) {
    const status = (tagQuery.error as { response?: { status?: number } })
      ?.response?.status;
    if (status === 404) {
      return (
        <EmptyState
          icon={<Tag size={28} />}
          title="Tag no encontrado"
          description="El tag que buscas no existe."
          action={{
            label: "Ver tags",
            onClick: () => (window.location.href = "/tags"),
          }}
        />
      );
    }
    return (
      <ErrorState
        message={
          (tagQuery.error as Error)?.message ??
          "No pudimos cargar la informacion del tag"
        }
        onRetry={() => tagQuery.refetch()}
      />
    );
  }

  const tag = tagQuery.data!;
  const locations = locationsQuery.data?.items ?? [];

  /* ══════════════════════════════════════════════ */
  /*  RENDER                                       */
  /* ══════════════════════════════════════════════ */
  return (
    <div>
      <Breadcrumbs
        items={[
          { label: "Tags", href: "/tags" },
          { label: tag.name },
        ]}
      />

      {/* ── Tag header ────────────────────────── */}
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
            width: "56px",
            height: "56px",
            borderRadius: "14px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            background:
              "color-mix(in srgb, var(--primary) 10%, transparent)",
            color: "var(--primary)",
            fontFamily: "var(--mono)",
            fontSize: "1.5rem",
            fontWeight: 700,
          }}
        >
          #
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <h1
            style={{
              fontFamily: "var(--mono)",
              fontSize: "clamp(1.3rem, 3vw, 1.6rem)",
              fontWeight: 700,
              color: "var(--ink)",
              margin: 0,
            }}
          >
            #{tag.name}
          </h1>
          {tag.description && (
            <p
              style={{
                margin: "0.35rem 0 0 0",
                fontSize: "0.9rem",
                color: "var(--ink-muted)",
                lineHeight: 1.5,
              }}
            >
              {tag.description}
            </p>
          )}
          <p
            style={{
              margin: "0.5rem 0 0 0",
              fontFamily: "var(--mono)",
              fontSize: "0.8rem",
              color: "var(--ink-muted)",
            }}
          >
            {tag.usageCount}{" "}
            {tag.usageCount === 1
              ? "lugar etiquetado"
              : "lugares etiquetados"}
          </p>
        </div>

        <Link
          to={`/locations?view=map&tagIds=${tag.id}`}
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
            flexShrink: 0,
            transition: "opacity 0.15s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.opacity = "0.9";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.opacity = "1";
          }}
        >
          <Map size={16} />
          Ver en el mapa
        </Link>

        {isAdmin && (
          <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0 }}>
            <button
              onClick={() => setEditOpen(true)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.35rem",
                padding: "10px 16px",
                borderRadius: "8px",
                border: "1px solid var(--border)",
                background: "var(--surface)",
                color: "var(--ink)",
                cursor: "pointer",
                fontFamily: "var(--sans)",
                fontSize: "0.85rem",
                fontWeight: 500,
                whiteSpace: "nowrap",
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
              <Edit3 size={15} />
              Editar
            </button>
            <button
              onClick={() => setDeleteOpen(true)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.35rem",
                padding: "10px 16px",
                borderRadius: "8px",
                border: "1px solid var(--danger)",
                background: "transparent",
                color: "var(--danger)",
                cursor: "pointer",
                fontFamily: "var(--sans)",
                fontSize: "0.85rem",
                fontWeight: 500,
                whiteSpace: "nowrap",
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background =
                  "color-mix(in srgb, var(--danger) 10%, transparent)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = "transparent";
              }}
            >
              <Trash2 size={15} />
              Eliminar
            </button>
          </div>
        )}
      </div>

      {/* ── Locations using this tag ──────────── */}
      <h2
        style={{
          fontFamily: "var(--display)",
          fontSize: "1.1rem",
          fontWeight: 700,
          color: "var(--ink)",
          margin: "0 0 1rem 0",
        }}
      >
        Lugares con este tag
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
          description={`Aun no hay lugares etiquetados con "${tag.name}".`}
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

      <TagFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        initial={tag}
        onSubmit={handleEdit}
        isSubmitting={updateMutation.isPending}
      />
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Eliminar tag"
        description="Esta accion no se puede deshacer. El tag se eliminara permanentemente."
        confirmLabel="Eliminar"
        variant="danger"
        onConfirm={handleDelete}
      />
    </div>
  );
}
