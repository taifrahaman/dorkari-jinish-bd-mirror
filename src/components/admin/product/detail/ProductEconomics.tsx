// src/components/admin/product/detail/ProductEconomics.tsx

"use client";

import { TrendingUp, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/admin/format";
import type { ProductStats } from "@/lib/admin/api";

/* ============================================================
 * Types
 * ============================================================ */

export type ProductEconomicsProps = {
  stats: ProductStats;
  className?: string;
};

/* ============================================================
 * Component
 * ============================================================ */

export function ProductEconomics({ stats, className }: ProductEconomicsProps) {
  const { current } = stats;

  const hasCost = current.costPrice !== null;
  const hasMargin = current.marginPerUnit !== null;
  const marginPositive = hasMargin && (current.marginPerUnit ?? 0) > 0;

  return (
    <div
      className={cn(
        "rounded-lg border border-brand-border bg-brand-surface p-5",
        className,
      )}
    >
      <header className="mb-4 flex items-center justify-between gap-2">
        <div>
          <h2 className="font-heading text-sm font-semibold text-brand-primary">
            Economics
          </h2>
          <p className="mt-0.5 text-xs text-brand-text-secondary">
            Pricing and margin at a glance
          </p>
        </div>
        {hasMargin && (
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium",
              marginPositive
                ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                : "border-destructive/30 bg-destructive/10 text-destructive",
            )}
          >
            <TrendingUp className="h-3 w-3" aria-hidden="true" />
            {current.marginPercent !== null
              ? `${current.marginPercent.toFixed(1)}% margin`
              : "—"}
          </span>
        )}
      </header>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
        <div>
          <dt className="text-xs text-brand-text-secondary">Selling price</dt>
          <dd className="mt-0.5 font-medium tabular-nums text-brand-primary">
            {formatPrice(current.price)}
          </dd>
        </div>

        <div>
          <dt className="text-xs text-brand-text-secondary">Cost price</dt>
          <dd className="mt-0.5 font-medium tabular-nums text-brand-primary">
            {hasCost ? formatPrice(current.costPrice) : "—"}
          </dd>
        </div>

        <div>
          <dt className="text-xs text-brand-text-secondary">Margin / unit</dt>
          <dd
            className={cn(
              "mt-0.5 font-medium tabular-nums",
              hasMargin
                ? marginPositive
                  ? "text-emerald-700"
                  : "text-destructive"
                : "text-brand-primary",
            )}
          >
            {hasMargin ? formatPrice(current.marginPerUnit) : "—"}
          </dd>
        </div>

        <div>
          <dt className="text-xs text-brand-text-secondary">
            Compare at price
          </dt>
          <dd className="mt-0.5 font-medium tabular-nums text-brand-primary">
            {current.compareAtPrice !== null
              ? formatPrice(current.compareAtPrice)
              : "—"}
          </dd>
        </div>

        <div className="col-span-2 border-t border-brand-border pt-3">
          <dt className="text-xs text-brand-text-secondary">Stock on hand</dt>
          <dd className="mt-0.5 font-medium tabular-nums text-brand-primary">
            {current.stock} unit{current.stock === 1 ? "" : "s"}
            {current.lowStockThreshold !== null && (
              <span className="ml-2 text-xs font-normal text-brand-text-secondary">
                (low at {current.lowStockThreshold})
              </span>
            )}
          </dd>
        </div>

        <div>
          <dt className="text-xs text-brand-text-secondary">Stock value</dt>
          <dd className="mt-0.5 font-medium tabular-nums text-brand-primary">
            {current.stockValue !== null
              ? formatPrice(current.stockValue)
              : "—"}
          </dd>
        </div>

        <div>
          <dt className="text-xs text-brand-text-secondary">
            Potential revenue
          </dt>
          <dd className="mt-0.5 font-medium tabular-nums text-brand-primary">
            {current.potentialRevenue !== null
              ? formatPrice(current.potentialRevenue)
              : "—"}
          </dd>
        </div>
      </dl>

      {!hasCost && (
        <div className="mt-4 flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          <AlertCircle
            className="mt-0.5 h-3.5 w-3.5 shrink-0"
            aria-hidden="true"
          />
          <span>
            Set a cost price on this product to unlock margin and profit
            analytics.
          </span>
        </div>
      )}
    </div>
  );
}

export default ProductEconomics;
