import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Pencil, Play, Plus, Trash2 } from "lucide-react";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import MediaGallery from "@/components/media/MediaGallery";
import MediaFormDialog from "@/components/media/MediaFormDialog";
import {
  useCreateMedia,
  useUpdateMedia,
  useDeleteMedia,
} from "@/hooks/use-media";
import { getApiErrorMessage } from "@/lib/api-error";
import type { MediaFormData } from "@/types/forms";
import type { LocationMedia } from "@/types/models";

interface MediaSectionProps {
  locationId: string;
  media: LocationMedia[];
  /** Dueño del lugar o Admin: son quienes el backend deja agregar, editar y quitar medios. */
  canManage: boolean;
}

const iconButtonStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "30px",
  height: "30px",
  borderRadius: "8px",
  border: "1px solid var(--border)",
  background: "var(--surface)",
  cursor: "pointer",
  flexShrink: 0,
};

/**
 * Fotos y videos de un lugar: galería para todos y, para el dueño o un Admin, alta, edición y baja.
 * Sin medios y sin permiso para gestionarlos no se pinta nada (evita un bloque vacío en lugares ajenos).
 */
export default function MediaSection({ locationId, media, canManage }: MediaSectionProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<LocationMedia | null>(null);
  const [deleting, setDeleting] = useState<LocationMedia | null>(null);

  const createMutation = useCreateMedia();
  const updateMutation = useUpdateMedia();
  const deleteMutation = useDeleteMedia();

  // La API los devuelve sin orden garantizado.
  const ordered = useMemo(
    () => [...media].sort((a, b) => a.sortOrder - b.sortOrder),
    [media],
  );

  if (!canManage && ordered.length === 0) return null;

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (item: LocationMedia) => {
    setEditing(item);
    setFormOpen(true);
  };

  // Si falla, MediaFormDialog muestra el error y se queda abierto.
  const handleSubmit = async (data: MediaFormData) => {
    const payload = {
      url: data.url.trim(),
      thumbnailUrl: data.thumbnailUrl.trim() || undefined,
      caption: data.caption.trim() || undefined,
      type: data.type,
      isCover: data.isCover,
      sortOrder: data.sortOrder,
    };

    // Solo puede haber UNA portada por lugar (índice único en la BD): si esta pasa a ser la portada, se
    // retira primero la anterior. El PUT reemplaza todos los campos, así que se reenvía el medio completo.
    const otherCover = ordered.find((m) => m.isCover && m.id !== editing?.id);
    if (payload.isCover && otherCover) {
      await updateMutation.mutateAsync({
        id: otherCover.id,
        locationId,
        url: otherCover.url,
        thumbnailUrl: otherCover.thumbnailUrl ?? undefined,
        caption: otherCover.caption ?? undefined,
        type: otherCover.type,
        isCover: false,
        sortOrder: otherCover.sortOrder,
      });
    }

    if (editing) {
      await updateMutation.mutateAsync({ id: editing.id, locationId, ...payload });
    } else {
      await createMutation.mutateAsync({ locationId, ...payload });
    }
  };

  const handleDelete = async () => {
    const target = deleting;
    if (!target) return;
    try {
      await deleteMutation.mutateAsync({ id: target.id, locationId });
    } catch (e) {
      toast.error(getApiErrorMessage(e, "write"));
    }
  };

  return (
    <section style={{ marginBottom: "2rem" }}>
      {ordered.length > 0 && <MediaGallery media={ordered} />}

      {canManage && (
        <div style={{ marginTop: ordered.length > 0 ? "1rem" : 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "0.75rem",
              marginBottom: "0.75rem",
            }}
          >
            <h2
              style={{
                fontFamily: "var(--display)",
                fontSize: "1.15rem",
                fontWeight: 700,
                color: "var(--ink)",
                margin: 0,
              }}
            >
              Fotos y videos ({ordered.length})
            </h2>
            <button
              type="button"
              onClick={openCreate}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.35rem",
                padding: "8px 14px",
                borderRadius: "8px",
                border: "none",
                background: "var(--primary)",
                color: "#fff",
                cursor: "pointer",
                fontFamily: "var(--sans)",
                fontSize: "0.8rem",
                fontWeight: 600,
              }}
            >
              <Plus size={14} />
              Agregar foto o video
            </button>
          </div>

          {ordered.length === 0 ? (
            <p
              style={{
                fontSize: "0.875rem",
                color: "var(--ink-muted)",
                fontStyle: "italic",
                margin: 0,
              }}
            >
              Este lugar todavía no tiene fotos ni videos.
            </p>
          ) : (
            <ul
              style={{
                listStyle: "none",
                margin: 0,
                padding: 0,
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
              }}
            >
              {ordered.map((item) => (
                <li
                  key={item.id}
                  data-media-id={item.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    padding: "0.5rem 0.75rem",
                    borderRadius: "10px",
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <div
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "6px",
                      overflow: "hidden",
                      background: "var(--border)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      color: "var(--ink-muted)",
                    }}
                  >
                    {item.type === "Video" ? (
                      <Play size={16} />
                    ) : (
                      <img
                        src={item.thumbnailUrl || item.url}
                        alt=""
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        loading="lazy"
                        onError={(e) => {
                          (e.currentTarget as HTMLElement).style.display = "none";
                        }}
                      />
                    )}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: "0.85rem",
                        fontWeight: 600,
                        color: "var(--ink)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {item.caption || item.url}
                    </div>
                    <div
                      style={{
                        fontFamily: "var(--mono)",
                        fontSize: "0.7rem",
                        color: "var(--ink-muted)",
                      }}
                    >
                      {item.type === "Video" ? "Video" : "Imagen"}
                      {item.isCover ? " · Portada" : ""} · orden {item.sortOrder}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => openEdit(item)}
                    title="Editar foto o video"
                    aria-label="Editar foto o video"
                    style={{ ...iconButtonStyle, color: "var(--ink-muted)" }}
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleting(item)}
                    title="Eliminar foto o video"
                    aria-label="Eliminar foto o video"
                    style={{ ...iconButtonStyle, color: "var(--danger)" }}
                  >
                    <Trash2 size={14} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <MediaFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        initial={editing}
        onSubmit={handleSubmit}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      />

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        title="Eliminar foto o video"
        description="Esta acción no se puede deshacer. Se quitará del lugar."
        confirmLabel="Eliminar"
        variant="danger"
        onConfirm={handleDelete}
      />
    </section>
  );
}
