import { useState, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  MapPin,
  Crosshair,
  Compass,
  Star,
  Share2,
  ArrowRight,
  Utensils,
} from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import LoadingSkeleton from "@/components/shared/LoadingSkeleton";
import EmptyState from "@/components/shared/EmptyState";
import ErrorState from "@/components/shared/ErrorState";
import { cn } from "@/lib/utils";
import api from "@/lib/axios";
import { formatCoordinates } from "@/lib/geo";
import type { Category, Location, PagedResult } from "@/types/models";

/* ────────────────────────────────────────────── */
/*  How-it-works step data                        */
/* ────────────────────────────────────────────── */
const STEPS = [
  {
    icon: <Search size={28} />,
    title: "Busca",
    desc: "Explora lugares por categoría, ubicación o palabra clave. Encuentra exactamente lo que buscas.",
  },
  {
    icon: <Compass size={28} />,
    title: "Descubre",
    desc: "Lee reseñas, ve calificaciones y descubre los rincones mejor valorados cerca de ti.",
  },
  {
    icon: <Share2 size={28} />,
    title: "Comparte",
    desc: "Reseña tus lugares favoritos y ayuda a otros a encontrar experiencias que valen la pena.",
  },
];

/* ────────────────────────────────────────────── */
/*  HomePage                                      */
/* ────────────────────────────────────────────── */
export default function HomePage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  /* ── Handlers ─────────────────────────────── */
  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (searchQuery.trim()) {
        navigate(`/locations?q=${encodeURIComponent(searchQuery.trim())}`);
      }
    },
    [searchQuery, navigate],
  );

  const handleNearby = useCallback(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          navigate(
            `/locations?view=map&lat=${pos.coords.latitude}&lng=${pos.coords.longitude}`,
          );
        },
        () => navigate("/locations?view=map"),
      );
    } else {
      navigate("/locations?view=map");
    }
  }, [navigate]);

  /* ── Queries ──────────────────────────────── */
  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: () =>
      api.get<Category[]>("/api/category").then((r) => r.data),
    staleTime: 120_000,
  });

  const locationsQuery = useQuery({
    queryKey: ["locations", { sort: "rating", pageSize: 8 }],
    queryFn: () =>
      api
        .get<PagedResult<Location>>(
          "/api/location?sort=rating&pageSize=8",
        )
        .then((r) => r.data),
    staleTime: 120_000,
  });

  /* ── Derived data ─────────────────────────── */
  const topCategories = (categoriesQuery.data ?? [])
    .filter((c) => c.sortOrder !== undefined)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .slice(0, 8);

  const topLocations = locationsQuery.data?.items ?? [];

  /* ══════════════════════════════════════════════ */
  /*  RENDER                                       */
  /* ══════════════════════════════════════════════ */
  return (
    <div>
      {/* ── Hero ──────────────────────────────── */}
      <section
        style={{
          position: "relative",
          background: "var(--background)",
          padding: "3rem 0 4rem",
          marginBottom: "2.5rem",
          overflow: "hidden",
        }}
      >
        {/* Subtle grid pattern */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "repeating-linear-gradient(0deg, var(--grid) 0px, var(--grid) 1px, transparent 1px, transparent 48px), repeating-linear-gradient(90deg, var(--grid) 0px, var(--grid) 1px, transparent 1px, transparent 48px)",
            backgroundSize: "48px 48px",
            opacity: 0.6,
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "relative",
            zIndex: 1,
            maxWidth: "720px",
            margin: "0 auto",
            textAlign: "center",
          }}
        >
          {/* Title */}
          <h1
            style={{
              fontFamily: "var(--display)",
              fontSize: "clamp(1.8rem, 5.5vw, 3rem)",
              fontWeight: 700,
              color: "var(--ink)",
              margin: "0 0 0.75rem 0",
              lineHeight: 1.15,
              letterSpacing: "-0.02em",
            }}
          >
            Descubre lugares que valen la pena
          </h1>

          {/* Subtitle */}
          <p
            style={{
              fontSize: "clamp(0.95rem, 2vw, 1.1rem)",
              color: "var(--ink-muted)",
              lineHeight: 1.6,
              margin: "0 auto 2rem auto",
              maxWidth: "520px",
            }}
          >
            Encuentra, reseña y comparte los mejores lugares cerca de ti
          </p>

          {/* Search form */}
          <form
            onSubmit={handleSearch}
            style={{
              display: "flex",
              gap: "0.5rem",
              maxWidth: "520px",
              margin: "0 auto 1.25rem auto",
            }}
          >
            <div
              style={{
                flex: 1,
                position: "relative",
              }}
            >
              <Search
                size={18}
                style={{
                  position: "absolute",
                  left: "14px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--ink-muted)",
                  pointerEvents: "none",
                }}
              />
              <input
                type="text"
                placeholder="Buscar lugares, categorías…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: "100%",
                  padding: "14px 16px 14px 44px",
                  borderRadius: "12px",
                  border: "2px solid var(--border)",
                  background: "var(--surface)",
                  color: "var(--ink)",
                  fontFamily: "var(--sans)",
                  fontSize: "1rem",
                  outline: "none",
                  transition: "border-color 0.15s",
                }}
                onFocus={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor =
                    "var(--primary)";
                }}
                onBlur={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor =
                    "var(--border)";
                }}
              />
            </div>
            <button
              type="submit"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                padding: "14px 24px",
                borderRadius: "12px",
                background: "var(--primary)",
                color: "#fff",
                border: "none",
                cursor: "pointer",
                fontFamily: "var(--sans)",
                fontSize: "0.95rem",
                fontWeight: 600,
                whiteSpace: "nowrap",
                transition: "opacity 0.15s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.opacity = "0.9";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.opacity = "1";
              }}
            >
              Explorar
            </button>
          </form>

          {/* Nearby button */}
          <button
            onClick={handleNearby}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
              padding: "10px 20px",
              borderRadius: "10px",
              background: "transparent",
              border: "1.5px solid var(--route)",
              color: "var(--route)",
              cursor: "pointer",
              fontFamily: "var(--sans)",
              fontSize: "0.875rem",
              fontWeight: 600,
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background =
                "color-mix(in srgb, var(--route) 8%, transparent)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = "transparent";
            }}
          >
            <Crosshair size={16} />
            Cerca de mí
          </button>
        </div>
      </section>

      {/* ── Categories section ───────────────── */}
      <section style={{ marginBottom: "3rem" }}>
        <PageHeader
          title="Explora por categoría"
          action={
            <Link
              to="/categories"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.3rem",
                color: "var(--primary)",
                textDecoration: "none",
                fontSize: "0.875rem",
                fontWeight: 600,
                fontFamily: "var(--sans)",
              }}
            >
              Ver todas <ArrowRight size={14} />
            </Link>
          }
        />

        {categoriesQuery.isLoading && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
              gap: "1rem",
            }}
          >
            <LoadingSkeleton variant="card" count={8} />
          </div>
        )}

        {categoriesQuery.isError && (
          <ErrorState
            message={
              (categoriesQuery.error as Error)?.message ??
              "No pudimos cargar las categorías"
            }
            onRetry={() => categoriesQuery.refetch()}
          />
        )}

        {categoriesQuery.isSuccess && topCategories.length === 0 && (
          <EmptyState
            title="Sin categorías"
            description="Aún no hay categorías disponibles."
          />
        )}

        {categoriesQuery.isSuccess && topCategories.length > 0 && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
              gap: "1rem",
            }}
          >
            {topCategories.map((cat) => (
              <Link
                key={cat.id}
                to={`/locations?categoryId=${cat.id}`}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "0.6rem",
                  padding: "1.25rem 0.75rem",
                  borderRadius: "12px",
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  textDecoration: "none",
                  transition: "box-shadow 0.15s, transform 0.15s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow =
                    "0 4px 12px rgba(0,0,0,0.06)";
                  (e.currentTarget as HTMLElement).style.transform =
                    "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow = "none";
                  (e.currentTarget as HTMLElement).style.transform = "none";
                }}
              >
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "14px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: cat.colorHex
                      ? `color-mix(in srgb, ${cat.colorHex} 14%, transparent)`
                      : "var(--background)",
                    color: cat.colorHex ?? "var(--ink-muted)",
                    fontSize: "1.25rem",
                  }}
                >
                  <Utensils size={22} />
                </div>
                <span
                  style={{
                    fontFamily: "var(--display)",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    color: "var(--ink)",
                    textAlign: "center",
                    lineHeight: 1.3,
                  }}
                >
                  {cat.name}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ── Top rated locations ──────────────── */}
      <section style={{ marginBottom: "3rem" }}>
        <PageHeader
          title="Mejor calificados"
          action={
            <Link
              to="/locations?sort=rating"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.3rem",
                color: "var(--primary)",
                textDecoration: "none",
                fontSize: "0.875rem",
                fontWeight: 600,
                fontFamily: "var(--sans)",
              }}
            >
              Ver todos <ArrowRight size={14} />
            </Link>
          }
        />

        {locationsQuery.isLoading && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fill, minmax(260px, 1fr))",
              gap: "1rem",
            }}
          >
            <LoadingSkeleton variant="card" count={4} />
          </div>
        )}

        {locationsQuery.isError && (
          <ErrorState
            message={
              (locationsQuery.error as Error)?.message ??
              "No pudimos cargar los lugares"
            }
            onRetry={() => locationsQuery.refetch()}
          />
        )}

        {locationsQuery.isSuccess && topLocations.length === 0 && (
          <EmptyState
            title="Sin lugares"
            description="Aún no hay lugares registrados."
          />
        )}

        {locationsQuery.isSuccess && topLocations.length > 0 && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fill, minmax(260px, 1fr))",
              gap: "1rem",
            }}
          >
            {topLocations.map((loc) => (
              <Link
                key={loc.id}
                to={`/locations/${loc.id}`}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.6rem",
                  padding: "1.25rem",
                  borderRadius: "12px",
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  textDecoration: "none",
                  transition: "box-shadow 0.15s, transform 0.15s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow =
                    "0 4px 16px rgba(0,0,0,0.06)";
                  (e.currentTarget as HTMLElement).style.transform =
                    "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow = "none";
                  (e.currentTarget as HTMLElement).style.transform = "none";
                }}
              >
                {/* Name */}
                <span
                  style={{
                    fontFamily: "var(--display)",
                    fontSize: "1.05rem",
                    fontWeight: 700,
                    color: "var(--ink)",
                    lineHeight: 1.3,
                  }}
                >
                  {loc.name}
                </span>

                {/* Address */}
                <span
                  style={{
                    fontSize: "0.8rem",
                    color: "var(--ink-muted)",
                    lineHeight: 1.4,
                  }}
                >
                  {[loc.address?.neighborhood, loc.address?.city]
                    .filter(Boolean)
                    .join(", ") || "Sin dirección"}
                </span>

                {/* Rating */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.35rem",
                  }}
                >
                  <Star
                    size={14}
                    style={{ color: "var(--rating)", fill: "var(--rating)" }}
                  />
                  <span
                    style={{
                      fontFamily: "var(--mono)",
                      fontSize: "0.85rem",
                      color: "var(--ink)",
                      fontWeight: 600,
                    }}
                  >
                    {loc.averageRating.toFixed(1)}
                  </span>
                  <span
                    style={{
                      fontSize: "0.75rem",
                      color: "var(--ink-muted)",
                    }}
                  >
                    ({loc.reviewCount} reseñas)
                  </span>
                </div>

                {/* Coordinates mono */}
                <span
                  style={{
                    fontFamily: "var(--mono)",
                    fontSize: "0.7rem",
                    color: "var(--ink-muted)",
                  }}
                >
                  {formatCoordinates(loc.latitude, loc.longitude)}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ── How it works ─────────────────────── */}
      <section
        style={{
          marginBottom: "3rem",
          padding: "2.5rem 1.5rem",
          borderRadius: "16px",
          background: "var(--surface)",
          border: "1px solid var(--border)",
        }}
      >
        <h2
          style={{
            fontFamily: "var(--display)",
            fontSize: "clamp(1.3rem, 3vw, 1.6rem)",
            fontWeight: 700,
            color: "var(--ink)",
            textAlign: "center",
            margin: "0 0 2rem 0",
          }}
        >
          Como funciona
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "2rem",
            maxWidth: "900px",
            margin: "0 auto",
          }}
        >
          {STEPS.map((step) => (
            <div
              key={step.title}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
                gap: "0.75rem",
              }}
            >
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background:
                    "color-mix(in srgb, var(--primary) 10%, transparent)",
                  color: "var(--primary)",
                }}
              >
                {step.icon}
              </div>
              <h3
                style={{
                  fontFamily: "var(--display)",
                  fontSize: "1.05rem",
                  fontWeight: 600,
                  color: "var(--ink)",
                  margin: 0,
                }}
              >
                {step.title}
              </h3>
              <p
                style={{
                  fontSize: "0.85rem",
                  color: "var(--ink-muted)",
                  lineHeight: 1.6,
                  margin: 0,
                }}
              >
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA band ─────────────────────────── */}
      <section
        style={{
          padding: "3rem 2rem",
          borderRadius: "16px",
          background: "var(--surface)",
          border: "1px solid var(--border)",
          textAlign: "center",
          marginBottom: "2rem",
        }}
      >
        <h2
          style={{
            fontFamily: "var(--display)",
            fontSize: "clamp(1.3rem, 3vw, 1.6rem)",
            fontWeight: 700,
            color: "var(--ink)",
            margin: "0 0 0.5rem 0",
          }}
        >
          Conoces un lugar imperdible?
        </h2>
        <p
          style={{
            fontSize: "0.9rem",
            color: "var(--ink-muted)",
            margin: "0 0 1.5rem 0",
            maxWidth: "440px",
            marginLeft: "auto",
            marginRight: "auto",
          }}
        >
          Agrega tu lugar favorito y ayuda a otros a descubrirlo.
        </p>
        <Link
          to="/locations/new"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.4rem",
            padding: "14px 28px",
            borderRadius: "12px",
            background: "var(--primary)",
            color: "#fff",
            textDecoration: "none",
            fontFamily: "var(--sans)",
            fontSize: "0.95rem",
            fontWeight: 600,
            transition: "opacity 0.15s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.opacity = "0.9";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.opacity = "1";
          }}
        >
          Agregar lugar <ArrowRight size={16} />
        </Link>
      </section>
    </div>
  );
}
