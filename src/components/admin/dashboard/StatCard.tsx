// src/components/admin/dashboard/StatCard.tsx

"use client";

import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/* ============================================================
 * Types
 * ============================================================ */

export type StatCardProps = {
  label: string;
  value: string;
  icon?: LucideIcon;
  /** Percentage change vs previous period. Null → no badge. */
  change?: number | null;
  /** Optional small caption under the value. */
  sub?: string;
  tone?: "default" | "success" | "warning" | "destructive";
  className?: string;
};

/* ============================================================
 * Component
 * ============================================================ */

export function StatCard({
  label,
  value,
  icon: Icon,
  change,
  sub,
  tone = "default",
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-brand-border bg-brand-surface px-4 py-3",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {Icon && (
            <Icon
              className="h-3.5 w-3.5 text-brand-text-secondary"
              aria-hidden
            />
          )}
          <p className="text-xs uppercase tracking-wide text-brand-text-secondary">
            {label}
          </p>
        </div>

        {change !== undefined && change !== null && (
          <ChangeBadge change={change} />
        )}
      </div>

      <p
        className={cn(
          "mt-1.5 font-heading text-xl font-semibold tabular-nums",
          tone === "success"
            ? "text-emerald-700"
            : tone === "warning"
              ? "text-amber-800"
              : tone === "destructive"
                ? "text-destructive"
                : "text-brand-primary",
        )}
      >
        {value}
      </p>

      {sub && <p className="mt-0.5 text-xs text-brand-text-secondary">{sub}</p>}
    </div>
  );
}

export default StatCard;

/* ============================================================
 * Change badge
 * ============================================================ */

function ChangeBadge({ change }: { change: number }) {
  const isFlat = Math.abs(change) < 0.5;
  const positive = change > 0;

  const Icon = isFlat ? Minus : positive ? ArrowUp : ArrowDown;

  const tone = isFlat
    ? "border-brand-border bg-muted text-brand-text-secondary"
    : positive
      ? "border-emerald-300 bg-emerald-50 text-emerald-700"
      : "border-destructive/30 bg-destructive/10 text-destructive";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-medium tabular-nums",
        tone,
      )}
      title="vs previous period"
    >
      <Icon className="h-3 w-3" aria-hidden="true" />
      {isFlat ? "flat" : `${Math.abs(change).toFixed(1)}%`}
    </span>
  );
}
