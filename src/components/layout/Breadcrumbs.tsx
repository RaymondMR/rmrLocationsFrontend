import { Fragment } from "react";
import { Link } from "react-router-dom";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb">
      <ol
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: "0.4rem",
          listStyle: "none",
          padding: 0,
          margin: "0 0 1rem 0",
          fontFamily: "var(--mono)",
          fontSize: "0.8rem",
        }}
      >
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <Fragment key={`${item.label}-${index}`}>
              <li>
                {isLast || !item.href ? (
                  <span
                    style={{
                      color: isLast ? "var(--ink-muted)" : "var(--ink)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      maxWidth: isLast ? "180px" : undefined,
                    }}
                    title={isLast ? item.label : undefined}
                  >
                    {isLast ? (
                      <span className="max-sm:inline-block max-sm:max-w-[120px] max-sm:truncate">
                        {item.label}
                      </span>
                    ) : (
                      item.label
                    )}
                  </span>
                ) : (
                  <Link
                    to={item.href}
                    style={{
                      color: "var(--primary)",
                      textDecoration: "none",
                      transition: "opacity 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.opacity = "0.75";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.opacity = "1";
                    }}
                  >
                    {item.label}
                  </Link>
                )}
              </li>
              {!isLast && (
                <li aria-hidden="true" style={{ color: "var(--ink-muted)", userSelect: "none" }}>
                  /
                </li>
              )}
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
