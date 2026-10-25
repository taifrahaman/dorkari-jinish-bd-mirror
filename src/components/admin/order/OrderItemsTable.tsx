// src/components/admin/order/OrderItemsTable.tsx

"use client";

import Image from "next/image";
import Link from "next/link";
import { Package } from "lucide-react";
import { formatPrice } from "@/lib/admin/format";
import type { OrderResponse } from "@/lib/validations/order.schema";

/* ============================================================
 * Types
 * ============================================================ */

export type OrderItemsTableProps = {
  items: OrderResponse["items"];
  className?: string;
};

/* ============================================================
 * Component
 * ============================================================ */

export function OrderItemsTable({ items, className }: OrderItemsTableProps) {
  return (
    <div
      className={
        className ??
        "overflow-hidden rounded-lg border border-brand-border bg-brand-surface"
      }
    >
      <header className="border-b border-brand-border px-5 py-4">
        <h2 className="font-heading text-sm font-semibold text-brand-primary">
          Items ({items.length})
        </h2>
      </header>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-brand-border text-left text-xs text-brand-text-secondary">
              <th className="px-5 py-2 font-medium">Product</th>
              <th className="px-3 py-2 text-right font-medium">Qty</th>
              <th className="px-3 py-2 text-right font-medium">Unit</th>
              <th className="px-5 py-2 text-right font-medium">Total</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => {
              const product =
                typeof item.product === "string" ? null : item.product;
              const image = product?.images?.[0];
              const displayName = item.nameSnapshot.en || item.nameSnapshot.bn;

              return (
                <tr
                  key={i}
                  className="border-b border-brand-border last:border-b-0"
                >
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 shrink-0 overflow-hidden rounded-md border border-brand-border bg-muted">
                        {image ? (
                          <Image
                            src={image.url}
                            alt={image.alt || displayName}
                            width={40}
                            height={40}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="grid h-full w-full place-items-center text-brand-text-secondary">
                            <Package className="h-4 w-4" aria-hidden="true" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        {product ? (
                          <Link
                            href={`/admin/products/${product._id}`}
                            className="block truncate text-sm text-brand-primary hover:underline"
                          >
                            {displayName}
                          </Link>
                        ) : (
                          <span className="block truncate text-sm text-brand-primary">
                            {displayName}
                          </span>
                        )}
                        {item.skuSnapshot && (
                          <p className="truncate text-xs text-brand-text-secondary">
                            {item.skuSnapshot}
                          </p>
                        )}
                        {item.colorHex && (
                          <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-brand-text-secondary">
                            <span
                              className="inline-block h-3 w-3 rounded-full shadow-[inset_0_0_0_1px_rgba(0,0,0,0.14)]"
                              style={{ backgroundColor: item.colorHex }}
                            />
                            {item.colorName?.en ||
                              item.colorName?.bn ||
                              item.colorHex}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums">
                    {item.quantity}
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums text-brand-text-secondary">
                    {formatPrice(item.priceAtTime)}
                  </td>
                  <td className="px-5 py-3 text-right font-medium tabular-nums">
                    {formatPrice(item.lineTotal)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default OrderItemsTable;
