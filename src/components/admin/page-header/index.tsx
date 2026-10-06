// src/components/admin/page-header/index.tsx

import Link from "next/link";
import { ChevronRight, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

/* ============================================================
 * Types
 * ============================================================ */

export type Breadcrumb = {
  label: string;
  href?: string;
};

export type PageHeaderProps = {
  /** Page title. */
  title: string;
  /** Optional subtitle / description under the title. */
  description?: string;
  /** Breadcrumb trail shown above the title. */
  breadcrumbs?: Breadcrumb[];
  /** Renders a back arrow at the start of the title row. */
  backHref?: string;
  /** Right-aligned actions (buttons, dropdowns, etc.). */
  actions?: React.ReactNode;
  /** Extra className on the wrapper. */
  className?: string;
};

/* ============================================================
 * PageHeader
 * ============================================================ */

export function PageHeader({
  title,
  description,
  breadcrumbs,
  backHref,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <header className={cn("mb-6 space-y-3", className)}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-1 text-xs text-brand-text-secondary">
            {breadcrumbs.map((crumb, i) => {
              const isLast = i === breadcrumbs.length - 1;
              return (
                <li
                  key={`${crumb.label}-${i}`}
                  className="flex items-center gap-1"
                >
                  {crumb.href && !isLast ? (
                    <Link
                      href={crumb.href}
                      className="rounded px-1 py-0.5 transition-colors hover:text-brand-primary hover:underline"
                    >
                      {crumb.label}
                    </Link>
                  ) : (
                    <span
                      className={cn(
                        "px-1 py-0.5",
                        isLast && "font-medium text-brand-primary",
                      )}
                      aria-current={isLast ? "page" : undefined}
                    >
                      {crumb.label}
                    </span>
                  )}
                  {!isLast && (
                    <ChevronRight
                      className="h-3 w-3 shrink-0 text-brand-text-secondary/60"
                      aria-hidden="true"
                    />
                  )}
                </li>
              );
            })}
          </ol>
        </nav>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-2">
          {backHref && (
            <Link
              href={backHref}
              className="mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-md text-brand-text-secondary transition-colors hover:bg-muted hover:text-brand-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70"
              aria-label="Go back"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            </Link>
          )}

          <div className="min-w-0">
            <h1 className="font-heading truncate text-2xl font-semibold text-brand-primary">
              {title}
            </h1>
            {description && (
              <p className="mt-1 text-sm text-brand-text-secondary">
                {description}
              </p>
            )}
          </div>
        </div>

        {actions && (
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {actions}
          </div>
        )}
      </div>
    </header>
  );
}

export default PageHeader;
