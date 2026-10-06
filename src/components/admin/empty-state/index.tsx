// src/components/admin/empty-state/index.tsx

import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/* ============================================================
 * Types
 * ============================================================ */

export type EmptyStateProps = {
  /** Lucide icon rendered inside a soft circle. */
  icon?: LucideIcon;
  /** Headline — short and declarative. */
  title: string;
  /** Body copy explaining what the user can do. */
  description?: string;
  /** Optional CTA — usually a `<Button>` or `<Link>`. */
  action?: ReactNode;
  /**
   * Visual weight. `default` fits card-wrapped lists,
   * `compact` fits inline use inside table bodies.
   */
  variant?: "default" | "compact";
  className?: string;
};

/* ============================================================
 * Component
 * ============================================================ */

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  variant = "default",
  className,
}: EmptyStateProps) {
  const isCompact = variant === "compact";

  return (
    <div
      role="status"
      className={cn(
        "flex flex-col items-center justify-center text-center",
        isCompact ? "gap-2 px-6 py-10" : "gap-3 px-6 py-16",
        className,
      )}
    >
      {Icon && (
        <div
          className={cn(
            "grid place-items-center rounded-full bg-muted text-brand-text-secondary",
            isCompact ? "h-10 w-10" : "h-14 w-14",
          )}
          aria-hidden="true"
        >
          <Icon className={isCompact ? "h-5 w-5" : "h-6 w-6"} />
        </div>
      )}

      <h2
        className={cn(
          "font-heading font-semibold text-brand-primary",
          isCompact ? "text-sm" : "text-base",
        )}
      >
        {title}
      </h2>

      {description && (
        <p
          className={cn(
            "max-w-md text-brand-text-secondary",
            isCompact ? "text-xs" : "text-sm",
          )}
        >
          {description}
        </p>
      )}

      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}

export default EmptyState;
