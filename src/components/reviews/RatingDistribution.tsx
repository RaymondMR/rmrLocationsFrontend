import type { Review } from "@/types/models";
import { Star } from "lucide-react";

interface RatingDistributionProps {
  reviews: Review[];
}

export default function RatingDistribution({ reviews }: RatingDistributionProps) {
  if (reviews.length === 0) return null;

  const distribution: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  reviews.forEach((r) => {
    distribution[r.rating] = (distribution[r.rating] || 0) + 1;
  });

  const total = reviews.length;
  const avg =
    reviews.reduce((sum, r) => sum + r.rating, 0) / total;

  return (
    <div
      className="rounded-xl border p-4"
      style={{ background: "var(--surface)", borderColor: "var(--border)" }}
    >
      <div className="flex items-center gap-4 mb-4">
        <div className="text-center">
          <div
            className="text-4xl font-bold"
            style={{ fontFamily: "var(--display)", color: "var(--ink)" }}
          >
            {avg.toFixed(1)}
          </div>
          <div className="flex items-center gap-0.5 justify-center mt-1">
            <Star size={14} style={{ color: "var(--rating)" }} fill="var(--rating)" />
          </div>
          <div
            className="text-xs mt-1"
            style={{ fontFamily: "var(--mono)", color: "var(--ink-muted)" }}
          >
            {total} {total === 1 ? "reseña" : "reseñas"}
          </div>
        </div>

        <div className="flex-1 flex flex-col gap-1">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = distribution[star];
            const pct = total > 0 ? (count / total) * 100 : 0;
            return (
              <div key={star} className="flex items-center gap-2 text-sm">
                <span
                  className="w-4 text-right"
                  style={{ fontFamily: "var(--mono)", color: "var(--ink-muted)" }}
                >
                  {star}
                </span>
                <Star size={12} style={{ color: "var(--rating)" }} fill="var(--rating)" />
                <div
                  className="flex-1 h-2 rounded-full overflow-hidden"
                  style={{ background: "var(--border)" }}
                >
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${pct}%`,
                      background: "var(--rating)",
                    }}
                  />
                </div>
                <span
                  className="w-6 text-right"
                  style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--ink-muted)" }}
                >
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
