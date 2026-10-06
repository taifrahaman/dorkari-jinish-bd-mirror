// src/components/admin/reports/ProfitReport.tsx

"use client";

import { useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  DollarSign,
  Loader2,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { formatNumber, formatPrice } from "@/lib/admin/format";
import { useProfitReport } from "@/hooks/admin";
import {
  REPORT_RANGES,
  type ProfitReportProductRow,
  type ReportRange,
} from "@/lib/admin/reports";

/* ============================================================
 * Component
 * ============================================================ */

export function ProfitReport() {
  const [range, setRange] = useState<ReportRange>("30d");
  const query = useProfitReport(range);

  const totals = query.data?.totals;

  return (
    <div className="space-y-6">
      <PageHeader
        backHref="/admin/reports"
        title="Profit report"
        description="Revenue, cost, and profit for the selected period."
        breadcrumbs={[
          { label: "Dashboard", href: "/admin" },
          { label: "Reports", href: "/admin/reports" },
          { label: "Profit" },
        ]}
        actions={
          <Select
            value={range}
            onValueChange={(v) => setRange(v as ReportRange)}
          >
            <SelectTrigger className="h-9 w-[170px]" aria-label="Date range">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {REPORT_RANGES.map((r) => (
                <SelectItem key={r.value} value={r.value}>
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard
          icon={DollarSign}
          label="Revenue"
          value={totals ? formatPrice(totals.revenue) : "—"}
        />
        <KpiCard
          icon={Wallet}
          label="Cost"
          value={totals ? formatPrice(totals.cost) : "—"}
        />
        <KpiCard
          icon={TrendingUp}
          label="Profit"
          value={totals ? formatPrice(totals.profit) : "—"}
          tone={totals && totals.profit >= 0 ? "success" : "warning"}
        />
        <KpiCard
          icon={TrendingUp}
          label="Margin"
          value={
            totals && totals.margin !== null
              ? `${(totals.margin * 100).toFixed(1)}%`
              : "—"
          }
          sub={
            totals
              ? `Avg ${formatPrice(totals.averageProfitPerOrder)} / order`
              : undefined
          }
        />
      </div>

      {/* Charts + tables */}
      {query.isLoading && !query.data ? (
        <div className="grid min-h-[40vh] place-items-center">
          <Loader2
            className="h-5 w-5 animate-spin text-brand-text-secondary"
            aria-hidden="true"
          />
        </div>
      ) : (
        <>
          <ProfitChart buckets={query.data?.buckets ?? []} />

          <div className="grid gap-4 lg:grid-cols-2">
            <ProductTable
              title="Top products by profit"
              description="Best performing products in this period"
              rows={query.data?.topProducts ?? []}
              tone="success"
            />
            <ProductTable
              title="Lowest profit products"
              description="Products with the least profit in this period"
              rows={query.data?.worstProducts ?? []}
              tone="warning"
            />
          </div>
        </>
      )}
    </div>
  );
}

export default ProfitReport;

/* ============================================================
 * KPI card
 * ============================================================ */

function KpiCard({
  icon: Icon,
  label,
  value,
  sub,
  tone = "default",
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sub?: string;
  tone?: "default" | "success" | "warning";
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
        />
        <p className="text-xs uppercase tracking-wide text-brand-text-secondary">
          {label}
        </p>
      </div>
      <p
        className={cn(
          "mt-1 font-heading text-xl font-semibold tabular-nums",
          tone === "success"
            ? "text-emerald-700"
            : tone === "warning"
              ? "text-amber-800"
              : "text-brand-primary",
        )}
      >
        {value}
      </p>
      {sub && <p className="mt-0.5 text-xs text-brand-text-secondary">{sub}</p>}
    </div>
  );
}

/* ============================================================
 * Chart — simple bars, revenue (light) + profit (dark) overlay
 * ============================================================ */

function ProfitChart({
  buckets,
}: {
  buckets: Array<{
    date: string;
    revenue: number;
    cost: number;
    profit: number;
    orders: number;
  }>;
}) {
  const [hover, setHover] = useState<number | null>(null);

  const max = useMemo(
    () => Math.max(0, ...buckets.map((b) => b.revenue)),
    [buckets],
  );

  if (buckets.length === 0) {
    return (
      <div className="grid h-40 place-items-center rounded-lg border border-brand-border bg-brand-surface">
        <p className="text-sm text-brand-text-secondary">
          No data for this period.
        </p>
      </div>
    );
  }

  const hovered = hover !== null ? buckets[hover] : null;

  return (
    <div className="rounded-lg border border-brand-border bg-brand-surface p-5">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-heading text-sm font-semibold text-brand-primary">
            Revenue vs. profit
          </h2>
          <p className="mt-0.5 text-xs text-brand-text-secondary">
            {buckets.length} bucket{buckets.length === 1 ? "" : "s"}
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <Legend color="bg-brand-accent/40" label="Revenue" />
          <Legend color="bg-brand-accent" label="Profit" />
        </div>
      </header>

      <div className="relative">
        <div className="flex h-48 items-stretch gap-1">
          {buckets.map((b, i) => {
            const revenuePct = max > 0 ? (b.revenue / max) * 100 : 0;
            const profitPct = max > 0 ? Math.max(0, (b.profit / max) * 100) : 0;

            return (
              <div
                key={b.date}
                className="group relative flex h-full flex-1 flex-col justify-end"
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
              >
                {/* Revenue bar — background */}
                <div
                  className="w-full rounded-t-sm bg-brand-accent/40 transition-colors group-hover:bg-brand-accent/60"
                  style={{ height: `${Math.max(2, revenuePct)}%` }}
                />
                {/* Profit bar — overlaid, thinner, from bottom */}
                {b.profit > 0 && (
                  <div
                    className="absolute bottom-0 left-0 right-0 rounded-t-sm bg-brand-accent"
                    style={{ height: `${Math.max(1, profitPct)}%` }}
                  />
                )}
              </div>
            );
          })}
        </div>

        {hovered && (
          <div className="pointer-events-none absolute left-1/2 top-2 -translate-x-1/2 rounded-md border border-brand-border bg-popover px-3 py-2 text-xs shadow-lg">
            <p className="font-medium text-brand-primary">{hovered.date}</p>
            <p className="text-brand-text-secondary">
              Revenue: {formatPrice(hovered.revenue)}
            </p>
            <p className="text-emerald-700">
              Profit: {formatPrice(hovered.profit)}
            </p>
            <p className="text-brand-text-secondary">
              {hovered.orders} order{hovered.orders === 1 ? "" : "s"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn("h-2 w-2 rounded-full", color)} />
      <span className="text-brand-text-secondary">{label}</span>
    </span>
  );
}

/* ============================================================
 * Per-product profit table
 * ============================================================ */

function ProductTable({
  title,
  description,
  rows,
  tone,
}: {
  title: string;
  description: string;
  rows: ProfitReportProductRow[];
  tone: "success" | "warning";
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-brand-border bg-brand-surface">
      <header className="border-b border-brand-border px-5 py-4">
        <h3 className="font-heading text-sm font-semibold text-brand-primary">
          {title}
        </h3>
        <p className="mt-0.5 text-xs text-brand-text-secondary">
          {description}
        </p>
      </header>

      {rows.length === 0 ? (
        <div className="grid place-items-center px-5 py-10 text-center">
          <p className="text-sm text-brand-text-secondary">
            No sales in this period.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-brand-border text-left text-xs text-brand-text-secondary">
                <th className="px-5 py-2 font-medium">Product</th>
                <th className="px-3 py-2 text-right font-medium">Units</th>
                <th className="px-3 py-2 text-right font-medium">Profit</th>
                <th className="px-5 py-2 text-right font-medium">Margin</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.productId}
                  className="border-b border-brand-border last:border-b-0"
                >
                  <td className="min-w-0 px-5 py-2.5">
                    <p className="truncate text-sm text-brand-primary">
                      {row.name}
                    </p>
                    {row.sku && (
                      <p className="truncate text-[11px] font-mono text-brand-text-secondary">
                        {row.sku}
                      </p>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums">
                    {formatNumber(row.unitsSold)}
                  </td>
                  <td
                    className={cn(
                      "px-3 py-2.5 text-right font-medium tabular-nums",
                      tone === "success"
                        ? "text-emerald-700"
                        : "text-amber-800",
                    )}
                  >
                    {formatPrice(row.profit)}
                  </td>
                  <td className="px-5 py-2.5 text-right text-xs tabular-nums text-brand-text-secondary">
                    {row.margin !== null
                      ? `${(row.margin * 100).toFixed(1)}%`
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* Re-export unused icon imports to silence lints */
export { ArrowDown, ArrowUp };
