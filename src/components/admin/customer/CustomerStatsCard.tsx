// src/components/admin/customer/CustomerStatsCard.tsx

"use client";

import { Receipt, TrendingUp, Wallet, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatNumber, formatPrice, formatRelative } from "@/lib/admin/format";
import type { CustomerStats } from "@/lib/validations/customer.schema";

/* ============================================================
 * Types
 * ============================================================ */

export type CustomerStatsCardProps = {
  stats: CustomerStats | undefined;
  isLoading?: boolean;
  className?: string;
};

/* ============================================================
 * Component
 * ============================================================ */

export function CustomerStatsCard({
  stats,
  isLoading = false,
  className,
}: CustomerStatsCardProps) {
  if (isLoading || !stats) {
    return (
      <div className={cn("grid grid-cols-2 gap-3 lg:grid-cols-4", className)}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-20 animate-pulse rounded-lg border border-brand-border bg-muted/40"
          />
        ))}
      </div>
    );
  }

  const { totals, lastOrderAt } = stats;

  return (
    <div className={cn("grid grid-cols-2 gap-3 lg:grid-cols-4", className)}>
      <StatCard
        icon={Receipt}
        label="Orders"
        value={formatNumber(totals.orderCount)}
      />
      <StatCard
        icon={Wallet}
        label="Lifetime value"
        value={formatPrice(totals.lifetimeValue)}
      />
      <StatCard
        icon={TrendingUp}
        label="Avg order"
        value={formatPrice(totals.averageOrderValue)}
      />
      <StatCard
        icon={Calendar}
        label="Last order"
        value={lastOrderAt ? formatRelative(lastOrderAt) : "—"}
      />
    </div>
  );
}

export default CustomerStatsCard;

/* ============================================================
 * Stat card
 * ============================================================ */

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-brand-border bg-brand-surface px-4 py-3">
      <div className="flex items-center gap-2">
        <Icon
          className="h-3.5 w-3.5 text-brand-text-secondary"
          aria-hidden="true"
        />
        <p className="text-xs uppercase tracking-wide text-brand-text-secondary">
          {label}
        </p>
      </div>
      <p className="mt-1 font-heading text-lg font-semibold tabular-nums text-brand-primary">
        {value}
      </p>
    </div>
  );
}
