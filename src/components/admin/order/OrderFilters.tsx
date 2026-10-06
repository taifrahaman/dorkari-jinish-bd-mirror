// src/components/admin/order/OrderFilters.tsx

"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { OrderChannel, OrderStatus, PaymentStatus } from "@/lib/admin/api";

/* ============================================================
 * Types
 * ============================================================ */

export type OrderFiltersValue = {
  channel?: OrderChannel;
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  includeDeleted?: boolean;
};

export type OrderFiltersProps = {
  value: OrderFiltersValue;
  onChange: (next: OrderFiltersValue) => void;
  className?: string;
};

/* ============================================================
 * Options
 * ============================================================ */

const CHANNELS: Array<{ value: OrderChannel; label: string }> = [
  { value: "online", label: "Online" },
  { value: "pos", label: "POS" },
  { value: "phone", label: "Phone" },
  { value: "walk-in", label: "Walk-in" },
];

const STATUSES: Array<{ value: OrderStatus; label: string }> = [
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "processing", label: "Processing" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
  { value: "returned", label: "Returned" },
];

const PAYMENT_STATUSES: Array<{ value: PaymentStatus; label: string }> = [
  { value: "pending", label: "Unpaid" },
  { value: "partial", label: "Partial" },
  { value: "paid", label: "Paid" },
  { value: "failed", label: "Failed" },
  { value: "refunded", label: "Refunded" },
];

/* ============================================================
 * Helpers
 * ============================================================ */

function hasAny(v: OrderFiltersValue): boolean {
  return Boolean(
    v.channel ||
    v.status ||
    v.paymentStatus ||
    (v.includeDeleted !== undefined && v.includeDeleted),
  );
}

/* ============================================================
 * Component
 * ============================================================ */

export function OrderFilters({
  value,
  onChange,
  className,
}: OrderFiltersProps) {
  const clearAll = () => onChange({});

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {/* Channel */}
      <Select
        value={value.channel ?? "any"}
        onValueChange={(v) =>
          onChange({
            ...value,
            channel: v === "any" ? undefined : (v as OrderChannel),
          })
        }
      >
        <SelectTrigger className="h-9 w-[140px]" aria-label="Channel">
          <SelectValue placeholder="Any channel" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="any">Any channel</SelectItem>
          {CHANNELS.map((c) => (
            <SelectItem key={c.value} value={c.value}>
              {c.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Status */}
      <Select
        value={value.status ?? "any"}
        onValueChange={(v) =>
          onChange({
            ...value,
            status: v === "any" ? undefined : (v as OrderStatus),
          })
        }
      >
        <SelectTrigger className="h-9 w-[140px]" aria-label="Status">
          <SelectValue placeholder="Any status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="any">Any status</SelectItem>
          {STATUSES.map((s) => (
            <SelectItem key={s.value} value={s.value}>
              {s.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Payment */}
      <Select
        value={value.paymentStatus ?? "any"}
        onValueChange={(v) =>
          onChange({
            ...value,
            paymentStatus: v === "any" ? undefined : (v as PaymentStatus),
          })
        }
      >
        <SelectTrigger className="h-9 w-[150px]" aria-label="Payment status">
          <SelectValue placeholder="Any payment" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="any">Any payment</SelectItem>
          {PAYMENT_STATUSES.map((p) => (
            <SelectItem key={p.value} value={p.value}>
              {p.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Archived */}
      <Select
        value={value.includeDeleted ? "with" : "without"}
        onValueChange={(v) =>
          onChange({ ...value, includeDeleted: v === "with" })
        }
      >
        <SelectTrigger className="h-9 w-[160px]" aria-label="Archived orders">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="without">Hide archived</SelectItem>
          <SelectItem value="with">Include archived</SelectItem>
        </SelectContent>
      </Select>

      {hasAny(value) && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={clearAll}
          className="h-9 px-2 text-xs text-brand-text-secondary hover:text-brand-primary"
        >
          <X className="mr-1 h-3 w-3" aria-hidden="true" />
          Clear
        </Button>
      )}
    </div>
  );
}

export default OrderFilters;
