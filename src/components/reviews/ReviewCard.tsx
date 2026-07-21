import type { Review } from "@/types/models";
import StarRating from "./StarRating";
import { timeAgo } from "@/lib/slug";
import { Pencil, Trash2 } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";

interface ReviewCardProps {
  review: Review;
  onEdit?: (review: Review) => void;
  onDelete?: (review: Review) => void;
}

export default function ReviewCard({ review, onEdit, onDelete }: ReviewCardProps) {
  const userId = useAuthStore((s) => s.userId);
  const roles = useAuthStore((s) => s.roles);
  const isOwner = userId === review.userId;
  const isAdmin = roles.includes("Admin");
  const canManage = isOwner || isAdmin;

  const user = review.user;
  const initial = user?.userName?.[0]?.toUpperCase() || "?";

  return (
    <div
      className="p-4 rounded-xl border"
      style={{ background: "var(--surface)", borderColor: "var(--border)" }}
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-sm font-bold"
          style={{ background: "var(--primary)", color: "#fff", fontFamily: "var(--mono)" }}
        >
          {initial}
        </div>

        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm" style={{ color: "var(--ink)" }}>
                {user?.displayName || user?.userName || "Usuario"}
              </span>
              <span
                className="text-xs"
                style={{ fontFamily: "var(--mono)", color: "var(--ink-muted)" }}
              >
                {timeAgo(review.createdAtUtc)}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <StarRating value={review.rating} size={14} />
              {canManage && (
                <div className="flex gap-1 ml-1">
                  {onEdit && (
                    <button
                      onClick={() => onEdit(review)}
                      aria-label="Editar reseña"
                      style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ink-muted)", padding: 2 }}
                    >
                      <Pencil size={14} />
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={() => onDelete(review)}
                      aria-label="Eliminar reseña"
                      style={{ background: "none", border: "none", cursor: "pointer", color: "var(--danger)", padding: 2 }}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Visited date */}
          {review.visitedOn && (
            <p className="text-xs mb-1" style={{ color: "var(--ink-muted)" }}>
              Visitado el{" "}
              {new Date(review.visitedOn).toLocaleDateString("es-MX", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          )}

          {/* Title */}
          {review.title && (
            <h4 className="font-semibold text-sm mb-1" style={{ color: "var(--ink)" }}>
              {review.title}
            </h4>
          )}

          {/* Body */}
          {review.body && (
            <p className="text-sm leading-relaxed" style={{ color: "var(--ink-muted)" }}>
              {review.body}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
