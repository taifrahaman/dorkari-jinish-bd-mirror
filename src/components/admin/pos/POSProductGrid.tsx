// src/components/admin/pos/POSProductGrid.tsx

"use client";

import { Package } from "lucide-react";
import { POSProductCard } from "./POSProductCard";
import { cn } from "@/lib/utils";
import type { ProductResponse } from "@/lib/validations/product.schema";

/* ============================================================
 * Types
 * ============================================================ */

export type POSProductGridProps = {
  products: ProductResponse[];
  isLoading?: boolean;
  onAdd: (product: ProductResponse) => void;
  className?: string;
};

/* ============================================================
 * Component
 * ============================================================ */

export function POSProductGrid({
  products,
  isLoading = false,
  onAdd,
  className,
}: POSProductGridProps) {
  if (isLoading && products.length === 0) {
    return (
      <div
        className={cn(
          "grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5",
          className,
        )}
      >
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className="aspect-[3/4] animate-pulse rounded-lg border border-brand-border bg-muted/40"
          />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="grid place-items-center rounded-lg border border-dashed border-brand-border px-6 py-16">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="grid h-12 w-12 place-items-center rounded-full bg-muted text-brand-text-secondary">
            <Package className="h-5 w-5" aria-hidden="true" />
          </div>
          <p className="text-sm font-medium text-brand-primary">
            No products found
          </p>
          <p className="max-w-xs text-xs text-brand-text-secondary">
            Try a different search term, or scan a barcode.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5",
        className,
      )}
    >
      {products.map((p) => (
        <POSProductCard key={p._id} product={p} onAdd={onAdd} />
      ))}
    </div>
  );
}

export default POSProductGrid;
