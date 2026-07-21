import { Tag as TagIcon } from "lucide-react";
import { Link } from "react-router-dom";
import type { Tag } from "@/types/models";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import { Pencil, Trash2, Plus } from "lucide-react";

interface TagCloudProps {
  tags: Tag[];
  onEdit?: (tag: Tag) => void;
  onDelete?: (tag: Tag) => void;
  onCreate?: () => void;
}

export default function TagCloud({ tags, onEdit, onDelete, onCreate }: TagCloudProps) {
  const isAdmin = useAuthStore((s) => s.roles.includes("Admin"));

  // Calculate sizes based on locationTags.length
  const maxCount = Math.max(...tags.map((t) => t.locationTags?.length ?? 0), 1);
  const getSize = (count: number): "sm" | "md" | "lg" => {
    const ratio = count / maxCount;
    if (ratio < 0.33) return "sm";
    if (ratio < 0.66) return "md";
    return "lg";
  };

  const sizeClasses = { sm: "text-xs px-2 py-1", md: "text-sm px-3 py-1.5", lg: "text-base px-4 py-2" };

  return (
    <div className="flex flex-wrap gap-2 items-center">
      {isAdmin && onCreate && (
        <button
          onClick={onCreate}
          className="inline-flex items-center gap-1 rounded-lg text-sm font-medium px-3 py-1.5 border-dashed transition-colors"
          style={{
            border: "1px dashed var(--border)",
            color: "var(--ink-muted)",
            background: "none",
            cursor: "pointer",
          }}
        >
          <Plus size={14} />
          Nuevo tag
        </button>
      )}
      {tags.map((tag) => {
        const count = tag.locationTags?.length ?? 0;
        const size = getSize(count);
        return (
          <div key={tag.id} className="inline-flex items-center gap-1 group">
            <Link
              to={`/tags/${tag.id}`}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full font-medium transition-colors hover:opacity-80",
                sizeClasses[size],
              )}
              style={{
                background: "var(--border)",
                color: "var(--ink)",
                fontFamily: size === "lg" ? "var(--display)" : "var(--mono)",
                textDecoration: "none",
              }}
            >
              <TagIcon size={size === "lg" ? 16 : 12} />
              {tag.name}
              <span style={{ color: "var(--ink-muted)" }}>· {count}</span>
            </Link>
            {isAdmin && (
              <span className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-0.5">
                {onEdit && (
                  <button
                    onClick={() => onEdit(tag)}
                    aria-label="Editar tag"
                    style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ink-muted)", padding: 1 }}
                  >
                    <Pencil size={12} />
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={() => onDelete(tag)}
                    aria-label="Eliminar tag"
                    style={{ background: "none", border: "none", cursor: "pointer", color: "var(--danger)", padding: 1 }}
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
