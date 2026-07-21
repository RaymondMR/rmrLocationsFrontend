import { formatCoordinates } from "@/lib/geo";
import { Copy, Check } from "lucide-react";
import { useState } from "react";

interface CoordinatesLabelProps {
  lat: number;
  lng: number;
}

export default function CoordinatesLabel({ lat, lng }: CoordinatesLabelProps) {
  const [copied, setCopied] = useState(false);

  const text = formatCoordinates(lat, lng);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-2 text-xs hover:opacity-70 transition-opacity"
      style={{
        fontFamily: "var(--mono)",
        color: "var(--ink-muted)",
        background: "none",
        border: "none",
        cursor: "pointer",
        padding: 0,
      }}
      title="Copiar coordenadas"
    >
      {text}
      {copied ? (
        <Check size={14} style={{ color: "var(--success)" }} />
      ) : (
        <Copy size={14} />
      )}
    </button>
  );
}
