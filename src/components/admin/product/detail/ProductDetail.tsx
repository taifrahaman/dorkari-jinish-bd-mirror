// src/components/admin/product/detail/ProductDetail.tsx

"use client";

import { useState } from "react";
import Image from "next/image";
import { Loader2, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useProduct, useProductStats } from "@/hooks/admin";
import {
  PRODUCT_STATS_RANGES,
  type ProductStatsRange,
} from "@/lib/admin/product-stats";
import { ProductDetailHeader } from "./ProductDetailHeader";
import { ProductEconomics } from "./ProductEconomics";
import { ProductSalesStats } from "./ProductSalesStats";
import { ProductSalesChart } from "./ProductSalesChart";
import { ProductRecentOrders } from "./ProductRecentOrders";
import { ProductCostHistory } from "./ProductCostHistory";

/* ============================================================
 * Types
 * ============================================================ */

export type ProductDetailProps = {
  productId: string;
};

/* ============================================================
 * Component
 * ============================================================ */

export function ProductDetail({ productId }: ProductDetailProps) {
  const [range, setRange] = useState<ProductStatsRange>("30d");

  const productQuery = useProduct(productId);
  const statsQuery = useProductStats(productId, range);

  /* ----------------------------------------------------------
   * Loading
   * ---------------------------------------------------------- */

  if (productQuery.isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center gap-2 text-sm text-brand-text-secondary">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        Loading product…
      </div>
    );
  }

  /* ----------------------------------------------------------
   * Not found / error
   * ---------------------------------------------------------- */

  if (productQuery.isError || !productQuery.data) {
    return (
      <div className="space-y-4">
        <div
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {productQuery.error instanceof Error
            ? productQuery.error.message
            : "Failed to load this product."}
        </div>
      </div>
    );
  }

  const product = productQuery.data;

  return (
    <div className="space-y-6">
      <ProductDetailHeader product={product} />

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Left column */}
        <div className="space-y-6">
          {/* Images */}
          <ImagesCard images={product.images} name={product.name.en} />

          {/* Range picker + KPIs */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-heading text-sm font-semibold text-brand-primary">
                Sales
              </h2>
              <Select
                value={range}
                onValueChange={(v) => setRange(v as ProductStatsRange)}
              >
                <SelectTrigger
                  className="h-8 w-37.5 text-xs"
                  aria-label="Date range"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRODUCT_STATS_RANGES.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {statsQuery.isLoading ? (
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-20 animate-pulse rounded-lg border border-brand-border bg-muted/40"
                  />
                ))}
              </div>
            ) : statsQuery.data ? (
              <ProductSalesStats stats={statsQuery.data} />
            ) : null}
          </div>

          {/* Chart */}
          {statsQuery.data && <ProductSalesChart stats={statsQuery.data} />}

          {/* Recent orders */}
          {statsQuery.data && <ProductRecentOrders stats={statsQuery.data} />}
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {statsQuery.data && <ProductEconomics stats={statsQuery.data} />}
          <ProductCostHistory
            history={product.costHistory ?? []}
            currentCost={product.costPrice ?? null}
          />
        </div>
      </div>
    </div>
  );
}

export default ProductDetail;

/* ============================================================
 * Images card
 * ============================================================ */

function ImagesCard({
  images,
  name,
}: {
  images: Array<{ url: string; publicId: string; alt?: string }>;
  name: string;
}) {
  if (images.length === 0) {
    return (
      <div className="grid place-items-center rounded-lg border border-brand-border bg-muted/30 py-12">
        <div className="flex flex-col items-center gap-2">
          <div className="grid h-12 w-12 place-items-center rounded-full bg-brand-surface text-brand-text-secondary">
            <Package className="h-5 w-5" aria-hidden="true" />
          </div>
          <p className="text-sm text-brand-text-secondary">
            No images uploaded yet
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-brand-border bg-brand-surface p-3">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {images.map((img, i) => (
          <div
            key={img.publicId}
            className={cn(
              "group relative aspect-square overflow-hidden rounded-md border border-brand-border bg-muted",
              i === 0 && "col-span-2 row-span-2 sm:col-span-2 sm:row-span-2",
            )}
          >
            <Image
              src={img.url}
              alt={img.alt || name}
              fill
              sizes="(max-width: 640px) 50vw, 25vw"
              className="object-cover"
            />
            {i === 0 && (
              <div className="pointer-events-none absolute left-1.5 top-1.5 rounded-full bg-brand-accent px-2 py-0.5 text-[10px] font-semibold text-brand-primary shadow">
                Primary
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
