// src/components/admin/pos/POSProductCard.tsx

"use client";

import Image from "next/image";
import { Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/admin/format";
import type { ProductResponse } from "@/lib/validations/product.schema";

/* ============================================================
 * Types
 * ============================================================ */

export type POSProductCardProps = {
  product: ProductResponse;
  onAdd: (product: ProductResponse) => void;
  className?: string;
};

/* ============================================================
 * Component
 * ============================================================ */

export function POSProductCard({
  product,
  onAdd,
  className,
}: POSProductCardProps) {
  const image = product.images?.[0];
  const outOfStock = product.stock <= 0;

  return (
    <button
      type="button"
      onClick={() => !outOfStock && onAdd(product)}
      disabled={outOfStock}
      aria-label={`Add ${product.name.en} to cart`}
      className={cn(
        "group flex flex-col overflow-hidden rounded-lg border border-brand-border bg-brand-surface text-left transition-all",
        !outOfStock &&
          "hover:border-brand-accent/60 hover:shadow-md active:scale-[0.98]",
        outOfStock && "cursor-not-allowed opacity-50",
        className,
      )}
    >
      <div className="relative aspect-square w-full overflow-hidden bg-muted">
        {image ? (
          <Image
            src={image.url}
            alt={image.alt || product.name.en}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            className="object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="grid h-full w-full place-items-center text-brand-text-secondary">
            <Package className="h-6 w-6" aria-hidden="true" />
          </div>
        )}

        {outOfStock && (
          <div className="absolute inset-0 grid place-items-center bg-black/50">
            <span className="rounded-md bg-white px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-destructive">
              Out of stock
            </span>
          </div>
        )}

        {product.stock > 0 && product.stock <= 5 && (
          <div className="absolute left-1 top-1 rounded-sm bg-amber-500 px-1.5 py-0.5 text-[10px] font-semibold text-white shadow-sm">
            {product.stock} left
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1 p-2.5">
        <p className="line-clamp-2 text-xs font-medium leading-snug text-brand-primary">
          {product.name.en}
        </p>
        {product.sku && (
          <p className="truncate font-mono text-[10px] text-brand-text-secondary">
            {product.sku}
          </p>
        )}
        <p className="mt-auto font-heading text-sm font-semibold tabular-nums text-brand-primary">
          {formatPrice(product.price)}
        </p>
      </div>
    </button>
  );
}

export default POSProductCard;
