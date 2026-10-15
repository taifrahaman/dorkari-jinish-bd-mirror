// src/components/admin/pos/POSCartItem.tsx

"use client";

import { useState } from "react";
import Image from "next/image";
import { Minus, Package, Plus, Tag, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/admin/format";
import type { POSCartLine } from "@/lib/admin/pos/cart-store";

/* ============================================================
 * Types
 * ============================================================ */

export type POSCartItemProps = {
  line: POSCartLine;
  onIncrement: (id: string) => void;
  onSetQuantity: (id: string, qty: number) => void;
  onSetDiscount: (id: string, discount: number) => void;
  onRemove: (id: string) => void;
  className?: string;
};

/* ============================================================
 * Component
 * ============================================================ */

export function POSCartItem({
  line,
  onIncrement,
  onSetQuantity,
  onSetDiscount,
  onRemove,
  className,
}: POSCartItemProps) {
  const [editingDiscount, setEditingDiscount] = useState(false);
  const [discountDraft, setDiscountDraft] = useState(
    line.discount > 0 ? String(line.discount) : "",
  );

  const gross = line.unitPrice * line.quantity;
  const lineTotal = Math.max(0, gross - line.discount);

  const commitDiscount = () => {
    const parsed = Number(discountDraft);
    onSetDiscount(line.id, Number.isFinite(parsed) ? parsed : 0);
    setEditingDiscount(false);
  };

  return (
    <div
      data-pos-no-refocus
      className={cn(
        "group rounded-lg border border-brand-border bg-brand-surface p-2.5 transition-colors",
        className,
      )}
    >
      <div className="flex gap-2.5">
        {/* Image */}
        <div className="h-14 w-14 shrink-0 overflow-hidden rounded-md border border-brand-border bg-muted">
          {line.imageUrl ? (
            <Image
              src={line.imageUrl}
              alt={line.name}
              width={56}
              height={56}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="grid h-full w-full place-items-center text-brand-text-secondary">
              <Package className="h-4 w-4" aria-hidden="true" />
            </div>
          )}
        </div>

        {/* Body */}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="line-clamp-2 text-sm font-medium leading-snug text-brand-primary">
                {line.name}
              </p>
              {line.sku && (
                <p className="truncate font-mono text-[10px] text-brand-text-secondary">
                  {line.sku}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={() => onRemove(line.id)}
              className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-brand-text-secondary opacity-0 transition-opacity hover:bg-muted hover:text-destructive group-hover:opacity-100"
              aria-label={`Remove ${line.name}`}
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>

          {/* Unit price + line discount */}
          <div className="mt-1 flex items-center justify-between gap-2 text-xs">
            <span className="text-brand-text-secondary">
              {formatPrice(line.unitPrice)} × {line.quantity}
            </span>

            {editingDiscount ? (
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  min="0"
                  step="1"
                  value={discountDraft}
                  onChange={(e) => setDiscountDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      commitDiscount();
                    } else if (e.key === "Escape") {
                      setEditingDiscount(false);
                      setDiscountDraft(
                        line.discount > 0 ? String(line.discount) : "",
                      );
                    }
                  }}
                  onBlur={commitDiscount}
                  autoFocus
                  placeholder="0"
                  className="h-6 w-16 px-1.5 text-xs"
                />
                <button
                  type="button"
                  onClick={() => {
                    onSetDiscount(line.id, 0);
                    setEditingDiscount(false);
                    setDiscountDraft("");
                  }}
                  className="grid h-6 w-6 place-items-center rounded-full text-brand-text-secondary hover:bg-muted hover:text-destructive"
                  aria-label="Clear discount"
                >
                  <X className="h-3 w-3" aria-hidden="true" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setEditingDiscount(true)}
                className={cn(
                  "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] transition-colors",
                  line.discount > 0
                    ? "bg-brand-accent-light text-brand-primary"
                    : "text-brand-text-secondary hover:bg-muted hover:text-brand-primary",
                )}
              >
                <Tag className="h-3 w-3" aria-hidden="true" />
                {line.discount > 0
                  ? `−${formatPrice(line.discount)}`
                  : "Discount"}
              </button>
            )}
          </div>

          {/* Quantity controls + line total */}
          <div className="mt-2 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() =>
                  line.quantity > 1
                    ? onSetQuantity(line.id, line.quantity - 1)
                    : onRemove(line.id)
                }
                className="h-7 w-7"
                aria-label="Decrease quantity"
              >
                <Minus className="h-3 w-3" aria-hidden="true" />
              </Button>
              <span className="w-8 text-center text-sm font-medium tabular-nums">
                {line.quantity}
              </span>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => onIncrement(line.id)}
                disabled={line.quantity >= line.stockAvailable}
                className="h-7 w-7"
                aria-label="Increase quantity"
              >
                <Plus className="h-3 w-3" aria-hidden="true" />
              </Button>
            </div>

            <span className="font-heading text-sm font-semibold tabular-nums text-brand-primary">
              {formatPrice(lineTotal)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default POSCartItem;
