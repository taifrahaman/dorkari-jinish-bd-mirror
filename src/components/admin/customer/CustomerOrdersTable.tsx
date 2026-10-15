// src/components/admin/customer/CustomerOrdersTable.tsx

"use client";

import Link from "next/link";
import { ArrowRight, Receipt } from "lucide-react";
import { OrderStatusBadge } from "@/components/admin/order/OrderStatusBadge";
import { OrderPaymentBadge } from "@/components/admin/order/OrderPaymentBadge";
import { cn } from "@/lib/utils";
import { formatPrice, formatRelative } from "@/lib/admin/format";
import type { CustomerStats } from "@/lib/validations/customer.schema";
import type { OrderStatus, PaymentStatus } from "@/lib/admin/api";

/* ============================================================
 * Types
 * ============================================================ */

export type CustomerOrdersTableProps = {
  stats: CustomerStats | undefined;
  customerId: string;
  isLoading?: boolean;
  className?: string;
};

/* ============================================================
 * Component
 * ============================================================ */

export function CustomerOrdersTable({
  stats,
  customerId,
  isLoading = false,
  className,
}: CustomerOrdersTableProps) {
  const orders = stats?.recentOrders ?? [];

  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border border-brand-border bg-brand-surface",
        className,
      )}
    >
      <header className="flex items-center justify-between gap-2 border-b border-brand-border px-5 py-4">
        <div>
          <h2 className="font-heading text-sm font-semibold text-brand-primary">
            Recent orders
          </h2>
          <p className="mt-0.5 text-xs text-brand-text-secondary">
            Last {orders.length} order{orders.length === 1 ? "" : "s"}
          </p>
        </div>
        {orders.length > 0 && (
          <Link
            href={`/admin/orders?user=${customerId}`}
            className="inline-flex items-center gap-1 text-xs text-brand-primary hover:underline"
          >
            View all
            <ArrowRight className="h-3 w-3" aria-hidden="true" />
          </Link>
        )}
      </header>

      {isLoading ? (
        <div className="space-y-2 p-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-10 animate-pulse rounded-md bg-muted/40"
            />
          ))}
        </div>
      ) : orders.length === 0 ? (
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
                <th className="px-3 py-2 text-right font-medium">Total</th>
                <th className="px-5 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr
                  key={order.orderId}
                  className="border-b border-brand-border last:border-b-0"
                >
                  <td className="px-5 py-2.5">
                    <Link
                      href={`/admin/orders/${order.orderId}`}
                      className="font-mono text-xs text-brand-primary hover:underline"
                    >
                      {order.orderNumber}
                    </Link>
                    <p className="text-[11px] text-brand-text-secondary">
                      {formatRelative(order.orderDate)}
                    </p>
                  </td>
                  <td className="px-3 py-2.5 text-right font-medium tabular-nums text-brand-primary">
                    {formatPrice(order.totalAmount)}
                  </td>
                  <td className="px-5 py-2.5">
                    <div className="flex flex-wrap gap-1">
                      <OrderStatusBadge status={order.status as OrderStatus} />
                      <OrderPaymentBadge
                        status={order.paymentStatus as PaymentStatus}
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

export default CustomerOrdersTable;
