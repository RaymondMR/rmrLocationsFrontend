import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Pencil, Plus } from "lucide-react";
import LoadingSkeleton from "@/components/shared/LoadingSkeleton";
import ErrorState from "@/components/shared/ErrorState";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import ReviewList from "@/components/reviews/ReviewList";
import ReviewFormDialog from "@/components/reviews/ReviewFormDialog";
import {
  useCreateReview,
  useUpdateReview,
  useDeleteReview,
} from "@/hooks/use-reviews";
import { useAuthStore } from "@/stores/auth-store";
import { getApiErrorMessage } from "@/lib/api-error";
import type { ReviewFormData } from "@/types/forms";
import type { Review } from "@/types/models";

interface ReviewsSectionProps {
  locationId: string;
  reviews: Review[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}

const actionButtonStyle: React.CSSProperties = {
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
};

/**
 * Reseñas de un lugar: lista + alta, edición y baja.
 *
 * El backend admite UNA reseña por usuario y lugar (índice único), así que quien ya reseñó ve
 * «Editar mi reseña» en vez de «Escribir reseña». Editar y eliminar solo se ofrecen al autor o a un
 * Admin (lo decide ReviewCard); el backend lo vuelve a comprobar.
 */
export default function ReviewsSection({
  locationId,
  reviews,
  isLoading,
  isError,
  onRetry,
}: ReviewsSectionProps) {
  const userId = useAuthStore((s) => s.userId);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Review | null>(null);
  const [deleting, setDeleting] = useState<Review | null>(null);

  const createMutation = useCreateReview();
  const updateMutation = useUpdateReview();
  const deleteMutation = useDeleteReview();

  const myReview = userId ? (reviews.find((r) => r.userId === userId) ?? null) : null;

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (review: Review) => {
    setEditing(review);
    setFormOpen(true);
  };

  // Si falla, ReviewFormDialog muestra el error y se queda abierto.
  const handleSubmit = async (data: ReviewFormData) => {
    const payload = {
      rating: data.rating,
      title: data.title || undefined,
      body: data.body || undefined,
      visitedOn: data.visitedOn || undefined,
    };
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
    <section>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "0.75rem",
          marginBottom: "1rem",
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
          Reseñas ({reviews.length})
        </h2>

        {userId ? (
          myReview ? (
            <button type="button" onClick={() => openEdit(myReview)} style={actionButtonStyle}>
              <Pencil size={14} />
              Editar mi reseña
            </button>
          ) : (
            <button type="button" onClick={openCreate} style={actionButtonStyle}>
              <Plus size={14} />
              Escribir reseña
            </button>
          )
        ) : (
          <Link
            to="/login"
            style={{
              fontSize: "0.8rem",
              fontWeight: 600,
              color: "var(--primary)",
              textDecoration: "none",
            }}
          >
            Inicia sesión para escribir una reseña
          </Link>
        )}
      </div>

      {isLoading && <LoadingSkeleton variant="text" count={3} />}

      {isError && (
        <ErrorState message="No pudimos cargar las reseñas" onRetry={onRetry} />
      )}

      {!isLoading && !isError && reviews.length === 0 && (
        <p
          style={{
            fontSize: "0.875rem",
            color: "var(--ink-muted)",
            fontStyle: "italic",
            margin: 0,
          }}
        >
          Aún no hay reseñas para este lugar. Sé el primero en opinar.
        </p>
      )}

      {reviews.length > 0 && (
        <ReviewList reviews={reviews} onEdit={openEdit} onDelete={setDeleting} />
      )}

      <ReviewFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        existingReview={editing}
        onSubmit={handleSubmit}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      />

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        title="Eliminar reseña"
        description="Esta acción no se puede deshacer. La reseña se eliminará y se recalculará la calificación del lugar."
        confirmLabel="Eliminar"
        variant="danger"
        onConfirm={handleDelete}
      />
    </section>
  );
}
