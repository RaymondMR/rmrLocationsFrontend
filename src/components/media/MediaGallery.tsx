import { useState } from "react";
import { Play, Camera } from "lucide-react";
import type { LocationMedia } from "@/types/models";
import EmptyState from "@/components/shared/EmptyState";

interface MediaGalleryProps {
  media: LocationMedia[];
}

export default function MediaGallery({ media }: MediaGalleryProps) {
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  if (media.length === 0) {
    return (
      <div
        className="rounded-xl border flex items-center justify-center py-16"
        style={{
          background: "var(--surface)",
          borderColor: "var(--border)",
          backgroundImage:
            "repeating-linear-gradient(0deg, var(--grid) 0, var(--grid) 1px, transparent 1px, transparent 20px), repeating-linear-gradient(90deg, var(--grid) 0, var(--grid) 1px, transparent 1px, transparent 20px)",
        }}
      >
        <EmptyState
          icon={<Camera size={48} />}
          title="Sin fotos todavía"
          description="Este lugar aún no tiene imágenes."
        />
      </div>
    );
  }

  const cover =
    media.find((m) => m.isCover) || media[0];
  const rest = media.filter((m) => m.id !== cover.id);

  return (
    <>
      <div className="flex flex-col gap-3">
        {/* Cover */}
        <div
          className="relative rounded-xl overflow-hidden cursor-pointer aspect-[16/9]"
          onClick={() => setLightboxIdx(0)}
          style={{ background: "var(--border)" }}
        >
          {cover.type === "Video" ? (
            <div className="w-full h-full flex items-center justify-center">
              <Play size={48} style={{ color: "var(--ink-muted)" }} />
            </div>
          ) : (
            <img
              src={cover.url}
              alt={cover.caption || "Portada"}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          )}
          {cover.caption && (
            <div
              className="absolute bottom-0 left-0 right-0 p-3 text-xs"
              style={{
                background: "linear-gradient(transparent, rgba(0,0,0,0.6))",
                color: "#fff",
              }}
            >
              {cover.caption}
            </div>
          )}
        </div>

        {/* Thumbnails */}
        {rest.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {rest.map((item, idx) => (
              <button
                key={item.id}
                onClick={() => setLightboxIdx(idx + 1)}
                className="shrink-0 w-24 h-24 rounded-lg overflow-hidden cursor-pointer border-2 transition-all"
                style={{
                  borderColor: "var(--border)",
                  background: "var(--border)",
                }}
              >
                {item.type === "Video" ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <Play size={24} style={{ color: "var(--ink-muted)" }} />
                  </div>
                ) : (
                  <img
                    src={item.thumbnailUrl || item.url}
                    alt={item.caption || ""}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox (simple) */}
      {lightboxIdx != null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.9)" }}
          onClick={() => setLightboxIdx(null)}
        >
          <button
            onClick={() => setLightboxIdx(null)}
            aria-label="Cerrar"
            className="absolute top-4 right-4 text-white text-2xl"
            style={{ background: "none", border: "none", cursor: "pointer" }}
          >
            ✕
          </button>
          {lightboxIdx > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIdx(lightboxIdx - 1);
              }}
              className="absolute left-4 text-white text-2xl"
              style={{ background: "none", border: "none", cursor: "pointer" }}
            >
              ‹
            </button>
          )}
          {lightboxIdx < media.length - 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIdx(lightboxIdx + 1);
              }}
              className="absolute right-4 text-white text-2xl"
              style={{ background: "none", border: "none", cursor: "pointer" }}
            >
              ›
            </button>
          )}
          <img
            src={media[lightboxIdx].url}
            alt={media[lightboxIdx].caption || ""}
            className="max-w-full max-h-[85vh] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
