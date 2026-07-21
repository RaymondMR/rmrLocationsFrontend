import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import StarRating from "./StarRating";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { reviewSchema, type ReviewFormData } from "@/types/forms";
import type { Review } from "@/types/models";

interface ReviewFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: ReviewFormData) => Promise<void>;
  existingReview?: Review | null;
  isSubmitting?: boolean;
}

export default function ReviewFormDialog({
  open,
  onOpenChange,
  onSubmit,
  existingReview,
  isSubmitting,
}: ReviewFormDialogProps) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<ReviewFormData>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      rating: existingReview?.rating ?? 5,
      title: existingReview?.title ?? "",
      body: existingReview?.body ?? "",
      visitedOn: existingReview?.visitedOn ?? "",
    },
  });

  const isEdit = !!existingReview;

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? "Editar reseña" : "Escribir reseña"}
      description="Comparte tu experiencia en este lugar"
    >
      <form
        onSubmit={handleSubmit(async (data) => {
          await onSubmit(data);
          onOpenChange(false);
        })}
        className="flex flex-col gap-4"
      >
        {/* Rating */}
        <div>
          <label className="text-sm font-medium mb-1.5 block" style={{ color: "var(--ink)" }}>
            Calificación
          </label>
          <Controller
            control={control}
            name="rating"
            render={({ field }) => (
              <StarRating value={field.value} onChange={field.onChange} size={28} interactive />
            )}
          />
          {errors.rating && (
            <span className="text-xs" style={{ color: "var(--danger)" }}>
              {errors.rating.message}
            </span>
          )}
        </div>

        <Input
          label="Título (opcional)"
          {...register("title")}
          placeholder="Un gran lugar…"
          maxLength={200}
          error={errors.title?.message}
        />

        <Textarea
          label="Reseña (opcional)"
          {...register("body")}
          placeholder="Cuenta tu experiencia…"
          maxLength={4000}
          error={errors.body?.message}
        />

        <Input
          label="Fecha de visita (opcional)"
          type="date"
          {...register("visitedOn")}
          error={errors.visitedOn?.message}
        />

        <div className="flex justify-end gap-3 mt-2">
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="submit" loading={isSubmitting}>
            {isEdit ? "Guardar cambios" : "Publicar reseña"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
