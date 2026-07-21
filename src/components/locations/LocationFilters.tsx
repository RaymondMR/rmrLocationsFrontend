import { useState, useCallback } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { Category } from "@/types/models";
import { cn } from "@/lib/utils";

interface LocationFiltersProps {
  categories: Category[];
  tags: { id: string; name: string; count: number }[];
  filters: {
    q?: string;
    categoryId?: string;
    tagIds?: string;
    sort?: string;
  };
  onFilterChange: (key: string, value: string) => void;
  onClear: () => void;
  className?: string;
}

export default function LocationFilters({
  categories,
  tags,
  filters,
  onFilterChange,
  onClear,
  className,
}: LocationFiltersProps) {
  const [searchValue, setSearchValue] = useState(filters.q || "");
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSearch = useCallback(
    (value: string) => {
      setSearchValue(value);
      // Debounce would be handled at page level; here we just fire immediately
      onFilterChange("q", value);
    },
    [onFilterChange],
  );

  const hasActiveFilters = filters.q || filters.categoryId || filters.tagIds || filters.sort;

  const filterContent = (
    <div className="flex flex-wrap items-center gap-3">
      {/* Search */}
      <div className="relative flex-1 min-w-[200px] max-w-[320px]">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2"
          style={{ color: "var(--ink-muted)" }}
        />
        <Input
          value={searchValue}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Buscar lugares…"
          className="pl-9"
        />
      </div>

      {/* Category */}
      <Select
        placeholder="Categoría"
        value={filters.categoryId || ""}
        onChange={(v) => onFilterChange("categoryId", v)}
        options={categories.map((c) => ({ value: c.id, label: c.name }))}
        className="min-w-[140px]"
      />

      {/* Sort */}
      <Select
        placeholder="Ordenar por"
        value={filters.sort || "name"}
        onChange={(v) => onFilterChange("sort", v)}
        options={[
          { value: "name", label: "Nombre" },
          { value: "rating", label: "Mejor valorados" },
          { value: "recent", label: "Más recientes" },
        ]}
        className="min-w-[150px]"
      />

      {/* Clear */}
      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={onClear}>
          <X size={14} />
          Limpiar filtros
        </Button>
      )}
    </div>
  );

  return (
    <div className={cn(className)}>
      {/* Desktop */}
      <div className="hidden lg:block">{filterContent}</div>

      {/* Mobile */}
      <div className="lg:hidden">
        <Button variant="secondary" size="sm" onClick={() => setMobileOpen(!mobileOpen)}>
          <SlidersHorizontal size={14} />
          Filtros
        </Button>
        {mobileOpen && (
          <div className="mt-3 p-3 rounded-xl border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            {filterContent}
          </div>
        )}
      </div>
    </div>
  );
}
