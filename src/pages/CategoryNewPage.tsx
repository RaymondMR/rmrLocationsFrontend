import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
import { Save, ChevronLeft } from "lucide-react";
import { toast } from "sonner";
import PageHeader from "@/components/shared/PageHeader";
import CategoryIconPicker from "@/components/shared/CategoryIconPicker";
import ColorPicker from "@/components/shared/ColorPicker";
import { useCategories, useCreateCategory } from "@/hooks/use-categories";
import { categorySchema } from "@/types/forms";
import type { CategoryFormData } from "@/types/forms";
import { slugify } from "@/lib/slug";
import { getApiErrorMessage } from "@/lib/api-error";

/* ────────────────────────────────────────────── */
/*  CategoryNewPage                               */
/* ────────────────────────────────────────────── */
export default function CategoryNewPage() {
  const navigate = useNavigate();
  const categoriesQuery = useCategories();
  const createMutation = useCreateCategory();
  const categories = categoriesQuery.data ?? [];

  // ¿El usuario editó el slug a mano? Si no, se auto-deriva del nombre.
  const [slugTouched, setSlugTouched] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      iconName: "",
      colorHex: "",
      // Siguiente posición disponible; 0 si la lista aún no carga o está vacía.
      sortOrder: categories.length,
      parentCategoryId: "",
    },
  });

  const nameValue = watch("name");
  useEffect(() => {
    if (!slugTouched) {
      setValue("slug", slugify(nameValue));
    }
  }, [nameValue, slugTouched, setValue]);

  const onSubmit = async (values: CategoryFormData) => {
    try {
      await createMutation.mutateAsync({
        name: values.name,
        slug: values.slug,
        description: values.description || undefined,
        iconName: values.iconName || undefined,
        colorHex: values.colorHex || undefined,
        sortOrder: values.sortOrder,
        parentCategoryId: values.parentCategoryId || undefined,
      });
      // El hook tuesta "Categoría creada" e invalida ["categories"].
      navigate("/categories");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  /* ══════════════════════════════════════════════ */
  /*  RENDER                                       */
  /* ══════════════════════════════════════════════ */
  return (
    <div>
      <PageHeader
        title="Nueva categoria"
        subtitle="Crea una categoria para clasificar lugares"
      />

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div
          style={{
            padding: "1.5rem",
            borderRadius: "12px",
            background: "var(--surface)",
            border: "1px solid var(--border)",
            marginBottom: "1.5rem",
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
          }}
        >
          <FormField label="Nombre" required error={errors.name?.message}>
            <input
              type="text"
              placeholder="Ej: Restaurantes"
              style={inputStyle}
              {...register("name")}
            />
          </FormField>

          <FormField label="Slug" required error={errors.slug?.message}>
            <input
              type="text"
              placeholder="restaurantes"
              style={{ ...inputStyle, fontFamily: "var(--mono)" }}
              // RHF v7 ejecuta su onChange interno (actualiza valor + validación)
              // Y además este callback: marca el slug como editado a mano.
              {...register("slug", { onChange: () => setSlugTouched(true) })}
            />
          </FormField>

          <FormField label="Descripcion" error={errors.description?.message}>
            <textarea
              placeholder="Describe la categoria…"
              rows={3}
              style={{ ...inputStyle, resize: "vertical", minHeight: "70px" }}
              {...register("description")}
            />
          </FormField>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "1rem",
            }}
            className="max-sm:grid-cols-1"
          >
            <FormField label="Orden" required error={errors.sortOrder?.message}>
              <input
                type="number"
                min={0}
                step={1}
                style={inputStyle}
                {...register("sortOrder", { valueAsNumber: true })}
              />
            </FormField>

            <FormField
              label="Categoria padre"
              error={errors.parentCategoryId?.message}
            >
              <select
                style={{ ...inputStyle, cursor: "pointer", appearance: "none" }}
                {...register("parentCategoryId")}
              >
                <option value="">Ninguna (categoria raiz)</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </FormField>
          </div>

          <FormField label="Icono" error={errors.iconName?.message}>
            <Controller
              control={control}
              name="iconName"
              render={({ field }) => (
                <CategoryIconPicker
                  value={field.value ?? ""}
                  onChange={field.onChange}
                />
              )}
            />
          </FormField>

          <FormField label="Color" error={errors.colorHex?.message}>
            <Controller
              control={control}
              name="colorHex"
              render={({ field }) => (
                <ColorPicker
                  value={field.value ?? ""}
                  onChange={field.onChange}
                />
              )}
            />
          </FormField>
        </div>

        {/* ── Navigation buttons ──────────────── */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Link
            to="/categories"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.35rem",
              padding: "10px 18px",
              borderRadius: "8px",
              border: "1px solid var(--border)",
              background: "var(--surface)",
              color: "var(--ink)",
              cursor: "pointer",
              fontFamily: "var(--sans)",
              fontSize: "0.85rem",
              fontWeight: 500,
              textDecoration: "none",
            }}
          >
            <ChevronLeft size={16} />
            Cancelar
          </Link>

          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.35rem",
              padding: "10px 18px",
              borderRadius: "8px",
              border: "none",
              background: "var(--primary)",
              color: "#fff",
              cursor: isSubmitting ? "not-allowed" : "pointer",
              fontFamily: "var(--sans)",
              fontSize: "0.85rem",
              fontWeight: 600,
              opacity: isSubmitting ? 0.6 : 1,
              transition: "opacity 0.15s",
            }}
            onMouseEnter={(e) => {
              if (!isSubmitting)
                (e.currentTarget as HTMLElement).style.opacity = "0.9";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.opacity = isSubmitting
                ? "0.6"
                : "1";
            }}
          >
            <Save size={16} />
            {isSubmitting ? "Guardando…" : "Guardar categoria"}
          </button>
        </div>
      </form>
    </div>
  );
}

/* ────────────────────────────────────────────── */
/*  Internal helpers                              */
/* ────────────────────────────────────────────── */

interface FormFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}

function FormField({ label, required, error, children }: FormFieldProps) {
  return (
    <label
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "0.35rem",
        fontSize: "0.85rem",
        fontWeight: 500,
        color: "var(--ink)",
      }}
    >
      {label}
      {required && (
        <span style={{ color: "var(--danger)", marginLeft: "2px" }}>*</span>
      )}
      {children}
      {error && (
        <span style={{ color: "var(--danger)", fontSize: "0.78rem" }}>
          {error}
        </span>
      )}
    </label>
  );
}

const inputStyle: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: "8px",
  border: "1px solid var(--border)",
  background: "var(--background)",
  color: "var(--ink)",
  fontFamily: "var(--sans)",
  fontSize: "0.85rem",
  outline: "none",
  width: "100%",
  transition: "border-color 0.15s",
  boxSizing: "border-box",
};