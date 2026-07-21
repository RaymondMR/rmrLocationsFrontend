import { Link } from "react-router-dom";
import { Lock, Link2, Globe } from "lucide-react";
import type { LocationCollection } from "@/types/models";

interface CollectionCardProps {
  collection: LocationCollection;
}

const visibilityIcons = {
  Private: { Icon: Lock, label: "Privada" },
  Unlisted: { Icon: Link2, label: "No listada" },
  Public: { Icon: Globe, label: "Pública" },
};

export default function CollectionCard({ collection }: CollectionCardProps) {
  const { Icon, label } = visibilityIcons[collection.visibility];
  const itemCount = collection.items?.length ?? 0;

  return (
    <Link
      to={`/collections/${collection.id}`}
      style={{ textDecoration: "none" }}
      className="block group"
    >
      <article
        className="p-4 rounded-xl border transition-all duration-150"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)";
          e.currentTarget.style.transform = "translateY(-2px)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = "none";
          e.currentTarget.style.transform = "translateY(0)";
        }}
      >
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-bold text-base" style={{ fontFamily: "var(--display)", color: "var(--ink)" }}>
            {collection.name}
          </h3>
          <span
            className="inline-flex items-center gap-1 text-xs rounded-full px-2 py-0.5"
            style={{
              fontFamily: "var(--mono)",
              color: "var(--ink-muted)",
              background: "var(--border)",
            }}
          >
            <Icon size={12} />
            {label}
          </span>
        </div>

        {collection.description && (
          <p className="text-sm line-clamp-2 mb-2" style={{ color: "var(--ink-muted)" }}>
            {collection.description}
          </p>
        )}

        <div className="flex gap-1 flex-wrap mt-2">
          {collection.items?.slice(0, 4).map((item, i) => {
            const cat = item.location?.locationCategories?.find((lc) => lc.isPrimary);
            return (
              <div
                key={i}
                className="w-8 h-8 rounded-full"
                style={{
                  background: `${cat?.category?.colorHex || "var(--primary)"}20`,
                }}
              />
            );
          })}
        </div>

        <p
          className="text-xs mt-3"
          style={{ fontFamily: "var(--mono)", color: "var(--ink-muted)" }}
        >
          {itemCount} {itemCount === 1 ? "lugar" : "lugares"}
        </p>
      </article>
    </Link>
  );
}
