// src/components/admin/product/detail/ProductSalesStats.tsx

"use client";

import { Package, Receipt, TrendingUp, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatNumber, formatPrice } from "@/lib/admin/format";
import type { ProductStats } from "@/lib/admin/api";

/* ============================================================
 * Types
 * ============================================================ */

export type ProductSalesStatsProps = {
  stats: ProductStats;
  className?: string;
};

/* ============================================================
 * Component
 * ============================================================ */

export function ProductSalesStats({
  stats,
  className,
}: ProductSalesStatsProps) {
  const { totals } = stats;

  return (
    <div className={cn("grid grid-cols-2 gap-3 lg:grid-cols-4", className)}>
      <StatCard
        icon={Package}
        label="Units sold"
        value={formatNumber(totals.unitsSold)}
        tone="default"
      />
      <StatCard
        icon={Receipt}
        label="Orders"
        value={formatNumber(totals.orderCount)}
        tone="default"
      />
      <StatCard
        icon={Wallet}
        label="Revenue"
        value={formatPrice(totals.revenue)}
        tone="default"
      />
      <StatCard
        icon={TrendingUp}
        label="Profit"
        value={formatPrice(totals.profit)}
        tone={totals.profit >= 0 ? "success" : "warning"}
      />
    </div>
  );
}

export default ProductSalesStats;

/* ============================================================
 * Stat card
 * ============================================================ */

function StatCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  label: string;
  value: string;
  tone: "default" | "success" | "warning";
}) {
  return (
    <div className="rounded-lg border border-brand-border bg-brand-surface px-4 py-3">
      <div className="flex items-center gap-2">
        <Icon
          className={cn(
            "h-3.5 w-3.5",
            tone === "success"
              ? "text-emerald-600"
              : tone === "warning"
                ? "text-amber-600"
                : "text-brand-text-secondary",
          )}
          aria-hidden
        />
        <p className="text-xs uppercase tracking-wide text-brand-text-secondary">
          {label}
        </p>
      </div>
      <p
        className={cn(
          "mt-1 font-heading text-lg font-semibold tabular-nums",
          tone === "success"
            ? "text-emerald-700"
            : tone === "warning"
              ? "text-amber-800"
              : "text-brand-primary",
        )}
      >
        {value}
      </p>
    </div>
  );
}
