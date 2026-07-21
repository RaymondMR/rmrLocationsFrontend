/** Genera un slug a partir de texto: minúsculas, sin acentos, guiones */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-");
}

/** Formatea fecha ISO a legible en español */
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-MX", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/** Fecha relativa en español: "hace 3 días", "hace 1 mes" */
export function timeAgo(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const seconds = Math.floor((now - then) / 1000);
  const rtf = new Intl.RelativeTimeFormat("es", { numeric: "auto" });
  if (seconds < 60) return rtf.format(-seconds, "second");
  if (seconds < 3600) return rtf.format(-Math.floor(seconds / 60), "minute");
  if (seconds < 86400) return rtf.format(-Math.floor(seconds / 3600), "hour");
  if (seconds < 2592000) return rtf.format(-Math.floor(seconds / 86400), "day");
  if (seconds < 31536000) return rtf.format(-Math.floor(seconds / 2592000), "month");
  return rtf.format(-Math.floor(seconds / 31536000), "year");
}

/** Trunca texto con ellipsis */
export function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max).trimEnd() + "…";
}

/** Normaliza el rol del JWT a array */
export function normalizeRole(role?: string | string[]): string[] {
  if (!role) return [];
  return Array.isArray(role) ? role : [role];
}
