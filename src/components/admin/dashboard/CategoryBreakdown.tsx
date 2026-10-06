// src/components/admin/dashboard/CategoryBreakdown.tsx

// src/components/admin/dashboard/CategoryBreakdownCard.tsx

"use client";

import { FolderTree } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/admin/format";
import type { CategoryBreakdownResult } from "@/lib/admin/analytics";

/* ============================================================
 * Types
 * ============================================================ */

export type CategoryBreakdownCardProps = {
  data: CategoryBreakdownResult | undefined;
  isLoading?: boolean;
  className?: string;
};

/* ============================================================
 * Component
 * ============================================================ */

const COLORS = [
  "bg-brand-accent",
  "bg-emerald-500",
  "bg-brand-teal",
  "bg-brand-primary",
  "bg-rose-500",
  "bg-violet-500",
  "bg-amber-500",
  "bg-slate-500",
];

export function CategoryBreakdownCard({
  data,
  isLoading = false,
  className,
}: CategoryBreakdownCardProps) {
  const rows = data?.rows ?? [];

  return (
    <div
      className={cn(
        "rounded-lg border border-brand-border bg-brand-surface",
        className,
      )}
    >
      <header className="border-b border-brand-border px-5 py-4">
        <h2 className="font-heading text-sm font-semibold text-brand-primary">
          Revenue by category
        </h2>
        <p className="mt-0.5 text-xs text-brand-text-secondary">
          Root categories, sorted by revenue
        </p>
      </header>

      {isLoading && rows.length === 0 ? (
        <div className="space-y-3 p-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-10 animate-pulse rounded-md bg-muted/50"
            />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="grid place-items-center px-5 py-12 text-center">
          <div className="flex flex-col items-center gap-2">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-muted text-brand-text-secondary">
              <FolderTree className="h-4 w-4" aria-hidden="true" />
            </div>
            <p className="text-sm text-brand-text-secondary">
              No sales in this range.
            </p>
          </div>
        </div>
      ) : (
        <ul className="space-y-3 p-5">
          {rows.slice(0, 8).map((row, i) => (
            <li key={row.categoryId}>
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="truncate text-brand-primary">{row.name}</span>
                <span className="shrink-0 tabular-nums text-brand-text-secondary">
                  {formatPrice(row.revenue)}
                </span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className={cn(
                    "h-full rounded-full",
                    COLORS[i % COLORS.length],
                  )}
                  style={{ width: `${row.share * 100}%` }}
                />
              </div>
              <p className="mt-1 text-[11px] text-brand-text-secondary">
                {(row.share * 100).toFixed(1)}% · {row.unitsSold} unit
                {row.unitsSold === 1 ? "" : "s"}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default CategoryBreakdownCard;
