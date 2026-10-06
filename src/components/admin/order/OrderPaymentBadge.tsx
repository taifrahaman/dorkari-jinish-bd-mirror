// src/components/admin/order/OrderPaymentBadge.tsx

"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { PaymentStatus } from "@/lib/admin/api";

const TONES: Record<PaymentStatus, string> = {
  pending: "border-slate-300 bg-slate-50 text-slate-700",
  partial: "border-amber-300 bg-amber-50 text-amber-700",
  paid: "border-emerald-300 bg-emerald-50 text-emerald-700",
  failed: "border-destructive/30 bg-destructive/10 text-destructive",
  refunded: "border-violet-300 bg-violet-50 text-violet-700",
};

const LABELS: Record<PaymentStatus, string> = {
  pending: "Unpaid",
  partial: "Partial",
  paid: "Paid",
  failed: "Failed",
  refunded: "Refunded",
};

export function OrderPaymentBadge({
  status,
  className,
}: {
  status: PaymentStatus;
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

export default OrderPaymentBadge;
