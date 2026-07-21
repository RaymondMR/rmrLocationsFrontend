import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export default function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "0.35rem",
        marginBottom: "2rem",
      }}
      className="sm:flex-row sm:items-center sm:justify-between"
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <h1
          style={{
            fontFamily: "var(--display)",
            fontSize: "1.875rem",
            fontWeight: 700,
            color: "var(--ink)",
            margin: 0,
            lineHeight: 1.2,
          }}
        >
          {title}
        </h1>
        {subtitle && (
          <p
            style={{
              fontSize: "0.9rem",
              color: "var(--ink-muted)",
              margin: "0.35rem 0 0 0",
              lineHeight: 1.5,
            }}
          >
            {subtitle}
          </p>
        )}
      </div>

      {action && (
        <div style={{ flexShrink: 0, marginTop: "0.75rem" }} className="sm:mt-0">
          {action}
        </div>
      )}
    </div>
  );
}
