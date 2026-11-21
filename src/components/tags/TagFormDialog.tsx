import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { tagSchema, type TagFormData } from "@/types/forms";
import { slugify } from "@/lib/slug";
import type { Tag } from "@/types/models";

interface TagFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: Tag | null;
  onSubmit: (data: TagFormData) => Promise<void>;
  isSubmitting?: boolean;
}

// Diálogo de crear + editar tag. Espeja CollectionFormDialog (mismo shell de
// Dialog + Input/Textarea/Button de ui), pero sin radios de visibilidad: un
// tag sólo tiene name, slug y descripción. `initial` decide modo editar.
export default function TagFormDialog({
  open,
  onOpenChange,
  initial,
  onSubmit,
  isSubmitting,
}: TagFormDialogProps) {
  const [slugTouched, setSlugTouched] = useState(!!initial);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<TagFormData>({
    resolver: zodResolver(tagSchema),
    defaultValues: initial
      ? {
          name: initial.name,
          slug: initial.slug,
          description: initial.description ?? "",
        }
      : { name: "", slug: "", description: "" },
  });

  // Re-llenar al abrir: la misma instancia se reutiliza para crear y editar,
  // así que hay que resetear los valores cada vez que se abre con un `initial`
  // distinto (o sin él, para crear).
  useEffect(() => {
    if (open) {
      reset(
        initial
          ? {
              name: initial.name,
              slug: initial.slug,
              description: initial.description ?? "",
            }
          : { name: "", slug: "", description: "" },
      );
      setSlugTouched(!!initial);
    }
  }, [open, initial, reset]);

  // Auto-slug desde el nombre, salvo que el usuario haya editado el slug a mano.
  // En editar, `slugTouched` arranca en true → se conserva el slug existente.
  const nameValue = watch("name");
  useEffect(() => {
    if (!slugTouched) {
      setValue("slug", slugify(nameValue));
    }
  }, [nameValue, slugTouched, setValue]);

  const isEdit = !!initial;

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? "Editar tag" : "Nuevo tag"}
    >
      <form
        onSubmit={handleSubmit(async (data) => {
          await onSubmit(data);
          onOpenChange(false);
        })}
        className="flex flex-col gap-4"
      >
        <Input
          label="Nombre"
          {...register("name")}
          placeholder="Ej: vegetariano"
          maxLength={60}
          error={errors.name?.message}
        />

        <Input
          label="Slug"
          {...register("slug", { onChange: () => setSlugTouched(true) })}
          placeholder="vegetariano"
          maxLength={80}
          error={errors.slug?.message}
        />

        <Textarea
          label="Descripción (opcional)"
          {...register("description")}
          placeholder="Para qué sirve este tag…"
          maxLength={500}
          error={errors.description?.message}
        />

        <div className="flex justify-end gap-3 mt-2">
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="submit" loading={isSubmitting}>
            {isEdit ? "Guardar cambios" : "Crear tag"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}