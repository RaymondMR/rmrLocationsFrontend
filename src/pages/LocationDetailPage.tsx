import { useState, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Star,
  MapPin,
  Bookmark,
  Share2,
  MoreHorizontal,
  Edit3,
  Trash2,
  Clock,
  Globe,
  Phone,
  ChevronRight,
  Map,
} from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import LoadingSkeleton from "@/components/shared/LoadingSkeleton";
import EmptyState from "@/components/shared/EmptyState";
import ErrorState from "@/components/shared/ErrorState";
import Breadcrumbs from "@/components/layout/Breadcrumbs";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import { cn } from "@/lib/utils";
import api from "@/lib/axios";
import { useAuthStore } from "@/stores/auth-store";
import { formatCoordinates, formatDistance } from "@/lib/geo";
import { formatDate } from "@/lib/slug";
import type { Location, Review, OpeningHour } from "@/types/models";

/* ────────────────────────────────────────────── */
/*  LocationDetailPage                            */
/* ────────────────────────────────────────────── */
export default function LocationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { userId, roles } = useAuthStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const isOwnerOrAdmin =
    !!userId &&
    (roles.includes("Admin") || roles.includes("Owner"));

  /* ── Queries ──────────────────────────────── */
  const locationQuery = useQuery({
    queryKey: ["locations", id],
    queryFn: () =>
      api.get<Location>(`/api/location/${id}`).then((r) => r.data),
    enabled: !!id,
    staleTime: 60_000,
    retry: false,
  });

  const reviewsQuery = useQuery({
    queryKey: ["reviews", id],
    queryFn: () =>
      api
        .get<Review[]>(`/api/review/location/${id}`)
        .then((r) => r.data),
    enabled: !!id,
    staleTime: 60_000,
  });

  /* ── Delete mutation ──────────────────────── */
  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/api/location/${id}`),
    onSuccess: () => {
      navigate("/locations", { replace: true });
    },
  });

  /* ── Handlers ─────────────────────────────── */
  const handleShare = useCallback(() => {
    if (navigator.share) {
      navigator.share({
        title: locationQuery.data?.name ?? "Lugar",
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  }, [locationQuery.data]);

  const handleDelete = useCallback(() => {
    deleteMutation.mutate();
  }, [deleteMutation]);

  /* ══════════════════════════════════════════════ */
  /*  STATES                                       */
  /* ══════════════════════════════════════════════ */
  if (locationQuery.isLoading) {
    return (
      <div>
        <LoadingSkeleton variant="detail" />
      </div>
    );
  }

  if (locationQuery.isError) {
    const status = (locationQuery.error as { response?: { status?: number } })
      ?.response?.status;
    if (status === 404) {
      return (
        <EmptyState
          icon={<MapPin size={28} />}
          title="Lugar no encontrado"
          description="El lugar que buscas no existe o ha sido eliminado."
          action={{
            label: "Volver a lugares",
            onClick: () => navigate("/locations"),
          }}
        />
      );
    }
    return (
      <ErrorState
        message={
          (locationQuery.error as Error)?.message ??
          "No pudimos cargar la informacion del lugar"
        }
        onRetry={() => locationQuery.refetch()}
      />
    );
  }

  const loc = locationQuery.data!;
  const reviews = reviewsQuery.data ?? [];
  const primaryCat = loc.locationCategories?.find((lc) => lc.isPrimary)
    ?.category;

  /* ══════════════════════════════════════════════ */
  /*  RENDER                                       */
  /* ══════════════════════════════════════════════ */
  return (
    <div>
      {/* ── Breadcrumbs ───────────────────────── */}
      <Breadcrumbs
        items={[
          { label: "Lugares", href: "/locations" },
          { label: loc.name },
        ]}
      />

      {/* ── Header ────────────────────────────── */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "1rem",
          marginBottom: "0.75rem",
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Name */}
          <h1
            style={{
              fontFamily: "var(--display)",
              fontSize: "clamp(1.5rem, 4vw, 2.375rem)",
              fontWeight: 700,
              color: "var(--ink)",
              margin: 0,
              lineHeight: 1.15,
            }}
          >
            {loc.name}
          </h1>

          {/* Coordinates eyebrow */}
          <p
            style={{
              fontFamily: "var(--mono)",
              fontSize: "0.8rem",
              color: "var(--ink-muted)",
              margin: "0.35rem 0 0 0",
            }}
          >
            {formatCoordinates(loc.latitude, loc.longitude)}
          </p>
        </div>

        {/* Actions */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            flexShrink: 0,
          }}
        >
          {/* Save */}
          <button
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.35rem",
              padding: "9px 16px",
              borderRadius: "8px",
              border: "1px solid var(--border)",
              background: "var(--surface)",
              color: "var(--ink)",
              cursor: "pointer",
              fontFamily: "var(--sans)",
              fontSize: "0.85rem",
              fontWeight: 500,
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background =
                "var(--background)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background =
                "var(--surface)";
            }}
          >
            <Bookmark size={15} />
            Guardar
          </button>

          {/* Share */}
          <button
            onClick={handleShare}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "38px",
              height: "38px",
              borderRadius: "8px",
              border: "1px solid var(--border)",
              background: "var(--surface)",
              color: "var(--ink-muted)",
              cursor: "pointer",
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background =
                "var(--background)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background =
                "var(--surface)";
            }}
            title="Compartir"
          >
            <Share2 size={15} />
          </button>

          {/* Owner/admin menu */}
          {isOwnerOrAdmin && (
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setMenuOpen((prev) => !prev)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "38px",
                  height: "38px",
                  borderRadius: "8px",
                  border: "1px solid var(--border)",
                  background: "var(--surface)",
                  color: "var(--ink-muted)",
                  cursor: "pointer",
                  transition: "background 0.15s",
                }}
                title="Mas acciones"
              >
                <MoreHorizontal size={15} />
              </button>

              {menuOpen && (
                <div
                  style={{
                    position: "absolute",
                    top: "calc(100% + 4px)",
                    right: 0,
                    width: "180px",
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    borderRadius: "10px",
                    boxShadow: "0 8px 24px rgba(0,0,0,0.1)",
                    padding: "6px",
                    zIndex: 20,
                  }}
                >
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      navigate(`/locations/${id}/edit`);
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      width: "100%",
                      padding: "8px 10px",
                      borderRadius: "6px",
                      border: "none",
                      background: "transparent",
                      color: "var(--ink)",
                      cursor: "pointer",
                      fontSize: "0.85rem",
                      fontWeight: 500,
                      fontFamily: "var(--sans)",
                      textAlign: "left",
                      transition: "background 0.12s",
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
                    <Edit3 size={14} />
                    Editar
                  </button>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      setDeleteOpen(true);
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      width: "100%",
                      padding: "8px 10px",
                      borderRadius: "6px",
                      border: "none",
                      background: "transparent",
                      color: "var(--danger)",
                      cursor: "pointer",
                      fontSize: "0.85rem",
                      fontWeight: 500,
                      fontFamily: "var(--sans)",
                      textAlign: "left",
                      transition: "background 0.12s",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.background =
                        "color-mix(in srgb, var(--danger) 8%, transparent)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.background =
                        "transparent";
                    }}
                  >
                    <Trash2 size={14} />
                    Eliminar
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Category chips + Rating + Status ──── */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: "0.75rem",
          marginBottom: "1.5rem",
        }}
      >
        {/* Category chips */}
        {loc.locationCategories?.map((lc) => (
          <span
            key={lc.categoryId}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.3rem",
              padding: "4px 10px",
              borderRadius: "6px",
              background: lc.category?.colorHex
                ? `color-mix(in srgb, ${lc.category.colorHex} 12%, transparent)`
                : "var(--background)",
              color: lc.category?.colorHex ?? "var(--ink-muted)",
              fontFamily: "var(--sans)",
              fontSize: "0.8rem",
              fontWeight: 600,
            }}
          >
            {lc.category?.name ?? "Categoria"}
          </span>
        ))}

        {/* Rating */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.3rem",
          }}
        >
          <Star
            size={16}
            style={{ color: "var(--rating)", fill: "var(--rating)" }}
          />
          <span
            style={{
              fontFamily: "var(--mono)",
              fontSize: "0.9rem",
              fontWeight: 600,
              color: "var(--ink)",
            }}
          >
            {loc.averageRating.toFixed(1)}
          </span>
          <span
            style={{
              fontSize: "0.8rem",
              color: "var(--ink-muted)",
            }}
          >
            ({loc.reviewCount} {loc.reviewCount === 1 ? "resena" : "resenas"})
          </span>
        </div>

        {/* Status badge (owner/admin only) */}
        {isOwnerOrAdmin && loc.status && (
          <span
            style={{
              padding: "3px 10px",
              borderRadius: "6px",
              fontFamily: "var(--mono)",
              fontSize: "0.7rem",
              fontWeight: 600,
              background:
                loc.status === "Published"
                  ? "color-mix(in srgb, var(--success) 12%, transparent)"
                  : loc.status === "Draft"
                    ? "color-mix(in srgb, var(--rating) 12%, transparent)"
                    : "color-mix(in srgb, var(--danger) 12%, transparent)",
              color:
                loc.status === "Published"
                  ? "var(--success)"
                  : loc.status === "Draft"
                    ? "var(--rating)"
                    : "var(--danger)",
            }}
          >
            {loc.status === "Published"
              ? "Publicado"
              : loc.status === "Draft"
                ? "Borrador"
                : "Archivado"}
          </span>
        )}
      </div>

      {/* ── 2-col layout ──────────────────────── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 360px",
          gap: "2rem",
          alignItems: "start",
        }}
        className="lg:grid-cols-[1fr_360px] max-lg:grid-cols-1"
      >
        {/* ════ LEFT COLUMN ════════════════════ */}
        <div>
          {/* Description */}
          <section style={{ marginBottom: "2rem" }}>
            <h2
              style={{
                fontFamily: "var(--display)",
                fontSize: "1.15rem",
                fontWeight: 700,
                color: "var(--ink)",
                margin: "0 0 0.75rem 0",
              }}
            >
              Descripcion
            </h2>
            <p
              style={{
                fontSize: "0.9rem",
                color: "var(--ink-muted)",
                lineHeight: 1.7,
                margin: 0,
                whiteSpace: "pre-wrap",
              }}
            >
              {loc.description || "Sin descripcion disponible."}
            </p>
          </section>

          {/* Reviews section */}
          <section>
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
                  fontSize: "1.15rem",
                  fontWeight: 700,
                  color: "var(--ink)",
                  margin: 0,
                }}
              >
                Resenas ({reviews.length})
              </h2>
            </div>

            {reviewsQuery.isLoading && <LoadingSkeleton variant="text" count={3} />}

            {reviewsQuery.isError && (
              <ErrorState
                message="No pudimos cargar las resenas"
                onRetry={() => reviewsQuery.refetch()}
              />
            )}

            {reviewsQuery.isSuccess && reviews.length === 0 && (
              <p
                style={{
                  fontSize: "0.875rem",
                  color: "var(--ink-muted)",
                  fontStyle: "italic",
                  margin: 0,
                }}
              >
                Aun no hay resenas para este lugar. Se el primero en opinar.
              </p>
            )}

            {reviews.length > 0 && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "1rem",
                }}
              >
                {reviews.map((rev) => (
                  <div
                    key={rev.id}
                    style={{
                      padding: "1rem",
                      borderRadius: "10px",
                      background: "var(--surface)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: "0.5rem",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                        }}
                      >
                        <span
                          style={{
                            fontWeight: 600,
                            fontSize: "0.85rem",
                            color: "var(--ink)",
                          }}
                        >
                          {rev.user?.displayName ?? "Anonimo"}
                        </span>
                        <span
                          style={{
                            fontSize: "0.75rem",
                            color: "var(--ink-muted)",
                          }}
                        >
                          {rev.visitedOn
                            ? formatDate(rev.visitedOn)
                            : ""}
                        </span>
                      </div>
                      {/* Rating stars */}
                      <div
                        style={{
                          display: "flex",
                          gap: "2px",
                        }}
                      >
                        {Array.from({ length: 5 }, (_, i) => (
                          <Star
                            key={i}
                            size={12}
                            style={{
                              color: "var(--rating)",
                              fill:
                                i < rev.rating
                                  ? "var(--rating)"
                                  : "transparent",
                            }}
                          />
                        ))}
                      </div>
                    </div>
                    {rev.title && (
                      <h4
                        style={{
                          margin: "0 0 0.35rem 0",
                          fontSize: "0.9rem",
                          fontWeight: 600,
                          color: "var(--ink)",
                        }}
                      >
                        {rev.title}
                      </h4>
                    )}
                    {rev.body && (
                      <p
                        style={{
                          margin: 0,
                          fontSize: "0.85rem",
                          color: "var(--ink-muted)",
                          lineHeight: 1.6,
                        }}
                      >
                        {rev.body}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* ════ RIGHT COLUMN ════════════════════ */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "1.25rem",
          }}
        >
          {/* Map placeholder */}
          <div
            style={{
              width: "100%",
              height: "220px",
              borderRadius: "12px",
              border: "1px solid var(--border)",
              background:
                "repeating-linear-gradient(45deg, var(--background) 0px, var(--background) 16px, var(--surface) 16px, var(--surface) 32px)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
              color: "var(--ink-muted)",
            }}
          >
            <Map size={28} style={{ color: "var(--primary)" }} />
            <span
              style={{
                fontFamily: "var(--display)",
                fontSize: "0.85rem",
                fontWeight: 600,
              }}
            >
              Mapa interactivo
            </span>
            <span
              style={{
                fontSize: "0.75rem",
                textAlign: "center",
                padding: "0 1rem",
              }}
            >
              {formatCoordinates(loc.latitude, loc.longitude)}
            </span>
          </div>

          {/* Address card */}
          <div
            style={{
              padding: "1rem",
              borderRadius: "10px",
              background: "var(--surface)",
              border: "1px solid var(--border)",
            }}
          >
            <h3
              style={{
                fontFamily: "var(--display)",
                fontSize: "0.9rem",
                fontWeight: 600,
                color: "var(--ink)",
                margin: "0 0 0.5rem 0",
              }}
            >
              Direccion
            </h3>
            <p
              style={{
                margin: 0,
                fontSize: "0.85rem",
                color: "var(--ink-muted)",
                lineHeight: 1.6,
              }}
            >
              {loc.address?.street && <>{loc.address.street}, </>}
              {loc.address?.exteriorNumber && (
                <>{loc.address.exteriorNumber}, </>
              )}
              {loc.address?.neighborhood && <>{loc.address.neighborhood}, </>}
              {loc.address?.city && <>{loc.address.city}, </>}
              {loc.address?.state && <>{loc.address.state}</>}
              {!loc.address?.street &&
                !loc.address?.city &&
                "Sin direccion registrada"}
            </p>
          </div>

          {/* Opening hours */}
          <div
            style={{
              padding: "1rem",
              borderRadius: "10px",
              background: "var(--surface)",
              border: "1px solid var(--border)",
            }}
          >
            <h3
              style={{
                fontFamily: "var(--display)",
                fontSize: "0.9rem",
                fontWeight: 600,
                color: "var(--ink)",
                margin: "0 0 0.5rem 0",
                display: "flex",
                alignItems: "center",
                gap: "0.35rem",
              }}
            >
              <Clock size={14} /> Horarios
            </h3>
            {loc.openingHours && loc.openingHours.length > 0 ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.3rem",
                }}
              >
                {loc.openingHours.map((oh) => (
                  <div
                    key={oh.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "0.8rem",
                      color: oh.isClosed
                        ? "var(--ink-muted)"
                        : "var(--ink)",
                      fontFamily: oh.isClosed ? "var(--sans)" : "var(--mono)",
                    }}
                  >
                    <span>{oh.dayOfWeek.slice(0, 3)}</span>
                    <span>
                      {oh.isClosed
                        ? "Cerrado"
                        : `${oh.opensAt} - ${oh.closesAt}`}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p
                style={{
                  margin: 0,
                  fontSize: "0.8rem",
                  color: "var(--ink-muted)",
                }}
              >
                Sin horarios registrados
              </p>
            )}
          </div>

          {/* Links */}
          {(loc.websiteUrl || loc.phoneNumber) && (
            <div
              style={{
                padding: "1rem",
                borderRadius: "10px",
                background: "var(--surface)",
                border: "1px solid var(--border)",
              }}
            >
              {loc.websiteUrl && (
                <a
                  href={loc.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.4rem",
                    fontSize: "0.85rem",
                    color: "var(--primary)",
                    textDecoration: "none",
                    marginBottom: loc.phoneNumber ? "0.5rem" : 0,
                  }}
                >
                  <Globe size={14} />
                  Sitio web
                </a>
              )}
              {loc.phoneNumber && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.4rem",
                    fontSize: "0.85rem",
                    color: "var(--ink)",
                  }}
                >
                  <Phone size={14} style={{ color: "var(--ink-muted)" }} />
                  {loc.phoneNumber}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Delete confirmation dialog ────────── */}
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Eliminar lugar"
        description="Esta accion no se puede deshacer. El lugar se marcara como eliminado."
        confirmLabel="Eliminar"
        variant="danger"
        onConfirm={handleDelete}
      />
    </div>
  );
}
