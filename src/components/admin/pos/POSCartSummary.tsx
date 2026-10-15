// src/components/admin/pos/POSCartSummary.tsx

"use client";

import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/admin/format";
import type { POSCartTotals } from "@/lib/admin/pos/cart-store";

/* ============================================================
 * Types
 * ============================================================ */

export type POSCartSummaryProps = {
  totals: POSCartTotals;
  className?: string;
};

/* ============================================================
 * Component
 * ============================================================ */

export function POSCartSummary({ totals, className }: POSCartSummaryProps) {
  return (
    <dl className={cn("space-y-1.5 text-sm", className)}>
      <div className="flex items-center justify-between">
        <dt className="text-brand-text-secondary">Subtotal</dt>
        <dd className="tabular-nums text-brand-primary">
          {formatPrice(totals.subtotal)}
        </dd>
      </div>

      {totals.discountTotal > 0 && (
        <div className="flex items-center justify-between">
          <dt className="text-brand-text-secondary">Discount</dt>
          <dd className="tabular-nums text-destructive">
            −{formatPrice(totals.discountTotal)}
          </dd>
        </div>
      )}

      <div className="flex items-center justify-between border-t border-brand-border pt-2">
        <dt className="font-heading text-sm font-semibold text-brand-primary">
          Total
        </dt>
        <dd className="font-heading text-lg font-semibold tabular-nums text-brand-primary">
          {formatPrice(totals.totalAmount)}
        </dd>
      </div>

      <div className="flex items-center justify-between pt-1 text-xs">
        <dt className="text-brand-text-secondary">Profit</dt>
        <dd
          className={cn(
            "tabular-nums",
            totals.profitTotal >= 0 ? "text-emerald-700" : "text-destructive",
          )}
        >
          {formatPrice(totals.profitTotal)}
        </dd>
      </div>
    </dl>
  );
}

export default POSCartSummary;
