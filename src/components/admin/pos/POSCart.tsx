// src/components/admin/pos/POSCart.tsx

"use client";

import { ShoppingCart, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { POSCartItem } from "./POSCartItem";
import { POSCartSummary } from "./POSCartSummary";
import { POSCustomerForm } from "./POSCustomerForm";
import { cn } from "@/lib/utils";
import { computeTotals, usePOSCart } from "@/lib/admin/pos/cart-store";

/* ============================================================
 * Types
 * ============================================================ */

export type POSCartProps = {
  onCheckout: () => void;
  className?: string;
};

/* ============================================================
 * Component
 * ============================================================ */

export function POSCart({ onCheckout, className }: POSCartProps) {
  const lines = usePOSCart((s) => s.lines);
  const customer = usePOSCart((s) => s.customer);
  const channel = usePOSCart((s) => s.channel);
  const incrementLine = usePOSCart((s) => s.incrementLine);
  const setQuantity = usePOSCart((s) => s.setQuantity);
  const setDiscount = usePOSCart((s) => s.setDiscount);
  const removeLine = usePOSCart((s) => s.removeLine);
  const setCustomer = usePOSCart((s) => s.setCustomer);
  const setChannel = usePOSCart((s) => s.setChannel);
  const clear = usePOSCart((s) => s.clear);

  const totals = computeTotals(lines);
  const isEmpty = lines.length === 0;

  return (
    <div
      className={cn(
        "flex h-full flex-col rounded-lg border border-brand-border bg-brand-surface",
        className,
      )}
    >
      <header className="flex items-center justify-between gap-2 border-b border-brand-border px-4 py-3">
        <div className="flex items-center gap-2">
          <ShoppingCart
            className="h-4 w-4 text-brand-primary"
            aria-hidden="true"
          />
          <h2 className="font-heading text-sm font-semibold text-brand-primary">
            Cart
          </h2>
          {!isEmpty && (
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs tabular-nums text-brand-text-secondary">
              {totals.itemCount}
            </span>
          )}
        </div>

        {!isEmpty && (
          <button
            type="button"
            onClick={clear}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-brand-text-secondary transition-colors hover:bg-muted hover:text-destructive"
            aria-label="Clear cart"
          >
            <Trash2 className="h-3 w-3" aria-hidden="true" />
            Clear
          </button>
        )}
      </header>

      <div className="flex-1 overflow-y-auto p-3">
        {isEmpty ? (
          <div className="grid h-full place-items-center px-4 py-16 text-center">
            <div className="flex flex-col items-center gap-2">
              <div className="grid h-12 w-12 place-items-center rounded-full bg-muted text-brand-text-secondary">
                <ShoppingCart className="h-5 w-5" aria-hidden="true" />
              </div>
              <p className="text-sm font-medium text-brand-primary">
                Cart is empty
              </p>
              <p className="max-w-[200px] text-xs text-brand-text-secondary">
                Click a product or scan a barcode to add it.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {lines.map((line) => (
              <POSCartItem
                key={line.id}
                line={line}
                onIncrement={incrementLine}
                onSetQuantity={setQuantity}
                onSetDiscount={setDiscount}
                onRemove={removeLine}
              />
            ))}
          </div>
        )}
      </div>

      {!isEmpty && (
        <div className="space-y-3 border-t border-brand-border p-3">
          <POSCustomerForm
            customer={customer}
            onCustomerChange={setCustomer}
            channel={channel}
            onChannelChange={setChannel}
          />

          <POSCartSummary totals={totals} />

          <Button
            type="button"
            size="lg"
            onClick={onCheckout}
            className="h-12 w-full font-heading text-base"
          >
            Checkout · {totals.itemCount} item
            {totals.itemCount === 1 ? "" : "s"}
          </Button>
        </div>
      )}
    </div>
  );
}

export default POSCart;
