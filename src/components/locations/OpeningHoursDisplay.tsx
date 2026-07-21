import type { OpeningHour, DayOfWeekName } from "@/types/models";
import { DAYS_OF_WEEK } from "@/lib/constants";

interface OpeningHoursDisplayProps {
  hours: OpeningHour[];
}

export default function OpeningHoursDisplay({ hours }: OpeningHoursDisplayProps) {
  if (!hours || hours.length === 0) return null;

  const today = new Date().getDay(); // 0=Sun, 1=Mon...
  const dayMap: DayOfWeekName[] = [
    "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",
  ];
  const todayName = dayMap[today];

  const formatTime = (time: string) => time.slice(0, 5); // "HH:mm:ss" → "HH:mm"

  return (
    <div
      className="rounded-xl border p-4"
      style={{ background: "var(--surface)", borderColor: "var(--border)" }}
    >
      <h4
        className="text-sm font-semibold mb-3"
        style={{ fontFamily: "var(--display)", color: "var(--ink)" }}
      >
        Horario
      </h4>
      <div className="flex flex-col gap-1.5">
        {DAYS_OF_WEEK.map((d) => {
          const hour = hours.find((h) => h.dayOfWeek === d.value);
          const isToday = d.value === todayName;
          return (
            <div
              key={d.value}
              className="flex items-center justify-between text-sm py-1 px-2 rounded-md"
              style={{
                background: isToday ? "var(--primary)" + "0D" : "transparent",
                fontWeight: isToday ? 600 : 400,
              }}
            >
              <span
                style={{
                  color: isToday ? "var(--primary)" : "var(--ink)",
                  fontFamily: isToday ? "var(--display)" : "var(--sans)",
                }}
              >
                {d.label}
              </span>
              <span
                style={{
                  fontFamily: "var(--mono)",
                  fontSize: 13,
                  color: hour?.isClosed ? "var(--ink-muted)" : "var(--ink)",
                }}
              >
                {hour?.isClosed
                  ? "Cerrado"
                  : hour
                    ? `${formatTime(hour.opensAt)}–${formatTime(hour.closesAt)}`
                    : "—"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
