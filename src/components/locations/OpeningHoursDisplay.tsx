import { Clock } from "lucide-react";
import type { DayOfWeekName, OpeningHour } from "@/types/models";
import { buildWeekSchedule } from "@/lib/opening-hours";

interface OpeningHoursDisplayProps {
  hours: readonly OpeningHour[] | null | undefined;
  /**
   * "card" (por defecto): tarjeta con título, como el resto de bloques del detalle.
   * "plain": solo las filas, para contenedores que ya traen su propio título (la edición).
   */
  variant?: "card" | "plain";
}

/** Orden de Date.getDay(): 0 = domingo. */
const DAY_NAMES_FROM_SUNDAY: DayOfWeekName[] = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

/**
 * Horario semanal de un lugar. Los días salen siempre de lunes a domingo (el API devuelve
 * los registros en el orden de inserción), sin segundos y con todos los tramos de cada día.
 */
export default function OpeningHoursDisplay({
  hours,
  variant = "card",
}: OpeningHoursDisplayProps) {
  const schedule = buildWeekSchedule(hours);
  const hasHours = schedule.some((day) => day.recorded);
  const today = DAY_NAMES_FROM_SUNDAY[new Date().getDay()];

  const body = hasHours ? (
    <ul
      style={{
        listStyle: "none",
        margin: 0,
        padding: 0,
        display: "flex",
        flexDirection: "column",
        gap: "0.3rem",
      }}
    >
      {schedule.map((day) => {
        const isToday = day.day === today;
        const isOpen = day.recorded && !day.closed;
        return (
          <li
            key={day.day}
            aria-current={isToday ? "date" : undefined}
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: "0.75rem",
              padding: "0.2rem 0.5rem",
              borderRadius: "6px",
              fontSize: "0.8rem",
              fontWeight: isToday ? 600 : 400,
              background: isToday
                ? "color-mix(in srgb, var(--primary) 8%, transparent)"
                : "transparent",
            }}
          >
            <span style={{ color: isToday ? "var(--primary)" : "var(--ink)" }}>
              {day.label}
            </span>
            <span
              style={{
                textAlign: "right",
                fontFamily: isOpen ? "var(--mono)" : "var(--sans)",
                color: isOpen ? "var(--ink)" : "var(--ink-muted)",
              }}
            >
              {day.closed ? "Cerrado" : isOpen ? day.ranges.join(", ") : "—"}
            </span>
          </li>
        );
      })}
    </ul>
  ) : (
    <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--ink-muted)" }}>
      Sin horarios registrados
    </p>
  );

  if (variant === "plain") return body;

  return (
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
      {body}
    </div>
  );
}
