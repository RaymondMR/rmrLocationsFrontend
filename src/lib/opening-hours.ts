import { DAYS_OF_WEEK } from "@/lib/constants";
import type { OpeningHour } from "@/types/models";

/** Horario de un día de la semana, listo para mostrarse. */
export interface DaySchedule {
  /** Nombre del enum del API: "Monday"… */
  day: string;
  /** Etiqueta corta en español: "Lun"… */
  label: string;
  /** Hay al menos un registro para el día (no es lo mismo que estar cerrado). */
  recorded: boolean;
  /** Todos los registros del día están marcados como cerrados. */
  closed: boolean;
  /** Tramos abiertos "HH:mm–HH:mm", de la apertura más temprana a la más tardía. */
  ranges: string[];
}

/** "09:00:00" → "09:00": el API entrega TimeOnly con segundos. */
export function formatHourMinute(time: string): string {
  return time.slice(0, 5);
}

/**
 * Los 7 días de lunes a domingo, sin importar el orden en que el API devuelva los
 * registros (llegan en el de inserción), con los segundos recortados y admitiendo varios
 * tramos por día (p. ej. 09:00–14:00 y 16:00–20:00).
 */
export function buildWeekSchedule(
  hours: readonly OpeningHour[] | null | undefined,
): DaySchedule[] {
  const all = hours ?? [];
  return DAYS_OF_WEEK.map(({ value, label }) => {
    const entries = all.filter((hour) => hour.dayOfWeek === value);
    const open = entries
      .filter((hour) => !hour.isClosed)
      .sort((a, b) => a.opensAt.localeCompare(b.opensAt));
    return {
      day: value,
      label,
      recorded: entries.length > 0,
      closed: entries.length > 0 && open.length === 0,
      ranges: open.map(
        (hour) => `${formatHourMinute(hour.opensAt)}–${formatHourMinute(hour.closesAt)}`,
      ),
    };
  });
}
