import { Link } from "react-router-dom";
import { MapPin, Star } from "lucide-react";
import type { Location } from "@/types/models";
import { formatCoordinates, formatDistance } from "@/lib/geo";
import { CategoryBadge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface LocationCardProps {
  location: Location;
  distanceMeters?: number;
  className?: string;
}

export default function LocationCard({ location, distanceMeters, className }: LocationCardProps) {
  const primaryCat = location.locationCategories?.find((lc) => lc.isPrimary);
  const cat = primaryCat?.category;
  const catColor = cat?.colorHex ?? null;
  const catIcon = cat?.iconName ?? "map-pin";

  const Icon = MapPin; // We'll map icon names dynamically in a future refinement

  return (
    <Link
      to={`/locations/${location.id}`}
      className={cn("block group", className)}
      style={{ textDecoration: "none" }}
    >
      <article
        className="relative rounded-xl overflow-hidden transition-all duration-150 border"
        style={{
          background: "var(--surface)",
          borderColor: "var(--border)",
          boxShadow: "none",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow =
            "0 4px 12px rgba(0,0,0,0.08)";
          e.currentTarget.style.transform = "translateY(-2px)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = "none";
          e.currentTarget.style.transform = "translateY(0)";
        }}
      >
        {/* Left color tick from primary category */}
        <div
          className="absolute left-0 top-0 bottom-0 w-[3px]"
          style={{ background: catColor || "var(--primary)" }}
        />

        {/* Grid pattern background */}
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage: `repeating-linear-gradient(0deg, ${catColor || "var(--primary)"} 0, ${catColor || "var(--primary)"} 1px, transparent 1px, transparent 20px), repeating-linear-gradient(90deg, ${catColor || "var(--primary)"} 0, ${catColor || "var(--primary)"} 1px, transparent 1px, transparent 20px)`,
          }}
        />

        <div className="relative p-4">
          {/* Top row: category icon + rating */}
          <div className="flex items-center justify-between mb-3">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center"
              style={{ background: `${catColor || "var(--primary)"}1A` }}
            >
              <Icon size={18} style={{ color: catColor || "var(--primary)" }} />
            </div>
            {location.averageRating > 0 && (
              <div className="flex items-center gap-1 text-sm font-medium">
                <Star size={14} style={{ color: "var(--rating)" }} fill="var(--rating)" />
                <span style={{ color: "var(--ink)" }}>
                  {location.averageRating.toFixed(1)}
                </span>
                <span style={{ color: "var(--ink-muted)", fontFamily: "var(--mono)", fontSize: 12 }}>
                  ({location.reviewCount})
                </span>
              </div>
            )}
          </div>

          {/* Name */}
          <h3
            className="font-bold text-lg mb-1 truncate"
            style={{ fontFamily: "var(--display)", color: "var(--ink)" }}
          >
            {location.name}
          </h3>

          {/* Neighborhood / City */}
          {(location.address?.neighborhood || location.address?.city) && (
            <p className="text-sm mb-2" style={{ color: "var(--ink-muted)" }}>
              {[location.address?.neighborhood, location.address?.city]
                .filter(Boolean)
                .join(" · ")}
            </p>
          )}

          {/* Coordinates (mono eyebrow) */}
          <p
            className="text-xs mb-3 truncate"
            style={{ fontFamily: "var(--mono)", color: "var(--ink-muted)" }}
          >
            {formatCoordinates(location.latitude, location.longitude)}
          </p>

          {/* Distance chip */}
          {distanceMeters != null && (
            <span
              className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full"
              style={{
                fontFamily: "var(--mono)",
                color: "var(--route)",
                background: "var(--route)1A",
              }}
            >
              {formatDistance(distanceMeters)}
            </span>
          )}

          {/* Category & Tag badges */}
          <div className="flex flex-wrap gap-1.5 mt-2">
            {location.locationCategories?.slice(0, 3).map((lc) => (
              <CategoryBadge key={lc.categoryId} colorHex={lc.category?.colorHex}>
                {lc.category?.name}
              </CategoryBadge>
            ))}
            {location.locationTags?.slice(0, 3).map((lt) => (
              <span
                key={lt.tagId}
                className="text-xs px-2 py-0.5 rounded-full"
                style={{
                  background: "var(--border)",
                  color: "var(--ink-muted)",
                  fontFamily: "var(--mono)",
                }}
              >
                {lt.tag?.name || "…"}
              </span>
            ))}
          </div>
        </div>
      </article>
    </Link>
  );
}
