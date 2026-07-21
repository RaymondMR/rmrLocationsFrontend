import { useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  LayoutDashboard,
  MapPin,
  Layers,
  Tag,
  Search,
  Eye,
  Edit3,
  Trash2,
  Star,
  Plus,
} from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import LoadingSkeleton from "@/components/shared/LoadingSkeleton";
import EmptyState from "@/components/shared/EmptyState";
import ErrorState from "@/components/shared/ErrorState";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import { cn } from "@/lib/utils";
import api from "@/lib/axios";
import { formatDate } from "@/lib/slug";
import { useAuthStore } from "@/stores/auth-store";
import type {
  Location,
  Category,
  Tag as TagType,
  PagedResult,
} from "@/types/models";

/* ────────────────────────────────────────────── */
/*  AdminDashboardPage                            */
/* ────────────────────────────────────────────── */
export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [tableSearch, setTableSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  /* ── Stats queries ────────────────────────── */
  const locationsQuery = useQuery({
    queryKey: ["admin", "locations"],
    queryFn: () =>
      api
        .get<PagedResult<Location>>("/api/location?pageSize=100")
        .then((r) => r.data),
    staleTime: 60_000,
  });

  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: () =>
      api.get<Category[]>("/api/category").then((r) => r.data),
    staleTime: 120_000,
  });

  const tagsQuery = useQuery({
    queryKey: ["tags"],
    queryFn: () =>
      api.get<TagType[]>("/api/tag").then((r) => r.data),
    staleTime: 120_000,
  });

  /* ── Derived stats ────────────────────────── */
  const allLocations = locationsQuery.data?.items ?? [];
  const totalLocations = locationsQuery.data?.totalCount ?? 0;
  const publishedCount = allLocations.filter(
    (l) => l.status === "Published",
  ).length;
  const draftCount = allLocations.filter(
    (l) => l.status === "Draft",
  ).length;
  const archivedCount = allLocations.filter(
    (l) => l.status === "Archived",
  ).length;

  /* ── Filtered locations for table ─────────── */
  const filteredLocations = allLocations.filter((loc) => {
    const matchesSearch =
      !tableSearch ||
      loc.name.toLowerCase().includes(tableSearch.toLowerCase());
    const matchesStatus =
      !statusFilter || loc.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  /* ── Soft delete mutation ─────────────────── */
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/location/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "locations"] });
      queryClient.invalidateQueries({ queryKey: ["locations"] });
      setDeleteTarget(null);
    },
  });

  const handleDelete = useCallback(() => {
    if (deleteTarget) deleteMutation.mutate(deleteTarget);
  }, [deleteTarget, deleteMutation]);

  /* ══════════════════════════════════════════════ */
  /*  RENDER                                       */
  /* ══════════════════════════════════════════════ */
  return (
    <div>
      <PageHeader
        title="Dashboard de administracion"
        subtitle="Gestiona lugares, categorias y tags"
      />

      {/* ── Stat tiles ─────────────────────────── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fill, minmax(200px, 1fr))",
          gap: "1rem",
          marginBottom: "2rem",
        }}
      >
        <StatTile
          icon={<MapPin size={20} />}
          label="Total lugares"
          value={totalLocations}
          color="var(--primary)"
        />
        <StatTile
          icon={<MapPin size={20} />}
          label="Publicados"
          value={publishedCount}
          color="var(--success)"
        />
        <StatTile
          icon={<MapPin size={20} />}
          label="Borradores"
          value={draftCount}
          color="var(--rating)"
        />
        <StatTile
          icon={<MapPin size={20} />}
          label="Archivados"
          value={archivedCount}
          color="var(--danger)"
        />
        <StatTile
          icon={<Layers size={20} />}
          label="Categorias"
          value={categoriesQuery.data?.length ?? 0}
          color="var(--route)"
        />
        <StatTile
          icon={<Tag size={20} />}
          label="Tags"
          value={tagsQuery.data?.length ?? 0}
          color="var(--primary)"
        />
      </div>

      {/* ── Location table ──────────────────────── */}
      <div
        style={{
          padding: "1.25rem",
          borderRadius: "12px",
          background: "var(--surface)",
          border: "1px solid var(--border)",
          marginBottom: "2rem",
        }}
      >
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "0.75rem",
            marginBottom: "1rem",
          }}
        >
          <h2
            style={{
              fontFamily: "var(--display)",
              fontSize: "1.1rem",
              fontWeight: 700,
              color: "var(--ink)",
              margin: 0,
            }}
          >
            Lugares
          </h2>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            {/* Search */}
            <div style={{ position: "relative" }}>
              <Search
                size={14}
                style={{
                  position: "absolute",
                  left: "10px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--ink-muted)",
                  pointerEvents: "none",
                }}
              />
              <input
                type="text"
                placeholder="Buscar lugar…"
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                style={{
                  padding: "8px 10px 8px 30px",
                  borderRadius: "6px",
                  border: "1px solid var(--border)",
                  background: "var(--background)",
                  color: "var(--ink)",
                  fontFamily: "var(--sans)",
                  fontSize: "0.8rem",
                  outline: "none",
                  width: "180px",
                }}
              />
            </div>

            {/* Status filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                padding: "8px 10px",
                borderRadius: "6px",
                border: "1px solid var(--border)",
                background: "var(--background)",
                color: "var(--ink)",
                fontFamily: "var(--sans)",
                fontSize: "0.8rem",
                outline: "none",
                cursor: "pointer",
              }}
            >
              <option value="">Todos</option>
              <option value="Published">Publicados</option>
              <option value="Draft">Borradores</option>
              <option value="Archived">Archivados</option>
            </select>
          </div>
        </div>

        {/* Table */}
        {locationsQuery.isLoading && (
          <LoadingSkeleton variant="table-row" count={5} />
        )}

        {locationsQuery.isError && (
          <ErrorState
            message="No pudimos cargar los lugares"
            onRetry={() => locationsQuery.refetch()}
          />
        )}

        {locationsQuery.isSuccess && filteredLocations.length === 0 && (
          <EmptyState
            title="Sin resultados"
            description={
              tableSearch || statusFilter
                ? "Intenta ajustar los filtros."
                : "Aun no hay lugares registrados."
            }
          />
        )}

        {filteredLocations.length > 0 && (
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "0.85rem",
              }}
            >
              <thead>
                <tr
                  style={{
                    borderBottom: "1px solid var(--border)",
                    color: "var(--ink-muted)",
                    fontFamily: "var(--mono)",
                    fontSize: "0.75rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  <th
                    style={{
                      textAlign: "left",
                      padding: "0.6rem 0.75rem",
                      fontWeight: 600,
                    }}
                  >
                    Nombre
                  </th>
                  <th
                    style={{
                      textAlign: "left",
                      padding: "0.6rem 0.75rem",
                      fontWeight: 600,
                    }}
                  >
                    Categoria
                  </th>
                  <th
                    style={{
                      textAlign: "left",
                      padding: "0.6rem 0.75rem",
                      fontWeight: 600,
                    }}
                  >
                    Estado
                  </th>
                  <th
                    style={{
                      textAlign: "left",
                      padding: "0.6rem 0.75rem",
                      fontWeight: 600,
                    }}
                  >
                    Rating
                  </th>
                  <th
                    style={{
                      textAlign: "left",
                      padding: "0.6rem 0.75rem",
                      fontWeight: 600,
                    }}
                  >
                    Creado
                  </th>
                  <th
                    style={{
                      textAlign: "right",
                      padding: "0.6rem 0.75rem",
                      fontWeight: 600,
                    }}
                  >
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredLocations.map((loc) => {
                  const primaryCat = loc.locationCategories?.find(
                    (lc) => lc.isPrimary,
                  )?.category;

                  return (
                    <tr
                      key={loc.id}
                      style={{
                        borderBottom: "1px solid var(--border)",
                        transition: "background 0.1s",
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.background =
                          "var(--background)";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.background =
                          "transparent";
                      }}
                    >
                      <td
                        style={{
                          padding: "0.75rem",
                          fontWeight: 600,
                          color: "var(--ink)",
                        }}
                      >
                        {loc.name}
                      </td>
                      <td style={{ padding: "0.75rem", color: "var(--ink-muted)" }}>
                        {primaryCat?.name ?? "—"}
                      </td>
                      <td style={{ padding: "0.75rem" }}>
                        <StatusBadge status={loc.status} />
                      </td>
                      <td style={{ padding: "0.75rem" }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.25rem",
                          }}
                        >
                          <Star
                            size={12}
                            style={{
                              color: "var(--rating)",
                              fill: "var(--rating)",
                            }}
                          />
                          <span
                            style={{
                              fontFamily: "var(--mono)",
                              fontSize: "0.8rem",
                              color: "var(--ink)",
                            }}
                          >
                            {loc.averageRating.toFixed(1)}
                          </span>
                        </div>
                      </td>
                      <td
                        style={{
                          padding: "0.75rem",
                          color: "var(--ink-muted)",
                          fontFamily: "var(--mono)",
                          fontSize: "0.75rem",
                        }}
                      >
                        {formatDate(loc.createdAtUtc)}
                      </td>
                      <td
                        style={{
                          padding: "0.75rem",
                          textAlign: "right",
                        }}
                      >
                        <div
                          style={{
                            display: "inline-flex",
                            gap: "0.25rem",
                          }}
                        >
                          <IconButton
                            icon={<Eye size={14} />}
                            label="Ver"
                            onClick={() => navigate(`/locations/${loc.id}`)}
                          />
                          <IconButton
                            icon={<Edit3 size={14} />}
                            label="Editar"
                            onClick={() =>
                              navigate(`/locations/${loc.id}/edit`)
                            }
                          />
                          <IconButton
                            icon={<Trash2 size={14} />}
                            label="Eliminar"
                            danger
                            onClick={() => setDeleteTarget(loc.id)}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Categories section ─────────────────── */}
      <div
        style={{
          padding: "1.25rem",
          borderRadius: "12px",
          background: "var(--surface)",
          border: "1px solid var(--border)",
          marginBottom: "2rem",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "1rem",
          }}
        >
          <h2
            style={{
              fontFamily: "var(--display)",
              fontSize: "1.1rem",
              fontWeight: 700,
              color: "var(--ink)",
              margin: 0,
            }}
          >
            Categorias
          </h2>
          <button
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.3rem",
              padding: "7px 14px",
              borderRadius: "6px",
              border: "none",
              background: "var(--primary)",
              color: "#fff",
              cursor: "pointer",
              fontFamily: "var(--sans)",
              fontSize: "0.8rem",
              fontWeight: 600,
            }}
          >
            <Plus size={14} />
            Nueva
          </button>
        </div>

        {categoriesQuery.isLoading && (
          <LoadingSkeleton variant="table-row" count={4} />
        )}

        {categoriesQuery.isError && (
          <ErrorState
            message="No pudimos cargar las categorias"
            onRetry={() => categoriesQuery.refetch()}
          />
        )}

        {categoriesQuery.isSuccess && categoriesQuery.data?.length === 0 && (
          <EmptyState title="Sin categorias" />
        )}

        {categoriesQuery.isSuccess &&
          categoriesQuery.data &&
          categoriesQuery.data.length > 0 && (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "0.5rem",
              }}
            >
              {categoriesQuery.data.map((cat) => (
                <div
                  key={cat.id}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.4rem",
                    padding: "6px 12px",
                    borderRadius: "8px",
                    background: cat.colorHex
                      ? `color-mix(in srgb, ${cat.colorHex} 10%, transparent)`
                      : "var(--background)",
                    color: cat.colorHex ?? "var(--ink)",
                    fontFamily: "var(--sans)",
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    border: "1px solid var(--border)",
                  }}
                >
                  {cat.name}
                  <span
                    style={{
                      fontFamily: "var(--mono)",
                      fontSize: "0.65rem",
                      color: "var(--ink-muted)",
                    }}
                  >
                    ({cat.sortOrder})
                  </span>
                </div>
              ))}
            </div>
          )}
      </div>

      {/* ── Tags section ────────────────────────── */}
      <div
        style={{
          padding: "1.25rem",
          borderRadius: "12px",
          background: "var(--surface)",
          border: "1px solid var(--border)",
          marginBottom: "2rem",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "1rem",
          }}
        >
          <h2
            style={{
              fontFamily: "var(--display)",
              fontSize: "1.1rem",
              fontWeight: 700,
              color: "var(--ink)",
              margin: 0,
            }}
          >
            Tags
          </h2>
          <button
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.3rem",
              padding: "7px 14px",
              borderRadius: "6px",
              border: "none",
              background: "var(--primary)",
              color: "#fff",
              cursor: "pointer",
              fontFamily: "var(--sans)",
              fontSize: "0.8rem",
              fontWeight: 600,
            }}
          >
            <Plus size={14} />
            Nuevo
          </button>
        </div>

        {tagsQuery.isLoading && <LoadingSkeleton variant="text" count={4} />}

        {tagsQuery.isError && (
          <ErrorState
            message="No pudimos cargar los tags"
            onRetry={() => tagsQuery.refetch()}
          />
        )}

        {tagsQuery.isSuccess && tagsQuery.data?.length === 0 && (
          <EmptyState title="Sin tags" />
        )}

        {tagsQuery.isSuccess &&
          tagsQuery.data &&
          tagsQuery.data.length > 0 && (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "0.4rem",
              }}
            >
              {tagsQuery.data.map((t) => (
                <span
                  key={t.id}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.35rem",
                    padding: "4px 10px",
                    borderRadius: "6px",
                    background:
                      "color-mix(in srgb, var(--primary) 6%, transparent)",
                    color: "var(--primary)",
                    fontFamily: "var(--mono)",
                    fontSize: "0.75rem",
                    fontWeight: 500,
                  }}
                >
                  #{t.name}
                  <span
                    style={{
                      fontSize: "0.65rem",
                      opacity: 0.7,
                    }}
                  >
                    {t.usageCount}
                  </span>
                </span>
              ))}
            </div>
          )}
      </div>

      {/* ── Note about no recycle bin ──────────── */}
      <div
        style={{
          padding: "0.75rem 1rem",
          borderRadius: "8px",
          background:
            "color-mix(in srgb, var(--rating) 8%, transparent)",
          border: "1px solid var(--rating)",
          fontSize: "0.8rem",
          color: "var(--ink-muted)",
          lineHeight: 1.5,
          marginBottom: "2rem",
        }}
      >
        <strong>Nota:</strong> No hay papelera de reciclaje. Los elementos
        eliminados se marcan como eliminados (soft delete) y no se muestran
        en las busquedas publicas, pero persisten en la base de datos.
      </div>

      {/* ── Delete confirmation dialog ────────── */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
        title="Eliminar lugar"
        description="Esta accion marcara el lugar como eliminado. No aparecera en busquedas publicas."
        confirmLabel="Eliminar"
        variant="danger"
        onConfirm={handleDelete}
      />
    </div>
  );
}

