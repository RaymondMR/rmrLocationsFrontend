import { useEffect } from "react";
import { toast } from "sonner";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import StarRating from "./StarRating";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { reviewSchema, type ReviewFormData } from "@/types/forms";
import { getApiErrorMessage } from "@/lib/api-error";
import type { Review } from "@/types/models";

interface ReviewFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: ReviewFormData) => Promise<void>;
  existingReview?: Review | null;
  isSubmitting?: boolean;
}

function toFormValues(review?: Review | null): ReviewFormData {
  return {
    rating: review?.rating ?? 5,
    title: review?.title ?? "",
    body: review?.body ?? "",
    // <input type="date"> solo acepta yyyy-MM-dd; la API puede devolver también la hora.
    visitedOn: review?.visitedOn?.slice(0, 10) ?? "",
  };
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
    reset,
    formState: { errors },
  } = useForm<ReviewFormData>({
    resolver: zodResolver(reviewSchema),
    defaultValues: toFormValues(existingReview),
  });

  // La misma instancia sirve para crear y editar: sin este reset, al reabrir el diálogo se veían los
  // valores de la vez anterior (o los de otra reseña) porque defaultValues solo cuenta al montar.
  useEffect(() => {
    if (open) reset(toFormValues(existingReview));
  }, [open, existingReview, reset]);

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
          try {
            await onSubmit(data);
            onOpenChange(false);
          } catch (e) {
            // Se queda abierto para corregir y reintentar (p. ej. 409 si ya existe tu reseña).
            toast.error(getApiErrorMessage(e, "write"));
          }
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
