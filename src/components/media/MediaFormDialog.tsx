import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { mediaSchema, type MediaFormData } from "@/types/forms";
import { getApiErrorMessage } from "@/lib/api-error";
import type { LocationMedia } from "@/types/models";

interface MediaFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: LocationMedia | null;
  onSubmit: (data: MediaFormData) => Promise<void>;
  isSubmitting?: boolean;
}

const typeOptions = [
  { value: "Image", label: "Imagen" },
  { value: "Video", label: "Video" },
];

function toFormValues(media?: LocationMedia | null): MediaFormData {
  return {
    url: media?.url ?? "",
    thumbnailUrl: media?.thumbnailUrl ?? "",
    caption: media?.caption ?? "",
    type: media?.type ?? "Image",
    isCover: media?.isCover ?? false,
    sortOrder: media?.sortOrder ?? 0,
  };
}

// Diálogo de alta y edición de una foto o video de un lugar. Se enlaza una URL pública (la API guarda
// la dirección, no el archivo). `initial` decide el modo editar. Sigue el patrón de TagFormDialog:
// se rellena al abrir y, si el servidor rechaza el envío, avisa y se queda abierto.
export default function MediaFormDialog({
  open,
  onOpenChange,
  initial,
  onSubmit,
  isSubmitting,
}: MediaFormDialogProps) {
  const isEdit = !!initial;

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<MediaFormData>({
    resolver: zodResolver(mediaSchema),
    defaultValues: toFormValues(initial),
  });

  useEffect(() => {
    if (open) reset(toFormValues(initial));
  }, [open, initial, reset]);

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? "Editar foto o video" : "Agregar foto o video"}
      description="Pega la dirección (URL) pública de la imagen o del video."
    >
      <form
        noValidate
        onSubmit={handleSubmit(async (data) => {
          try {
            await onSubmit(data);
            onOpenChange(false);
          } catch (e) {
            toast.error(getApiErrorMessage(e, "write"));
          }
        })}
        className="flex flex-col gap-4"
      >
        <Input
          label="URL"
          type="url"
          {...register("url")}
          placeholder="https://…"
          maxLength={2048}
          error={errors.url?.message}
        />

        <Input
          label="URL de la miniatura (opcional)"
          type="url"
          {...register("thumbnailUrl")}
          placeholder="https://…"
          maxLength={2048}
          error={errors.thumbnailUrl?.message}
        />

        <Input
          label="Descripción (opcional)"
          {...register("caption")}
          placeholder="Fachada del local…"
          maxLength={300}
          error={errors.caption?.message}
        />

        <Controller
          control={control}
          name="type"
          render={({ field }) => (
            <Select
              label="Tipo"
              options={typeOptions}
              value={field.value}
              onChange={field.onChange}
              error={errors.type?.message}
            />
          )}
        />

        <Input
          label="Orden"
          type="number"
          min={0}
          step={1}
          {...register("sortOrder", { valueAsNumber: true })}
          error={errors.sortOrder?.message}
        />

        <label
          className="flex items-center gap-2 text-sm"
          style={{ color: "var(--ink)", cursor: "pointer" }}
        >
          <input type="checkbox" {...register("isCover")} />
          Usar como portada (solo una por lugar: reemplaza a la actual)
        </label>

        <div className="flex justify-end gap-3 mt-2">
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="submit" loading={isSubmitting}>
            {isEdit ? "Guardar cambios" : "Agregar"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
