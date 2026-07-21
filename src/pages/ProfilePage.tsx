import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  MapPin,
  Lock,
  Globe,
  EyeOff as EyeOffIcon,
  ChevronRight,
  Loader2,
  Layers,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios";
import { useAuthStore } from "@/stores/auth-store";
import { cn } from "@/lib/utils";
import ChangePasswordDialog from "@/components/auth/ChangePasswordDialog";
import type { LocationCollection, Location } from "@/types/models";
import type { PagedResult } from "@/types/models";

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

const visibilityLabel: Record<string, { icon: React.ReactNode; label: string }> = {
  Public: { icon: <Globe size={14} />, label: "Publico" },
  Unlisted: { icon: <EyeOffIcon size={14} />, label: "Oculto" },
  Private: { icon: <Lock size={14} />, label: "Privado" },
};

function getInitial(name: string): string {
  return name?.charAt(0).toUpperCase() ?? "?";
}

/* ------------------------------------------------------------------ */
/*  Skeleton helpers                                                  */
/* ------------------------------------------------------------------ */

function CardSkeleton() {
  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "12px",
        padding: "1.25rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.75rem",
      }}
    >
      <div className="rmr-skel" style={{ height: "1rem", width: "65%" }} />
      <div className="rmr-skel" style={{ height: "0.8rem", width: "45%" }} />
      <div className="rmr-skel" style={{ height: "0.8rem", width: "80%" }} />
    </div>
  );
}

function SectionSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
        gap: "1rem",
      }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Section wrapper                                                   */
/* ------------------------------------------------------------------ */

