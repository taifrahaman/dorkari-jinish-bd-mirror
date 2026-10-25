// src/components/admin/pos/POSReceipt.tsx

"use client";

import { Printer, RotateCcw, CheckCircle2 } from "lucide-react";
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatDateTime, formatPrice } from "@/lib/admin/format";
import type { OrderResponse } from "@/lib/validations/order.schema";

/* ============================================================
 * Types
 * ============================================================ */

export type POSReceiptProps = {
  order: OrderResponse | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNewSale: () => void;
  storeName: string;
  storePhone?: string;
  storeAddress?: string;
  className?: string;
};

/* ============================================================
 * Component
 * ============================================================ */

export function POSReceipt({
  order,
  open,
  onOpenChange,
  onNewSale,
  storeName,
  storePhone,
  storeAddress,
  className,
}: POSReceiptProps) {
  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "max-w-md print:max-w-none print:border-0 print:shadow-none",
          className,
        )}
      >
        {/* Success banner — hidden on print */}
        <div className="flex items-center gap-3 rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-3 print:hidden">
          <CheckCircle2
            className="h-5 w-5 shrink-0 text-emerald-600"
            aria-hidden="true"
          />
          <div>
            <p className="text-sm font-medium text-emerald-900">
              Sale complete
            </p>
            <p className="text-xs text-emerald-800">
              {order.orderNumber} · {formatPrice(order.totalAmount)}
            </p>
          </div>
        </div>

        {/* Printable receipt */}
        <div id="pos-receipt" className="space-y-4">
          <div className="text-center">
            <h2 className="font-heading text-lg font-semibold text-brand-primary">
              {storeName}
            </h2>
            {storePhone && (
              <p className="text-xs text-brand-text-secondary">{storePhone}</p>
            )}
            {storeAddress && (
              <p className="mt-0.5 whitespace-pre-line text-xs text-brand-text-secondary">
                {storeAddress}
              </p>
            )}
          </div>

          <div className="border-y border-dashed border-brand-border py-3 text-xs">
            <div className="flex justify-between">
              <span className="text-brand-text-secondary">Order</span>
              <span className="font-mono text-brand-primary">
                {order.orderNumber}
              </span>
            </div>
            <div className="mt-1 flex justify-between">
              <span className="text-brand-text-secondary">Date</span>
              <span className="text-brand-primary">
                {formatDateTime(order.orderDate)}
              </span>
            </div>
            {order.customerSnapshot?.name && (
              <div className="mt-1 flex justify-between">
                <span className="text-brand-text-secondary">Customer</span>
                <span className="text-brand-primary">
                  {order.customerSnapshot.name}
                </span>
              </div>
            )}
            {order.paymentMethod && (
              <div className="mt-1 flex justify-between">
                <span className="text-brand-text-secondary">Payment</span>
                <span className="capitalize text-brand-primary">
                  {order.paymentMethod.replace("_", " ")}
                </span>
              </div>
            )}
          </div>

          {/* Items */}
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-dashed border-brand-border">
                <th className="pb-1 text-left font-medium text-brand-text-secondary">
                  Item
                </th>
                <th className="pb-1 text-right font-medium text-brand-text-secondary">
                  Qty
                </th>
                <th className="pb-1 text-right font-medium text-brand-text-secondary">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item, i) => (
                <tr
                  key={i}
                  className="border-b border-dashed border-brand-border last:border-b-0"
                >
                  <td className="py-1.5 pr-2 text-brand-primary">
                    {item.nameSnapshot.en || item.nameSnapshot.bn}
                  </td>
                  <td className="py-1.5 text-right tabular-nums text-brand-primary">
                    {item.quantity}
                  </td>
                  <td className="py-1.5 text-right tabular-nums text-brand-primary">
                    {formatPrice(item.lineTotal)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="space-y-1 border-t border-dashed border-brand-border pt-3 text-xs">
            <div className="flex justify-between">
              <span className="text-brand-text-secondary">Subtotal</span>
              <span className="tabular-nums text-brand-primary">
                {formatPrice(order.subtotal)}
              </span>
            </div>
            {order.discountTotal > 0 && (
              <div className="flex justify-between">
                <span className="text-brand-text-secondary">Discount</span>
                <span className="tabular-nums text-brand-primary">
                  −{formatPrice(order.discountTotal)}
                </span>
              </div>
            )}
            {order.taxTotal > 0 && (
              <div className="flex justify-between">
                <span className="text-brand-text-secondary">VAT</span>
                <span className="tabular-nums text-brand-primary">
                  {formatPrice(order.taxTotal)}
                </span>
              </div>
            )}
            <div className="mt-2 flex justify-between border-t border-dashed border-brand-border pt-2 font-heading text-base font-semibold">
              <span className="text-brand-primary">Total</span>
              <span className="tabular-nums text-brand-primary">
                {formatPrice(order.totalAmount)}
              </span>
            </div>
          </div>

          <p className="pt-4 text-center text-[10px] text-brand-text-secondary">
            Thank you for your purchase!
          </p>
        </div>

        <DialogFooter className="print:hidden">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
          <Button type="button" variant="outline" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" aria-hidden="true" />
            Print
          </Button>
          <Button type="button" onClick={onNewSale}>
            <RotateCcw className="mr-2 h-4 w-4" aria-hidden="true" />
            New sale
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default POSReceipt;
