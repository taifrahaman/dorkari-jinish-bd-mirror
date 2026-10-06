// src/components/admin/dashboard/TopProductsChart.tsx

// src/components/admin/dashboard/TopProductsCard.tsx

"use client";

import Link from "next/link";
import Image from "next/image";
import { Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/admin/format";
import type { TopProductsResult } from "@/lib/admin/analytics";

/* ============================================================
 * Types
 * ============================================================ */

export type TopProductsCardProps = {
  data: TopProductsResult | undefined;
  isLoading?: boolean;
  className?: string;
};

/* ============================================================
 * Component
 * ============================================================ */

export function TopProductsCard({
  data,
  isLoading = false,
  className,
}: TopProductsCardProps) {
  const rows = data?.rows ?? [];
  const maxRevenue = rows[0]?.revenue ?? 0;

  return (
    <div
      className={cn(
        "rounded-lg border border-brand-border bg-brand-surface",
        className,
      )}
    >
      <header className="border-b border-brand-border px-5 py-4">
        <h2 className="font-heading text-sm font-semibold text-brand-primary">
          Top products
        </h2>
        <p className="mt-0.5 text-xs text-brand-text-secondary">
          By revenue in the selected range
        </p>
      </header>

      {isLoading && rows.length === 0 ? (
        <div className="space-y-3 p-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-12 animate-pulse rounded-md bg-muted/50"
            />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="grid place-items-center px-5 py-12 text-center">
          <div className="flex flex-col items-center gap-2">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-muted text-brand-text-secondary">
              <Package className="h-4 w-4" aria-hidden="true" />
            </div>
            <p className="text-sm text-brand-text-secondary">
              No sales in this range.
            </p>
          </div>
        </div>
      ) : (
        <ol className="divide-y divide-brand-border">
          {rows.map((row, i) => (
            <li key={row.productId}>
              <Link
                href={`/admin/products/${row.productId}`}
                className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-muted/40"
              >
                <span className="w-5 shrink-0 text-xs tabular-nums text-brand-text-secondary">
                  {i + 1}
                </span>

                <div className="h-9 w-9 shrink-0 overflow-hidden rounded-md border border-brand-border bg-muted">
                  {row.imageUrl ? (
                    <Image
                      src={row.imageUrl}
                      alt={row.name}
                      width={36}
                      height={36}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="grid h-full w-full place-items-center text-brand-text-secondary">
                      <Package className="h-3.5 w-3.5" aria-hidden="true" />
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-brand-primary">
                    {row.name}
                  </p>
                  <div className="mt-0.5 flex items-center gap-2 text-xs text-brand-text-secondary">
                    <span className="tabular-nums">
                      {row.unitsSold} unit{row.unitsSold === 1 ? "" : "s"}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="tabular-nums">
                      {formatPrice(row.profit)} profit
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-brand-accent"
                      style={{
                        width: `${maxRevenue > 0 ? (row.revenue / maxRevenue) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>

                <span className="shrink-0 text-sm font-medium tabular-nums text-brand-primary">
                  {formatPrice(row.revenue)}
                </span>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

export default TopProductsCard;