function SectionHeader({
  icon,
  title,
  count,
}: {
  icon: React.ReactNode;
  title: string;
  count?: number;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
        marginBottom: "1.25rem",
      }}
    >
      <span style={{ color: "var(--primary)" }}>{icon}</span>
      <h2
        style={{
          fontFamily: "var(--display)",
          fontSize: "1.2rem",
          fontWeight: 600,
          color: "var(--ink)",
          margin: 0,
        }}
      >
        {title}
      </h2>
      {count !== undefined && (
        <span
          style={{
            fontFamily: "var(--mono)",
            fontSize: "0.8rem",
            color: "var(--ink-muted)",
            background: "var(--border)",
            padding: "0.125rem 0.5rem",
            borderRadius: "999px",
          }}
        >
          {count}
        </span>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Empty state                                                       */
/* ------------------------------------------------------------------ */

function EmptyState({
  message,
  submessage,
}: {
  message: string;
  submessage?: string;
}) {
  return (
    <div
      style={{
        textAlign: "center",
        padding: "2.5rem 1rem",
        color: "var(--ink-muted)",
      }}
    >
      <AlertTriangle
        size={32}
        style={{ marginBottom: "0.75rem", opacity: 0.5 }}
      />
      <p style={{ fontSize: "0.95rem", margin: "0 0 0.25rem" }}>{message}</p>
      {submessage && (
        <p style={{ fontSize: "0.85rem", margin: 0 }}>{submessage}</p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Error state                                                       */
/* ------------------------------------------------------------------ */

function ErrorBox({ message }: { message: string }) {
  return (
    <div
      style={{
        background: "rgba(239, 68, 68, 0.08)",
        border: "1px solid var(--danger)",
        borderRadius: "8px",
        padding: "1rem 1.25rem",
        color: "var(--danger)",
        fontSize: "0.875rem",
        fontFamily: "var(--mono)",
      }}
    >
      {message}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main page                                                         */
/* ------------------------------------------------------------------ */

export default function ProfilePage() {
  const { userName, roles, userId } = useAuthStore();
  const [cpOpen, setCpOpen] = useState(false);

  const initial = getInitial(userName ?? "");

  /* ---- Collections query ---- */
  const {
    data: collections,
    isLoading: collectionsLoading,
    isError: collectionsError,
  } = useQuery<LocationCollection[]>({
    queryKey: ["collections", userId],
    queryFn: async () => {
      const { data } = await api.get(`/api/collection/user/${userId}`);
      return Array.isArray(data) ? data : data.items ?? [];
    },
    enabled: !!userId,
  });

  /* ---- Locations query ---- */
  const {
    data: locationsData,
    isLoading: locationsLoading,
    isError: locationsError,
  } = useQuery<Location[]>({
    queryKey: ["locations", { ownerId: userId }],
    queryFn: async () => {
      const { data } = await api.get("/api/locations", {
        params: { ownerId: userId, pageSize: 100 },
      });
      // Handle both array and paged result
      if (Array.isArray(data)) return data;
      if (data && typeof data === "object" && "items" in data) {
        return (data as PagedResult<Location>).items;
      }
      return [];
    },
    enabled: !!userId,
  });

  return (
    <div style={{ animation: "rmr-rise 0.35s ease-out" }}>
      {/* Page header */}
      <div
        style={{
          marginBottom: "2rem",
        }}
      >
        <h1
          style={{
            fontFamily: "var(--display)",
            fontSize: "1.75rem",
            fontWeight: 700,
            color: "var(--ink)",
            margin: 0,
          }}
        >
          Mi Perfil
        </h1>
      </div>

      {/* Identity card */}
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "16px",
          padding: "1.5rem 2rem",
          marginBottom: "2rem",
          display: "flex",
          alignItems: "center",
          gap: "1.25rem",
          flexWrap: "wrap",
        }}
      >
        {/* Avatar */}
        <div
          style={{
            width: "64px",
            height: "64px",
            borderRadius: "50%",
            background: "var(--primary)",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "var(--display)",
            fontSize: "1.5rem",
            fontWeight: 700,
            flexShrink: 0,
            userSelect: "none",
          }}
        >
          {initial}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2
            style={{
              fontFamily: "var(--display)",
              fontSize: "1.25rem",
              fontWeight: 700,
              color: "var(--ink)",
              margin: 0,
            }}
          >
            {userName ?? "Usuario"}
          </h2>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "0.375rem",
              marginTop: "0.5rem",
            }}
          >
            {(roles ?? []).map((role) => (
              <span
                key={role}
                style={{
                  fontFamily: "var(--mono)",
                  fontSize: "0.75rem",
                  color: "var(--primary)",
                  background: "rgba(79, 70, 229, 0.08)",
                  padding: "0.125rem 0.5rem",
                  borderRadius: "999px",
                  border: "1px solid rgba(79, 70, 229, 0.15)",
                }}
              >
                {role}
              </span>
            ))}
          </div>
        </div>

        {/* Action */}
        <button
          type="button"
          onClick={() => setCpOpen(true)}
          style={{
            padding: "0.5rem 1.25rem",
            fontSize: "0.875rem",
            fontWeight: 600,
            fontFamily: "var(--sans)",
            color: "var(--primary)",
            background: "transparent",
            border: "1px solid var(--primary)",
            borderRadius: "8px",
            cursor: "pointer",
            transition: "background 0.15s, color 0.15s",
            whiteSpace: "nowrap",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "var(--primary)";
            (e.currentTarget as HTMLButtonElement).style.color = "#fff";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "transparent";
            (e.currentTarget as HTMLButtonElement).style.color = "var(--primary)";
          }}
        >
          Cambiar contrasena
        </button>
      </div>

      {/* Mis Colecciones */}
      <section style={{ marginBottom: "2.5rem" }}>
        <SectionHeader
          icon={<Layers size={22} />}
          title="Mis Colecciones"
          count={collections?.length}
        />

        {collectionsLoading ? (
          <SectionSkeleton count={2} />
        ) : collectionsError ? (
          <ErrorBox message="No se pudieron cargar tus colecciones. Intenta de nuevo." />
        ) : !collections || collections.length === 0 ? (
          <EmptyState
            message="Aun no tienes colecciones."
            submessage="Crea una desde la pagina de colecciones."
          />
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
              gap: "1rem",
            }}
          >
            {collections.map((col) => {
              const vis = visibilityLabel[col.visibility] ?? visibilityLabel.Private;
              const itemCount = col.items?.length ?? 0;

              return (
                <Link
                  key={col.id}
                  to={`/collections/${col.id}`}
                  style={{ textDecoration: "none" }}
                >
                  <div
                    style={{
                      background: "var(--surface)",
                      border: "1px solid var(--border)",
                      borderRadius: "12px",
                      padding: "1.25rem",
                      transition: "box-shadow 0.15s, border-color 0.15s",
                      cursor: "pointer",
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = "var(--primary)";
                      (e.currentTarget as HTMLElement).style.boxShadow =
                        "0 4px 16px rgba(79, 70, 229, 0.1)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
                      (e.currentTarget as HTMLElement).style.boxShadow = "none";
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
                      <h3
                        style={{
                          fontFamily: "var(--display)",
                          fontSize: "1rem",
                          fontWeight: 600,
                          color: "var(--ink)",
                          margin: 0,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {col.name}
                      </h3>
                      <ChevronRight
                        size={16}
                        style={{ color: "var(--ink-muted)", flexShrink: 0 }}
                      />
                    </div>

                    {col.description && (
                      <p
                        style={{
                          color: "var(--ink-muted)",
                          fontSize: "0.85rem",
                          margin: "0 0 0.75rem",
                          lineHeight: 1.4,
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {col.description}
                      </p>
                    )}

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        marginTop: "auto",
                        fontSize: "0.8rem",
                        color: "var(--ink-muted)",
                      }}
                    >
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.25rem",
                        }}
                      >
                        {vis.icon}
                        {vis.label}
                      </span>
                      {itemCount > 0 && (
                        <>
                          <span>&middot;</span>
                          <span>
                            {itemCount} lugar{itemCount !== 1 ? "es" : ""}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* Mis Lugares */}
      <section style={{ marginBottom: "2.5rem" }}>
        <SectionHeader
          icon={<MapPin size={22} />}
          title="Mis Lugares"
          count={locationsData?.length}
        />

        {locationsLoading ? (
          <SectionSkeleton count={3} />
        ) : locationsError ? (
          <ErrorBox message="No se pudieron cargar tus lugares. Intenta de nuevo." />
        ) : !locationsData || locationsData.length === 0 ? (
          <EmptyState
            message="Aun no has registrado lugares."
            submessage="Agrega tu primer lugar desde la pagina de creacion."
          />
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
              gap: "1rem",
            }}
          >
            {locationsData.map((loc) => (
              <Link
                key={loc.id}
                to={`/locations/${loc.id}`}
                style={{ textDecoration: "none" }}
              >
                <div
                  style={{
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    borderRadius: "12px",
                    padding: "1.25rem",
                    transition: "box-shadow 0.15s, border-color 0.15s",
                    cursor: "pointer",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = "var(--route)";
                    (e.currentTarget as HTMLElement).style.boxShadow =
                      "0 4px 16px rgba(234, 88, 12, 0.1)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
                    (e.currentTarget as HTMLElement).style.boxShadow = "none";
                  }}
                >
                  <h3
                    style={{
                      fontFamily: "var(--display)",
                      fontSize: "1rem",
                      fontWeight: 600,
                      color: "var(--ink)",
                      margin: "0 0 0.375rem",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {loc.name}
                  </h3>

                  {loc.address?.city && (
                    <p
                      style={{
                        color: "var(--ink-muted)",
                        fontSize: "0.85rem",
                        margin: "0 0 0.75rem",
                      }}
                    >
                      {[loc.address.city, loc.address.state]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                  )}

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.75rem",
                      marginTop: "auto",
                      fontSize: "0.8rem",
                      color: "var(--ink-muted)",
                    }}
                  >
                    {/* Status badge */}
                    <span
                      style={{
                        fontFamily: "var(--mono)",
                        fontSize: "0.7rem",
                        padding: "0.125rem 0.45rem",
                        borderRadius: "999px",
                        background:
                          loc.status === "Published"
                            ? "rgba(16, 185, 129, 0.1)"
                            : loc.status === "Draft"
                            ? "rgba(245, 158, 11, 0.1)"
                            : "rgba(239, 68, 68, 0.1)",
                        color:
                          loc.status === "Published"
                            ? "var(--success)"
                            : loc.status === "Draft"
                            ? "var(--rating)"
                            : "var(--danger)",
                        border: `1px solid ${
                          loc.status === "Published"
                            ? "rgba(16, 185, 129, 0.2)"
                            : loc.status === "Draft"
                            ? "rgba(245, 158, 11, 0.2)"
                            : "rgba(239, 68, 68, 0.2)"
                        }`,
                      }}
                    >
                      {loc.status === "Published"
                        ? "Publicado"
                        : loc.status === "Draft"
                        ? "Borrador"
                        : "Archivado"}
                    </span>

                    {/* Rating */}
                    {loc.reviewCount > 0 && (
                      <span style={{ display: "flex", alignItems: "center", gap: "0.2rem" }}>
                        <span style={{ color: "var(--rating)" }}>&#9733;</span>
                        {loc.averageRating.toFixed(1)}
                        <span>({loc.reviewCount})</span>
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Change password dialog */}
      <ChangePasswordDialog open={cpOpen} onOpenChange={setCpOpen} />
    </div>
  );
}
