// src/components/admin/product/detail/ProductCostHistory.tsx

"use client";

import { TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDateTime, formatPrice } from "@/lib/admin/format";
import type { CostHistoryEntry } from "@/lib/validations/product.schema";

/* ============================================================
 * Types
 * ============================================================ */

export type ProductCostHistoryProps = {
  history: CostHistoryEntry[];
  /** Current cost — shown as the latest entry if history is empty. */
  currentCost: number | null;
  className?: string;
};

/* ============================================================
 * Component
 * ============================================================ */

export function ProductCostHistory({
  history,
  currentCost,
  className,
}: ProductCostHistoryProps) {
  // Show newest first
  const entries = [...history].reverse();

  return (
    <div
      className={cn(
        "rounded-lg border border-brand-border bg-brand-surface",
        className,
      )}
    >
      <header className="border-b border-brand-border px-5 py-4">
        <h2 className="font-heading text-sm font-semibold text-brand-primary">
          Cost history
        </h2>
        <p className="mt-0.5 text-xs text-brand-text-secondary">
          {entries.length === 0
            ? "No cost changes recorded yet"
            : `${entries.length} change${entries.length === 1 ? "" : "s"} recorded`}
        </p>
      </header>

      {entries.length === 0 ? (
        <div className="flex flex-col items-center gap-2 px-5 py-10 text-center">
          <div className="grid h-10 w-10 place-items-center rounded-full bg-muted text-brand-text-secondary">
            <TrendingUp className="h-4 w-4" aria-hidden="true" />
          </div>
          <p className="text-sm text-brand-text-secondary">
            {currentCost !== null
              ? `Current cost is ${formatPrice(currentCost)}. Future changes will appear here.`
              : "Set a cost price to start tracking."}
          </p>
        </div>
      ) : (
        <ol className="divide-y divide-brand-border">
          {entries.map((entry, i) => {
            const prev = entries[i + 1];
            const delta = prev ? entry.cost - prev.cost : null;

            return (
              <li
                key={`${entry.changedAt}-${i}`}
                className="flex items-center justify-between gap-3 px-5 py-3"
              >
                <div className="min-w-0">
                  <p className="font-medium tabular-nums text-brand-primary">
                    {formatPrice(entry.cost)}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-brand-text-secondary">
                    {formatDateTime(entry.changedAt)}
                    {entry.changedBy?.name && ` · ${entry.changedBy.name}`}
                  </p>
                </div>

                {delta !== null && (
                  <span
                    className={cn(
                      "shrink-0 rounded-md border px-2 py-0.5 text-xs font-medium tabular-nums",
                      delta > 0
                        ? "border-destructive/30 bg-destructive/10 text-destructive"
                        : delta < 0
                          ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                          : "border-brand-border bg-muted text-brand-text-secondary",
                    )}
                  >
                    {delta > 0 ? "+" : ""}
                    {formatPrice(delta)}
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

export default ProductCostHistory;
