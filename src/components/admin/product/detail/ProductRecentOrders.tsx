// src/components/admin/product/detail/ProductRecentOrders.tsx

"use client";

import Link from "next/link";
import { ArrowRight, Receipt } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPrice, formatRelative } from "@/lib/admin/format";
import type { ProductStats } from "@/lib/admin/api";

/* ============================================================
 * Types
 * ============================================================ */

export type ProductRecentOrdersProps = {
  stats: ProductStats;
  className?: string;
};

/* ============================================================
 * Component
 * ============================================================ */

export function ProductRecentOrders({
  stats,
  className,
}: ProductRecentOrdersProps) {
  const { recentOrders } = stats;

  return (
    <div
      className={cn(
        "rounded-lg border border-brand-border bg-brand-surface",
        className,
      )}
    >
      <header className="border-b border-brand-border px-5 py-4">
        <h2 className="font-heading text-sm font-semibold text-brand-primary">
          Recent orders
        </h2>
        <p className="mt-0.5 text-xs text-brand-text-secondary">
          The last {recentOrders.length} order
          {recentOrders.length === 1 ? "" : "s"} containing this product
        </p>
      </header>

      {recentOrders.length === 0 ? (
        <div className="flex flex-col items-center gap-2 px-5 py-12 text-center">
          <div className="grid h-10 w-10 place-items-center rounded-full bg-muted text-brand-text-secondary">
            <Receipt className="h-4 w-4" aria-hidden="true" />
          </div>
          <p className="text-sm text-brand-text-secondary">
            No orders yet. Sales will appear here.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-brand-border text-left text-xs text-brand-text-secondary">
                <th className="px-5 py-2 font-medium">Order</th>
                <th className="px-3 py-2 font-medium">Channel</th>
                <th className="px-3 py-2 text-right font-medium">Qty</th>
                <th className="px-3 py-2 text-right font-medium">Total</th>
                <th className="px-5 py-2 text-right font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((o) => (
                <tr
                  key={o.orderId}
                  className="border-b border-brand-border transition-colors hover:bg-muted/40"
                >
                  <td className="px-5 py-2.5 font-mono text-xs">
                    <Link
                      href={`/admin/orders/${o.orderId}`}
                      className="text-brand-primary hover:underline"
                    >
                      {o.orderNumber}
                    </Link>
                  </td>
                  <td className="px-3 py-2.5 text-xs text-brand-text-secondary capitalize">
                    {o.channel.replace("-", " ")}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums">
                    {o.quantity}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums">
                    {formatPrice(o.lineTotal)}
                  </td>
                  <td className="px-5 py-2.5 text-right text-xs text-brand-text-secondary">
                    {formatRelative(o.orderDate)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="border-t border-brand-border px-5 py-2.5">
            <Link
              href={`/admin/orders?product=${stats.productId}`}
              className="inline-flex items-center gap-1 text-xs text-brand-primary hover:underline"
            >
              View all orders
              <ArrowRight className="h-3 w-3" aria-hidden="true" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProductRecentOrders;
