import { useEffect } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { collectionSchema, type CollectionFormData } from "@/types/forms";
import { Lock, Link2, Globe } from "lucide-react";
import type { LocationCollection } from "@/types/models";

interface CollectionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: LocationCollection | null;
  onSubmit: (data: CollectionFormData) => Promise<void>;
  isSubmitting?: boolean;
}

const visibilityOptions = [
  {
    value: "Private",
    label: "Privada",
    description: "Solo tú puedes verla",
    Icon: Lock,
  },
  {
    value: "Unlisted",
    label: "No listada",
    description: "Visible con el enlace directo",
    Icon: Link2,
  },
  {
    value: "Public",
    label: "Pública",
    description: "Visible para todos",
    Icon: Globe,
  },
];

// Diálogo de crear + editar colección. `initial` decide modo editar: si llega
// una colección, se rellena el form con sus datos y el botón dice "Guardar
// cambios"; si no, es creación ("Crear colección"). Sigue callback-driven: el
// parent decide si llama a useCreateCollection o useUpdateCollection.
export default function CollectionFormDialog({
  open,
  onOpenChange,
  initial,
  onSubmit,
  isSubmitting,
}: CollectionFormDialogProps) {
  const isEdit = !!initial;

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<CollectionFormData>({
    resolver: zodResolver(collectionSchema),
    defaultValues: initial
      ? {
          name: initial.name,
          description: initial.description ?? "",
          visibility: initial.visibility,
        }
      : { name: "", description: "", visibility: "Public" },
  });

  // Re-llenar al abrir: la misma instancia sirve para crear y editar, así que
  // hay que resetear con los valores de `initial` (o vacíos para crear) cada
  // vez que se abre.
  useEffect(() => {
    if (open) {
      reset(
        initial
          ? {
              name: initial.name,
              description: initial.description ?? "",
              visibility: initial.visibility,
            }
          : { name: "", description: "", visibility: "Public" },
      );
    }
  }, [open, initial, reset]);

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? "Editar colección" : "Nueva colección"}
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
          placeholder="Mis favoritos…"
          maxLength={150}
          error={errors.name?.message}
        />

        <Textarea
          label="Descripción (opcional)"
          {...register("description")}
          placeholder="Una colección de…"
          maxLength={1000}
          error={errors.description?.message}
        />

        {/* Visibility radio cards */}
        <div>
          <label className="text-sm font-medium mb-2 block" style={{ color: "var(--ink)" }}>
            Visibilidad
          </label>
          <Controller
            control={control}
            name="visibility"
            render={({ field }) => (
              <div className="flex flex-col gap-2">
                {visibilityOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => field.onChange(opt.value)}
                    className="flex items-center gap-3 p-3 rounded-lg border text-left transition-all"
                    style={{
                      background:
                        field.value === opt.value
                          ? "var(--primary)" + "0D"
                          : "var(--background)",
                      borderColor:
                        field.value === opt.value
                          ? "var(--primary)"
                          : "var(--border)",
                      cursor: "pointer",
                    }}
                  >
                    <opt.Icon
                      size={18}
                      style={{
                        color: field.value === opt.value ? "var(--primary)" : "var(--ink-muted)",
                      }}
                    />
                    <div>
                      <div className="font-medium text-sm" style={{ color: "var(--ink)" }}>
                        {opt.label}
                      </div>
                      <div className="text-xs" style={{ color: "var(--ink-muted)" }}>
                        {opt.description}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          />
          {errors.visibility && (
            <span className="text-xs" style={{ color: "var(--danger)" }}>
              {errors.visibility.message}
            </span>
          )}
        </div>

        <div className="flex justify-end gap-3 mt-2">
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="submit" loading={isSubmitting}>
            {isEdit ? "Guardar cambios" : "Crear colección"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}