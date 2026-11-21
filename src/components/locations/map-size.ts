/**
 * Alturas del mapa (FRONTEND_DESIGN_SPEC §11). Tailwind solo genera las clases que ve
 * escritas completas en el código, por eso van como texto literal y no se construyen.
 * Están aquí, y no dentro de LocationPicker, para que LocationPickerLazy las use en sus
 * mensajes de carga/error sin importar Leaflet (que debe quedar en su propio chunk).
 */
export const MAP_HEIGHT_CLASS = {
  /** Formularios: 300 px en móvil, 400 px desde 640 px y 500 px desde 1024 px. */
  form: "h-[300px] sm:h-[400px] lg:h-[500px]",
  /** Barra lateral del detalle del lugar. */
  compact: "h-[220px]",
} as const;

export type MapSize = keyof typeof MAP_HEIGHT_CLASS;
