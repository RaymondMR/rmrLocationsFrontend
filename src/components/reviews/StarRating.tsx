import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  value: number; // 0–5
  onChange?: (val: number) => void;
  size?: number;
  interactive?: boolean;
}

export default function StarRating({
  value,
  onChange,
  size = 20,
  interactive = false,
}: StarRatingProps) {
  return (
    <div className="inline-flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = value >= star;
        const half = !filled && value >= star - 0.5;
        return (
          <button
            key={star}
            type={interactive ? "button" : undefined}
            disabled={!interactive}
            onClick={() => onChange?.(star)}
            className={cn(
              "inline-flex",
              interactive ? "cursor-pointer hover:scale-110 transition-transform" : "cursor-default",
            )}
            aria-label={`${star} estrella${star > 1 ? "s" : ""}`}
            style={{ background: "none", border: "none", padding: 0 }}
          >
            <Star
              size={size}
              fill={filled || half ? "var(--rating)" : "none"}
              stroke={filled || half ? "var(--rating)" : "var(--border)"}
              strokeWidth={1.5}
            />
          </button>
        );
      })}
    </div>
  );
}
