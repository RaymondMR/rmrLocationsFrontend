import { cn } from "@/lib/utils";
import type { Category } from "@/types/models";
import { Link } from "react-router-dom";
import * as Lucide from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { Pencil, Trash2, Plus } from "lucide-react";

interface CategoryTreeProps {
  categories: Category[];
  onEdit?: (cat: Category) => void;
  onDelete?: (cat: Category) => void;
  onCreate?: () => void;
}

// Map icon names to Lucide components
function getIcon(iconName?: string | null) {
  if (!iconName) return Lucide.MapPin;
  const key = iconName
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join("") as keyof typeof Lucide;
  return (Lucide[key] as React.ElementType) || Lucide.MapPin;
}

export default function CategoryTree({ categories, onEdit, onDelete, onCreate }: CategoryTreeProps) {
  const isAdmin = useAuthStore((s) => s.roles.includes("Admin"));

  // Build tree from flat list
  const roots = categories.filter((c) => !c.parentCategoryId);
  const getChildren = (parentId: string) =>
    categories.filter((c) => c.parentCategoryId === parentId);

  return (
    <div className="flex flex-col gap-4">
      {isAdmin && onCreate && (
        <button
          onClick={onCreate}
          className="inline-flex items-center gap-2 self-start px-4 py-2 rounded-[10px] text-sm font-medium transition-colors"
          style={{
            background: "var(--primary)",
            color: "#fff",
            border: "none",
            cursor: "pointer",
          }}
        >
          <Plus size={16} /> Nueva categoría
        </button>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {roots
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((root) => {
            const Icon = getIcon(root.iconName);
            const children = getChildren(root.id).sort((a, b) => a.sortOrder - b.sortOrder);

            return (
              <div
                key={root.id}
                className="rounded-xl border p-4 transition-all duration-150 hover:-translate-y-0.5"
                style={{ background: "var(--surface)", borderColor: "var(--border)" }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <Link
                    to={`/categories/${root.id}`}
                    className="flex items-center gap-3 flex-1 min-w-0"
                    style={{ textDecoration: "none" }}
                  >
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                      style={{
                        background: `${root.colorHex || "var(--primary)"}20`,
                        color: root.colorHex || "var(--primary)",
                      }}
                    >
                      <Icon size={20} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-sm truncate" style={{ fontFamily: "var(--display)", color: "var(--ink)" }}>
                        {root.name}
                      </h3>
                      {root.description && (
                        <p className="text-xs truncate" style={{ color: "var(--ink-muted)" }}>
                          {root.description}
                        </p>
                      )}
                    </div>
                  </Link>
                  {isAdmin && (
                    <div className="flex gap-1 shrink-0">
                      {onEdit && (
                        <button onClick={() => onEdit(root)} aria-label="Editar" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ink-muted)", padding: 2 }}>
                          <Pencil size={14} />
                        </button>
                      )}
                      {onDelete && (
                        <button onClick={() => onDelete(root)} aria-label="Eliminar" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--danger)", padding: 2 }}>
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {children.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 ml-13">
                    {children.map((child) => (
                      <Link
                        key={child.id}
                        to={`/categories/${child.id}`}
                        className="px-2.5 py-1 rounded-full text-xs font-medium transition-colors hover:opacity-80"
                        style={{
                          background: `${child.colorHex || "var(--primary)"}1A`,
                          color: child.colorHex || "var(--primary)",
                          textDecoration: "none",
                        }}
                      >
                        {child.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
}
