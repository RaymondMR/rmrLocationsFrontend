import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

function getVisiblePages(current: number, total: number): (number | "ellipsis")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: (number | "ellipsis")[] = [];

  // Always show first page
  pages.push(1);

  if (current > 3) {
    pages.push("ellipsis");
  }

  // Surround current page
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (current < total - 2) {
    pages.push("ellipsis");
  }

  // Always show last page
  if (total > 1) {
    pages.push(total);
  }

  return pages;
}

export default function Pagination({
  page,
  totalPages,
  onPageChange,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const visiblePages = getVisiblePages(page, totalPages);

  return (
    <nav
      aria-label="Paginación"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "0.25rem",
        padding: "1rem 0",
      }}
    >
      {/* Previous */}
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        aria-label="Página anterior"
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: "36px",
          height: "36px",
          borderRadius: "8px",
          border: "1px solid var(--border)",
          background: "transparent",
          color: page <= 1 ? "var(--border)" : "var(--ink)",
          cursor: page <= 1 ? "not-allowed" : "pointer",
          transition: "background 0.15s",
        }}
        onMouseEnter={(e) => {
          if (page > 1) (e.currentTarget as HTMLElement).style.background = "var(--background)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.background = "transparent";
        }}
      >
        <ChevronLeft size={16} />
      </button>

      {/* Page numbers */}
      {visiblePages.map((item, index) => {
        if (item === "ellipsis") {
          return (
            <span
              key={`ellipsis-${index}`}
              style={{
                width: "36px",
                height: "36px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--ink-muted)",
                fontFamily: "var(--mono)",
                fontSize: "0.8rem",
                userSelect: "none",
              }}
            >
              &hellip;
            </span>
          );
        }

        const isActive = item === page;
        return (
          <button
            key={item}
            onClick={() => onPageChange(item)}
            disabled={isActive}
            aria-label={`Página ${item}`}
            aria-current={isActive ? "page" : undefined}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              minWidth: "36px",
              height: "36px",
              padding: "0 8px",
              borderRadius: "8px",
              border: isActive ? "1px solid var(--primary)" : "1px solid var(--border)",
              background: isActive ? "color-mix(in srgb, var(--primary) 10%, transparent)" : "transparent",
              color: isActive ? "var(--primary)" : "var(--ink)",
              fontFamily: "var(--mono)",
              fontSize: "0.8rem",
              fontWeight: isActive ? 600 : 400,
              cursor: isActive ? "default" : "pointer",
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => {
              if (!isActive) (e.currentTarget as HTMLElement).style.background = "var(--background)";
            }}
            onMouseLeave={(e) => {
              if (!isActive) (e.currentTarget as HTMLElement).style.background = "transparent";
            }}
          >
            {item}
          </button>
        );
      })}

      {/* Next */}
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        aria-label="Página siguiente"
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: "36px",
          height: "36px",
          borderRadius: "8px",
          border: "1px solid var(--border)",
          background: "transparent",
          color: page >= totalPages ? "var(--border)" : "var(--ink)",
          cursor: page >= totalPages ? "not-allowed" : "pointer",
          transition: "background 0.15s",
        }}
        onMouseEnter={(e) => {
          if (page < totalPages) (e.currentTarget as HTMLElement).style.background = "var(--background)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.background = "transparent";
        }}
      >
        <ChevronRight size={16} />
      </button>
    </nav>
  );
}
