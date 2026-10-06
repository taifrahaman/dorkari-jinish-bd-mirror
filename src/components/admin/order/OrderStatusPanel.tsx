// src/components/admin/order/OrderStatusPanel.tsx

"use client";

import { useState } from "react";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUpdateOrder } from "@/hooks/admin";
import type { OrderResponse } from "@/lib/validations/order.schema";
import type {
  OrderStatus,
  PaymentStatus,
  PaymentMethod,
} from "@/lib/admin/api";

/* ============================================================
 * Types
 * ============================================================ */

export type OrderStatusPanelProps = {
  order: OrderResponse;
  className?: string;
};

/* ============================================================
 * Options
 * ============================================================ */

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

const PAYMENT_METHODS: Array<{ value: PaymentMethod; label: string }> = [
  { value: "cash", label: "Cash" },
  { value: "mobile_payment", label: "Mobile payment" },
  { value: "cod", label: "Cash on delivery" },
  { value: "card", label: "Card" },
  { value: "bank_transfer", label: "Bank transfer" },
];

/* ============================================================
 * Component
 * ============================================================ */

export function OrderStatusPanel({ order, className }: OrderStatusPanelProps) {
  const [status, setStatus] = useState<OrderStatus>(order.status);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(
    order.paymentStatus,
  );
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | "">(
    order.paymentMethod ?? "",
  );
  const [trackingNumber, setTrackingNumber] = useState(
    order.trackingNumber ?? "",
  );
  const [notes, setNotes] = useState(order.notes ?? "");

  const mutation = useUpdateOrder(order._id);

  const dirty =
    status !== order.status ||
    paymentStatus !== order.paymentStatus ||
    (paymentMethod || "") !== (order.paymentMethod ?? "") ||
    trackingNumber !== (order.trackingNumber ?? "") ||
    notes !== (order.notes ?? "");

  const handleSave = async () => {
    await mutation.mutateAsync({
      status,
      paymentStatus,
      paymentMethod: paymentMethod === "" ? null : paymentMethod,
      trackingNumber: trackingNumber.trim() === "" ? null : trackingNumber,
      notes: notes.trim() === "" ? null : notes,
    });
  };

  return (
    <div
      className={
        className ??
        "space-y-4 rounded-lg border border-brand-border bg-brand-surface p-5"
      }
    >
      <header>
        <h2 className="font-heading text-sm font-semibold text-brand-primary">
          Update
        </h2>
        <p className="mt-0.5 text-xs text-brand-text-secondary">
          Change status, payment, or add a tracking number.
        </p>
      </header>

      <div className="space-y-1.5">
        <Label className="text-xs font-medium text-brand-primary">
          Order status
        </Label>
        <Select
          value={status}
          onValueChange={(v) => setStatus(v as OrderStatus)}
        >
          <SelectTrigger className="h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUSES.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-medium text-brand-primary">
          Payment status
        </Label>
        <Select
          value={paymentStatus}
          onValueChange={(v) => setPaymentStatus(v as PaymentStatus)}
        >
          <SelectTrigger className="h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PAYMENT_STATUSES.map((p) => (
              <SelectItem key={p.value} value={p.value}>
                {p.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-medium text-brand-primary">
          Payment method
        </Label>
        <Select
          value={paymentMethod || "unset"}
          onValueChange={(v) =>
            setPaymentMethod(v === "unset" ? "" : (v as PaymentMethod))
          }
        >
          <SelectTrigger className="h-9">
            <SelectValue placeholder="Not set" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="unset">Not set</SelectItem>
            {PAYMENT_METHODS.map((p) => (
              <SelectItem key={p.value} value={p.value}>
                {p.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-medium text-brand-primary">
          Tracking number
        </Label>
        <Input
          value={trackingNumber}
          onChange={(e) => setTrackingNumber(e.target.value)}
          placeholder="Optional"
          className="h-9 font-mono text-xs"
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-medium text-brand-primary">Notes</Label>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="Internal notes about this order…"
        />
      </div>

      <Button
        type="button"
        onClick={handleSave}
        disabled={!dirty || mutation.isPending}
        className="w-full"
      >
        {mutation.isPending ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <Save className="mr-2 h-4 w-4" aria-hidden="true" />
        )}
        Save changes
      </Button>
    </div>
  );
}

export default OrderStatusPanel;
