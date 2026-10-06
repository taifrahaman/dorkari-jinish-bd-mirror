// src/components/admin/dashboard/RecentOrdersTable.tsx

// src/components/admin/dashboard/RecentOrdersCard.tsx

"use client";

import Link from "next/link";
import { ArrowRight, Receipt } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPrice, formatRelative } from "@/lib/admin/format";
import { OrderStatusBadge } from "@/components/admin/order/OrderStatusBadge";
import { OrderPaymentBadge } from "@/components/admin/order/OrderPaymentBadge";
import type { RecentOrdersResult } from "@/lib/admin/analytics";
import type { OrderStatus, PaymentStatus } from "@/lib/admin/api";

/* ============================================================
 * Types
 * ============================================================ */

export type RecentOrdersCardProps = {
  data: RecentOrdersResult | undefined;
  isLoading?: boolean;
  className?: string;
};

/* ============================================================
 * Component
 * ============================================================ */

export function RecentOrdersCard({
  data,
  isLoading = false,
  className,
}: RecentOrdersCardProps) {
  const rows = data?.rows ?? [];

  return (
    <div
      className={cn(
        "rounded-lg border border-brand-border bg-brand-surface",
        className,
      )}
    >
      <header className="flex items-center justify-between gap-2 border-b border-brand-border px-5 py-4">
        <div>
          <h2 className="font-heading text-sm font-semibold text-brand-primary">
            Recent orders
          </h2>
          <p className="mt-0.5 text-xs text-brand-text-secondary">
            Latest activity across all channels
          </p>
        </div>
        <Link
          href="/admin/orders"
          className="inline-flex items-center gap-1 text-xs text-brand-primary hover:underline"
        >
          All orders
          <ArrowRight className="h-3 w-3" aria-hidden="true" />
        </Link>
      </header>

      {isLoading && rows.length === 0 ? (
        <div className="space-y-2 p-5">
          {Array.from({ length: 5 }).map((_, i) => (
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
              <Receipt className="h-4 w-4" aria-hidden="true" />
            </div>
            <p className="text-sm text-brand-text-secondary">No orders yet.</p>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-brand-border text-left text-xs text-brand-text-secondary">
                <th className="px-5 py-2 font-medium">Order</th>
                <th className="px-3 py-2 font-medium">Customer</th>
                <th className="px-3 py-2 text-right font-medium">Total</th>
                <th className="px-5 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((o) => (
                <tr
                  key={o.orderId}
                  className="border-b border-brand-border transition-colors last:border-b-0 hover:bg-muted/40"
                >
                  <td className="px-5 py-2.5">
                    <Link
                      href={`/admin/orders/${o.orderId}`}
                      className="font-mono text-xs text-brand-primary hover:underline"
                    >
                      {o.orderNumber}
                    </Link>
                    <p className="text-[11px] text-brand-text-secondary">
                      {formatRelative(o.orderDate)}
                    </p>
                  </td>
                  <td className="px-3 py-2.5">
                    <p className="truncate text-sm text-brand-primary">
                      {o.customerName}
                    </p>
                    <p className="text-[11px] text-brand-text-secondary">
                      {o.itemsCount} item{o.itemsCount === 1 ? "" : "s"}
                    </p>
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-brand-primary">
                    {formatPrice(o.totalAmount)}
                  </td>
                  <td className="px-5 py-2.5">
                    <div className="flex flex-wrap gap-1">
                      <OrderStatusBadge status={o.status as OrderStatus} />
                      <OrderPaymentBadge
                        status={o.paymentStatus as PaymentStatus}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default RecentOrdersCard;
