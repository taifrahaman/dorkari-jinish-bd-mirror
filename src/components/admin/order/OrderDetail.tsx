// src/components/admin/order/OrderDetail.tsx

"use client";

import { Loader2 } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { useOrder } from "@/hooks/admin";
import { formatDateTime } from "@/lib/admin/format";
import { OrderStatusBadge } from "./OrderStatusBadge";
import { OrderPaymentBadge } from "./OrderPaymentBadge";
import { OrderItemsTable } from "./OrderItemsTable";
import { OrderSummaryCard } from "./OrderSummaryCard";
import { OrderCustomerCard } from "./OrderCustomerCard";
import { OrderStatusPanel } from "./OrderStatusPanel";

/* ============================================================
 * Types
 * ============================================================ */

export type OrderDetailProps = {
  orderId: string;
};

/* ============================================================
 * Component
 * ============================================================ */

export function OrderDetail({ orderId }: OrderDetailProps) {
  const orderQuery = useOrder(orderId);

  if (orderQuery.isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center gap-2 text-sm text-brand-text-secondary">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        Loading order…
      </div>
    );
  }

  if (orderQuery.isError || !orderQuery.data) {
    return (
      <div className="space-y-4">
        <PageHeader
          backHref="/admin/orders"
          title="Order not found"
          breadcrumbs={[
            { label: "Dashboard", href: "/admin" },
            { label: "Orders", href: "/admin/orders" },
            { label: "Not found" },
          ]}
        />
        <div
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {orderQuery.error instanceof Error
            ? orderQuery.error.message
            : "Failed to load this order."}
        </div>
      </div>
    );
  }

  const order = orderQuery.data;
  const archived = Boolean(order.deletedAt);

  return (
    <div className="space-y-6">
      <PageHeader
        backHref="/admin/orders"
        title={order.orderNumber}
        description={`Placed ${formatDateTime(order.orderDate)}`}
        breadcrumbs={[
          { label: "Dashboard", href: "/admin" },
          { label: "Orders", href: "/admin/orders" },
          { label: order.orderNumber },
        ]}
      >
        <div className="flex flex-wrap items-center gap-2">
          <OrderStatusBadge status={order.status} />
          <OrderPaymentBadge status={order.paymentStatus} />
          {archived && (
            <span className="inline-flex items-center rounded-md border border-brand-border bg-muted px-2 py-0.5 text-xs text-brand-text-secondary">
              Archived
            </span>
          )}
          <span className="inline-flex items-center rounded-md border border-brand-border bg-muted px-2 py-0.5 text-xs capitalize text-brand-text-secondary">
            {order.channel.replace("-", " ")}
          </span>
        </div>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <OrderItemsTable items={order.items} />
        </div>

        <div className="space-y-6">
          <OrderSummaryCard order={order} />
          <OrderCustomerCard order={order} />
          {!archived && <OrderStatusPanel order={order} />}
        </div>
      </div>
    </div>
  );
}

export default OrderDetail;
