// src/components/admin/product/detail/ProductSalesChart.tsx

"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/admin/format";
import type { ProductStats, ProductStatsBucket } from "@/lib/admin/api";

/* ============================================================
 * Types
 * ============================================================ */

export type ProductSalesChartProps = {
  stats: ProductStats;
  className?: string;
};

type Metric = "revenue" | "unitsSold" | "profit";

/* ============================================================
 * Component
 * ============================================================ */

export function ProductSalesChart({
  stats,
  className,
}: ProductSalesChartProps) {
  const { buckets, bucketGranularity } = stats;

  const max = useMemo(() => {
    if (buckets.length === 0) return 0;
    let m = 0;
    for (const b of buckets) if (b.revenue > m) m = b.revenue;
    return m;
  }, [buckets]);

  const total = useMemo(
    () => buckets.reduce((acc, b) => acc + b.revenue, 0),
    [buckets],
  );

  if (buckets.length === 0) {
    return (
      <div
        className={cn(
          "rounded-lg border border-brand-border bg-brand-surface p-6 text-center",
          className,
        )}
      >
        <p className="text-sm text-brand-text-secondary">
          No sales data for this range yet.
        </p>
      </div>
    );
  }

  const hasAnyData = max > 0;

  return (
    <div
      className={cn(
        "rounded-lg border border-brand-border bg-brand-surface p-5",
        className,
      )}
    >
      <header className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-heading text-sm font-semibold text-brand-primary">
            Revenue over time
          </h2>
          <p className="mt-0.5 text-xs text-brand-text-secondary">
            {bucketGranularity === "daily" ? "Daily" : "Monthly"} ·{" "}
            {buckets.length} data point{buckets.length === 1 ? "" : "s"} ·{" "}
            {formatPrice(total)} total
          </p>
        </div>
      </header>

      {!hasAnyData ? (
        <div className="grid place-items-center py-12 text-center">
          <p className="text-sm text-brand-text-secondary">
            No revenue in this range.
          </p>
        </div>
      ) : (
        <div className="flex h-48 items-stretch gap-1">
          {buckets.map((b) => (
            <Bar
              key={b.date}
              bucket={b}
              max={max}
              granularity={bucketGranularity}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default ProductSalesChart;

/* ============================================================
 * Bar
 * ============================================================ */

function Bar({
  bucket,
  max,
  granularity,
}: {
  bucket: ProductStatsBucket;
  max: number;
  granularity: "daily" | "monthly";
}) {
  const pct = max > 0 ? (bucket.revenue / max) * 100 : 0;
  const positive = bucket.revenue > 0;

  const label =
    granularity === "daily" ? shortDay(bucket.date) : shortMonth(bucket.date);

  return (
    <div className="group relative flex flex-1 flex-col items-center justify-end">
      {/* Tooltip */}
      <div className="pointer-events-none absolute bottom-full mb-1 hidden whitespace-nowrap rounded-md border border-brand-border bg-popover px-2 py-1 text-[10px] shadow-lg group-hover:block">
        <p className="font-medium text-brand-primary">
          {formatPrice(bucket.revenue)}
        </p>
        <p className="text-brand-text-secondary">
          {bucket.unitsSold} unit{bucket.unitsSold === 1 ? "" : "s"}
        </p>
      </div>

      {/* Bar */}
      <div
        className={cn(
          "w-full rounded-t-sm transition-colors",
          positive
            ? "bg-brand-accent group-hover:bg-brand-accent-hover"
            : "bg-muted",
        )}
        style={{ height: `${Math.max(2, pct)}%` }}
        aria-label={`${label}: ${formatPrice(bucket.revenue)}`}
      />

      {/* Label — only for small datasets */}
      {granularity === "monthly" && (
        <span className="mt-1.5 text-[10px] tabular-nums text-brand-text-secondary">
          {label}
        </span>
      )}
    </div>
  );
}

/* ============================================================
 * Date formatting
 * ============================================================ */

function shortDay(iso: string): string {
  const parts = iso.split("-");
  if (parts.length < 3) return iso;
  return `${parts[2]}/${parts[1]}`;
}

function shortMonth(iso: string): string {
  const [year, month] = iso.split("-");
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const m = parseInt(month, 10) - 1;
  if (m < 0 || m > 11) return iso;
  return `${monthNames[m]} ${year.slice(2)}`;
}
