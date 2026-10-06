// src/components/admin/order/OrderStatusBadge.tsx

"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { OrderStatus } from "@/lib/admin/api";

const TONES: Record<OrderStatus, string> = {
  pending: "border-slate-300 bg-slate-50 text-slate-700",
  confirmed: "border-blue-300 bg-blue-50 text-blue-700",
  processing: "border-indigo-300 bg-indigo-50 text-indigo-700",
  shipped: "border-violet-300 bg-violet-50 text-violet-700",
  delivered: "border-emerald-300 bg-emerald-50 text-emerald-700",
  cancelled: "border-destructive/30 bg-destructive/10 text-destructive",
  returned: "border-amber-300 bg-amber-50 text-amber-700",
};

const LABELS: Record<OrderStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  returned: "Returned",
};

export function OrderStatusBadge({
  status,
  className,
}: {
  status: OrderStatus;
  className?: string;
}) {
  return (
    <Badge
      variant="outline"
      className={cn("font-medium", TONES[status], className)}
    >
      {LABELS[status]}
    </Badge>
  );
}

export default OrderStatusBadge;
