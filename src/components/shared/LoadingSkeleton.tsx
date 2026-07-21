import { cn } from "@/lib/utils";

interface LoadingSkeletonProps {
  variant?: "card" | "text" | "detail" | "table-row";
  count?: number;
}

function SkeletonBlock({ className }: { className?: string }) {
  return <div className={cn("rmr-skel", className)} />;
}

function CardSkeleton() {
  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "12px",
        overflow: "hidden",
      }}
    >
      {/* Image placeholder */}
      <SkeletonBlock
        className="w-full"
        style={{ height: "160px", borderRadius: 0 }}
      />
      <div style={{ padding: "1rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {/* Title */}
        <SkeletonBlock style={{ height: "18px", width: "70%", borderRadius: "4px" }} />
        {/* Description lines */}
        <SkeletonBlock style={{ height: "12px", width: "100%", borderRadius: "4px" }} />
        <SkeletonBlock style={{ height: "12px", width: "60%", borderRadius: "4px" }} />
        {/* Tag row */}
        <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.25rem" }}>
          <SkeletonBlock style={{ height: "22px", width: "60px", borderRadius: "6px" }} />
          <SkeletonBlock style={{ height: "22px", width: "50px", borderRadius: "6px" }} />
          <SkeletonBlock style={{ height: "22px", width: "70px", borderRadius: "6px" }} />
        </div>
      </div>
    </div>
  );
}

function TextSkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
      <SkeletonBlock style={{ height: "14px", width: "100%", borderRadius: "4px" }} />
      <SkeletonBlock style={{ height: "14px", width: "90%", borderRadius: "4px" }} />
      <SkeletonBlock style={{ height: "14px", width: "75%", borderRadius: "4px" }} />
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {/* Hero image */}
      <SkeletonBlock
        style={{ height: "240px", width: "100%", borderRadius: "12px" }}
      />
      {/* Title + meta */}
      <SkeletonBlock style={{ height: "28px", width: "55%", borderRadius: "6px" }} />
      <div style={{ display: "flex", gap: "1rem" }}>
        <SkeletonBlock style={{ height: "14px", width: "120px", borderRadius: "4px" }} />
        <SkeletonBlock style={{ height: "14px", width: "100px", borderRadius: "4px" }} />
      </div>
      {/* Content blocks */}
      <SkeletonBlock style={{ height: "14px", width: "100%", borderRadius: "4px" }} />
      <SkeletonBlock style={{ height: "14px", width: "100%", borderRadius: "4px" }} />
      <SkeletonBlock style={{ height: "14px", width: "85%", borderRadius: "4px" }} />
      <SkeletonBlock style={{ height: "14px", width: "60%", borderRadius: "4px" }} />
      {/* Section */}
      <SkeletonBlock style={{ height: "20px", width: "30%", borderRadius: "6px", marginTop: "0.5rem" }} />
      <SkeletonBlock style={{ height: "14px", width: "100%", borderRadius: "4px" }} />
      <SkeletonBlock style={{ height: "14px", width: "70%", borderRadius: "4px" }} />
    </div>
  );
}

function TableRowSkeleton() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "1rem",
        padding: "0.85rem 0",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <SkeletonBlock style={{ height: "14px", width: "30%", borderRadius: "4px" }} />
      <SkeletonBlock style={{ height: "14px", width: "20%", borderRadius: "4px" }} />
      <SkeletonBlock style={{ height: "14px", width: "15%", borderRadius: "4px" }} />
      <SkeletonBlock style={{ height: "14px", width: "15%", borderRadius: "4px" }} />
      <SkeletonBlock style={{ height: "28px", width: "28px", borderRadius: "6px", marginLeft: "auto" }} />
    </div>
  );
}

const variantMap: Record<
  NonNullable<LoadingSkeletonProps["variant"]>,
  () => React.ReactNode
> = {
  card: CardSkeleton,
  text: TextSkeleton,
  detail: DetailSkeleton,
  "table-row": TableRowSkeleton,
};

export default function LoadingSkeleton({
  variant = "text",
  count = 1,
}: LoadingSkeletonProps) {
  const Renderer = variantMap[variant];

  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <div key={i}>
          <Renderer />
        </div>
      ))}
    </>
  );
}
