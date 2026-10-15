// src/components/admin/pos/POSCheckoutDialog.tsx

"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Banknote,
  CreditCard,
  Loader2,
  Smartphone,
  Wallet,
  Landmark,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/admin/format";
import type { PaymentMethod } from "@/lib/admin/api";
import type { OrderResponse } from "@/lib/validations/order.schema";
import type { POSCartLine, POSCartTotals } from "@/lib/admin/pos/cart-store";

/* ============================================================
 * Types
 * ============================================================ */

export type POSCheckoutDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lines: POSCartLine[];
  totals: POSCartTotals;
  onConfirm: (input: {
    paymentMethod: PaymentMethod;
    tenderAmount: number;
  }) => Promise<OrderResponse | void>;
  className?: string;
};

type MethodOption = {
  value: PaymentMethod;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  /** True when cash flow involves change calculation. */
  cashLike: boolean;
};

const METHODS: MethodOption[] = [
  { value: "cash", label: "Cash", icon: Banknote, cashLike: true },
  {
    value: "mobile_payment",
    label: "Mobile pay",
    icon: Smartphone,
    cashLike: false,
  },
  { value: "card", label: "Card", icon: CreditCard, cashLike: false },
  {
    value: "bank_transfer",
    label: "Bank",
    icon: Landmark,
    cashLike: false,
  },
  { value: "cod", label: "COD", icon: Wallet, cashLike: false },
];

/* ============================================================
 * Quick-tender amounts (relative to total)
 * ============================================================ */

function quickTenders(total: number): number[] {
  const round = (n: number) => Math.ceil(n / 100) * 100;
  const set = new Set<number>([round(total), round(total / 100) * 100 + 100]);
  // Add common notes above the total
  const notes = [100, 200, 500, 1000, 2000, 5000];
  for (const n of notes) {
    const candidate = Math.ceil(total / n) * n;
    if (candidate > total && set.size < 6) set.add(candidate);
  }
  return Array.from(set)
    .filter((v) => v >= total)
    .sort((a, b) => a - b)
    .slice(0, 5);
}

/* ============================================================
 * Component
 * ============================================================ */

export function POSCheckoutDialog({
  open,
  onOpenChange,
  lines,
  totals,
  onConfirm,
  className,
}: POSCheckoutDialogProps) {
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [tenderDraft, setTenderDraft] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset on open
  useEffect(() => {
    if (open) {
      setMethod("cash");
      setTenderDraft("");
      setError(null);
      setSubmitting(false);
    }
  }, [open]);

  const selectedMethod = METHODS.find((m) => m.value === method)!;
  const tender = Number.parseFloat(tenderDraft);
  const tenderValid = Number.isFinite(tender) && tender >= totals.totalAmount;
  const change =
    selectedMethod.cashLike && tenderValid ? tender - totals.totalAmount : 0;

  const quickAmounts = useMemo(
    () => quickTenders(totals.totalAmount),
    [totals.totalAmount],
  );

  const handleConfirm = async () => {
    setError(null);
    setSubmitting(true);
    try {
      await onConfirm({
        paymentMethod: method,
        tenderAmount:
          selectedMethod.cashLike && tenderValid ? tender : totals.totalAmount,
      });
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to complete sale");
    } finally {
      setSubmitting(false);
    }
  };

  const canConfirm =
    !submitting &&
    (!selectedMethod.cashLike || tenderValid) &&
    lines.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn("max-w-lg", className)}>
        <DialogHeader>
          <DialogTitle className="font-heading text-lg text-brand-primary">
            Complete sale
          </DialogTitle>
          <DialogDescription className="text-sm text-brand-text-secondary">
            {totals.itemCount} item{totals.itemCount === 1 ? "" : "s"} ·{" "}
            {formatPrice(totals.totalAmount)}
          </DialogDescription>
        </DialogHeader>

        {/* Payment method picker */}
        <div className="space-y-2">
          <Label className="text-xs font-medium text-brand-primary">
            Payment method
          </Label>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {METHODS.map((m) => {
              const Icon = m.icon;
              const active = method === m.value;
              return (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setMethod(m.value)}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-lg border p-2.5 text-xs transition-colors",
                    active
                      ? "border-brand-primary bg-brand-primary text-white"
                      : "border-brand-border bg-brand-surface text-brand-text-secondary hover:border-brand-primary/40 hover:text-brand-primary",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="truncate">{m.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Cash tender */}
        {selectedMethod.cashLike && (
          <div className="space-y-2 rounded-lg border border-brand-border bg-muted/30 p-3">
            <Label
              htmlFor="pos-tender"
              className="text-xs font-medium text-brand-primary"
            >
              Amount received
            </Label>
            <Input
              id="pos-tender"
              type="number"
              min="0"
              step="1"
              value={tenderDraft}
              onChange={(e) => setTenderDraft(e.target.value)}
              placeholder={String(Math.ceil(totals.totalAmount))}
              className="h-11 font-heading text-lg tabular-nums"
              autoFocus
            />

            {/* Quick tender buttons */}
            <div className="flex flex-wrap gap-1.5">
              {quickAmounts.map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setTenderDraft(String(amt))}
                  className="rounded-md border border-brand-border bg-brand-surface px-2.5 py-1 text-xs tabular-nums text-brand-primary transition-colors hover:border-brand-primary hover:bg-muted"
                >
                  {formatPrice(amt)}
                </button>
              ))}
            </div>

            {/* Change */}
            {tenderValid && (
              <div className="flex items-center justify-between rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm">
                <span className="text-emerald-900">Change</span>
                <span className="font-heading text-base font-semibold tabular-nums text-emerald-900">
                  {formatPrice(change)}
                </span>
              </div>
            )}

            {tenderDraft !== "" && !tenderValid && (
              <p className="text-xs text-destructive">
                Amount received must be at least{" "}
                {formatPrice(totals.totalAmount)}.
              </p>
            )}
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive"
          >
            {error}
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button type="button" onClick={handleConfirm} disabled={!canConfirm}>
            {submitting && (
              <Loader2
                className="mr-2 h-4 w-4 animate-spin"
                aria-hidden="true"
              />
            )}
            Complete sale
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default POSCheckoutDialog;
