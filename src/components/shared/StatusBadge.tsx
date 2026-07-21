import type { LocationStatus } from "@/types/models";

interface StatusBadgeProps {
  status: LocationStatus;
}

const statusConfig: Record<
  LocationStatus,
  { color: string; bg: string; label: string }
> = {
  Draft: {
    color: "#6E6A85",
    bg: "color-mix(in srgb, #6E6A85 10%, transparent)",
    label: "Borrador",
  },
  Published: {
    color: "var(--success)",
    bg: "color-mix(in srgb, var(--success) 12%, transparent)",
    label: "Publicado",
  },
  Archived: {
    color: "#A37D42",
    bg: "color-mix(in srgb, #A37D42 12%, transparent)",
    label: "Archivado",
  },
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "5px",
        padding: "3px 10px",
        borderRadius: "20px",
        fontFamily: "var(--mono)",
        fontSize: "0.75rem",
        fontWeight: 500,
        lineHeight: 1.4,
        color: config.color,
        background: config.bg,
        whiteSpace: "nowrap",
      }}
    >
      <span
        style={{
          width: "6px",
          height: "6px",
          borderRadius: "50%",
          background: config.color,
          flexShrink: 0,
        }}
      />
      {config.label}
    </span>
  );
}
