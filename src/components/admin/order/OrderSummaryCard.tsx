// src/components/admin/order/OrderSummaryCard.tsx

"use client";

import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/admin/format";
import type { OrderResponse } from "@/lib/validations/order.schema";

/* ============================================================
 * Types
 * ============================================================ */

export type OrderSummaryCardProps = {
  order: OrderResponse;
  /** Show cost + profit rows (admin-only by default). */
  showProfit?: boolean;
  className?: string;
};

/* ============================================================
 * Component
 * ============================================================ */

export function OrderSummaryCard({
  order,
  showProfit = true,
  className,
}: OrderSummaryCardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-brand-border bg-brand-surface p-5",
        className,
      )}
    >
      <h2 className="font-heading text-sm font-semibold text-brand-primary">
        Summary
      </h2>

      <dl className="mt-4 space-y-2 text-sm">
        <Row label="Subtotal" value={formatPrice(order.subtotal)} />
        {order.discountTotal > 0 && (
          <Row
            label="Discount"
            value={`−${formatPrice(order.discountTotal)}`}
            tone="negative"
          />
        )}
        {order.taxTotal > 0 && (
          <Row label="VAT" value={formatPrice(order.taxTotal)} />
        )}
        {order.shippingFee > 0 && (
          <Row label="Shipping" value={formatPrice(order.shippingFee)} />
        )}

        <div className="border-t border-brand-border pt-2">
          <Row label="Total" value={formatPrice(order.totalAmount)} emphasis />
        </div>
      </dl>

      {showProfit && (
        <div className="mt-4 border-t border-brand-border pt-4">
          <p className="text-xs uppercase tracking-wide text-brand-text-secondary">
            Profit
          </p>
          <dl className="mt-2 space-y-2 text-sm">
            <Row label="Cost" value={formatPrice(order.costTotal)} />
            <Row
              label="Profit"
              value={formatPrice(order.profitTotal)}
              tone={order.profitTotal >= 0 ? "positive" : "negative"}
              emphasis
            />
          </dl>
        </div>
      )}
    </div>
  );
}

export default OrderSummaryCard;

/* ============================================================
 * Row
 * ============================================================ */

function Row({
  label,
  value,
  tone,
  emphasis,
}: {
  label: string;
  value: string;
  tone?: "positive" | "negative";
  emphasis?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt
        className={cn(
          "text-brand-text-secondary",
          emphasis && "font-medium text-brand-primary",
        )}
      >
        {label}
      </dt>
      <dd
        className={cn(
          "tabular-nums",
          emphasis ? "font-semibold" : "font-medium",
          tone === "positive" && "text-emerald-700",
          tone === "negative" && "text-destructive",
          !tone && (emphasis ? "text-brand-primary" : "text-brand-primary"),
        )}
      >
        {value}
      </dd>
    </div>
  );
}