/* ────────────────────────────────────────────── */
/*  Internal components                          */
/* ────────────────────────────────────────────── */

interface StatTileProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
}

function StatTile({ icon, label, value, color }: StatTileProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
        padding: "1.15rem",
        borderRadius: "12px",
        background: "var(--surface)",
        border: "1px solid var(--border)",
      }}
    >
      <div
        style={{
          width: "44px",
          height: "44px",
          borderRadius: "12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: `color-mix(in srgb, ${color} 12%, transparent)`,
          color,
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div>
        <span
          style={{
            fontFamily: "var(--display)",
            fontSize: "1.35rem",
            fontWeight: 700,
            color: "var(--ink)",
            display: "block",
            lineHeight: 1.2,
          }}
        >
          {value}
        </span>
        <span
          style={{
            fontSize: "0.78rem",
            color: "var(--ink-muted)",
            display: "block",
            marginTop: "0.1rem",
          }}
        >
          {label}
        </span>
      </div>
    </div>
  );
}

interface StatusBadgeProps {
  status: string;
}

function StatusBadge({ status }: StatusBadgeProps) {
  const config: Record<
    string,
    { label: string; color: string; bg: string }
  > = {
    Published: {
      label: "Publicado",
      color: "var(--success)",
      bg: "color-mix(in srgb, var(--success) 12%, transparent)",
    },
    Draft: {
      label: "Borrador",
      color: "var(--rating)",
      bg: "color-mix(in srgb, var(--rating) 12%, transparent)",
    },
    Archived: {
      label: "Archivado",
      color: "var(--danger)",
      bg: "color-mix(in srgb, var(--danger) 12%, transparent)",
    },
  };
  const c = config[status] ?? {
    label: status,
    color: "var(--ink-muted)",
    bg: "var(--background)",
  };

  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 8px",
        borderRadius: "4px",
        background: c.bg,
        color: c.color,
        fontFamily: "var(--mono)",
        fontSize: "0.7rem",
        fontWeight: 600,
      }}
    >
      {c.label}
    </span>
  );
}

interface IconButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}

function IconButton({
  icon,
  label,
  onClick,
  danger,
}: IconButtonProps) {
  return (
    <button
      onClick={onClick}
      title={label}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: "30px",
        height: "30px",
        borderRadius: "6px",
        border: "1px solid var(--border)",
        background: "transparent",
        color: danger ? "var(--danger)" : "var(--ink-muted)",
        cursor: "pointer",
        transition: "background 0.1s, color 0.1s",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.background =
          danger
            ? "color-mix(in srgb, var(--danger) 8%, transparent)"
            : "var(--background)";
        if (danger)
          (e.currentTarget as HTMLElement).style.color = "var(--danger)";
        else
          (e.currentTarget as HTMLElement).style.color = "var(--ink)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.background = "transparent";
        (e.currentTarget as HTMLElement).style.color = danger
          ? "var(--danger)"
          : "var(--ink-muted)";
      }}
    >
      {icon}
    </button>
  );
}
