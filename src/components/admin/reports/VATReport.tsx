// src/components/admin/reports/VATReport.tsx

// src/components/admin/reports/VatReport.tsx

"use client";

import { useState } from "react";
import Link from "next/link";
import { Info, Loader2, Receipt } from "lucide-react";
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
import { useVatReport } from "@/hooks/admin";
import { REPORT_RANGES, type ReportRange } from "@/lib/admin/reports";

/* ============================================================
 * Component
 * ============================================================ */

export function VatReport() {
  const [range, setRange] = useState<ReportRange>("30d");
  const query = useVatReport(range);

  const totals = query.data?.totals;
  const enabled = query.data?.enabled ?? false;
  const defaultRate = query.data?.defaultRate ?? 0;
  const inclusive = query.data?.inclusive ?? true;

  return (
    <div className="space-y-6">
      <PageHeader
        backHref="/admin/reports"
        title="VAT report"
        description="Tax collected per period."
        breadcrumbs={[
          { label: "Dashboard", href: "/admin" },
          { label: "Reports", href: "/admin/reports" },
          { label: "VAT" },
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

      {/* VAT disabled notice */}
      {!enabled && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <div>
            <p className="font-medium">VAT is not enabled</p>
            <p className="mt-0.5 text-xs">
              All figures below show zero VAT. Configure VAT in{" "}
              <Link
                href="/admin/settings"
                className="font-medium underline underline-offset-2"
              >
                Settings
              </Link>{" "}
              to start collecting tax on new orders.
            </p>
          </div>
        </div>
      )}

      {/* Configuration summary */}
      {enabled && (
        <div className="rounded-lg border border-brand-border bg-brand-surface px-5 py-4 text-sm">
          <p className="text-brand-text-secondary">
            Current configuration:{" "}
            <span className="font-medium text-brand-primary">
              {defaultRate}%{" "}
              {inclusive ? "VAT-inclusive" : "VAT-added at checkout"}
            </span>
          </p>
        </div>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard
          icon={Receipt}
          label="Orders"
          value={totals ? formatNumber(totals.orderCount) : "—"}
        />
        <KpiCard
          label="Subtotal"
          value={totals ? formatPrice(totals.subtotal) : "—"}
        />
        <KpiCard
          label="VAT collected"
          value={totals ? formatPrice(totals.taxTotal) : "—"}
          tone={enabled ? "success" : "muted"}
        />
        <KpiCard
          label="Total"
          value={totals ? formatPrice(totals.totalAmount) : "—"}
        />
      </div>

      {/* Bucket table */}
      <div className="overflow-hidden rounded-lg border border-brand-border bg-brand-surface">
        <header className="border-b border-brand-border px-5 py-4">
          <h2 className="font-heading text-sm font-semibold text-brand-primary">
            VAT by period
          </h2>
          <p className="mt-0.5 text-xs text-brand-text-secondary">
            {query.data?.buckets.length ?? 0} bucket
            {(query.data?.buckets.length ?? 0) === 1 ? "" : "s"}
          </p>
        </header>

        {query.isLoading && !query.data ? (
          <div className="grid place-items-center px-5 py-12">
            <Loader2
              className="h-5 w-5 animate-spin text-brand-text-secondary"
              aria-hidden="true"
            />
          </div>
        ) : !query.data || query.data.buckets.length === 0 ? (
          <div className="grid place-items-center px-5 py-12 text-center">
            <p className="text-sm text-brand-text-secondary">
              No orders in this period.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-brand-border text-left text-xs text-brand-text-secondary">
                  <th className="px-5 py-2 font-medium">Period</th>
                  <th className="px-3 py-2 text-right font-medium">Orders</th>
                  <th className="px-3 py-2 text-right font-medium">Subtotal</th>
                  <th className="px-3 py-2 text-right font-medium">VAT</th>
                  <th className="px-5 py-2 text-right font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {query.data.buckets.map((b) => (
                  <tr
                    key={b.date}
                    className="border-b border-brand-border last:border-b-0"
                  >
                    <td className="px-5 py-2.5 font-mono text-xs text-brand-primary">
                      {b.date}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums">
                      {formatNumber(b.orderCount)}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-brand-text-secondary">
                      {formatPrice(b.subtotal)}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-brand-text-secondary">
                      {formatPrice(b.taxTotal)}
                    </td>
                    <td className="px-5 py-2.5 text-right font-medium tabular-nums text-brand-primary">
                      {formatPrice(b.totalAmount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default VatReport;

/* ============================================================
 * KPI card
 * ============================================================ */

function KpiCard({
  icon: Icon,
  label,
  value,
  tone = "default",
}: {
  icon?: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  tone?: "default" | "success" | "muted";
}) {
  return (
    <div className="rounded-lg border border-brand-border bg-brand-surface px-4 py-3">
      <div className="flex items-center gap-2">
        {Icon && (
          <Icon className="h-3.5 w-3.5 text-brand-text-secondary" aria-hidden />
        )}
        <p className="text-xs uppercase tracking-wide text-brand-text-secondary">
          {label}
        </p>
      </div>
      <p
        className={cn(
          "mt-1 font-heading text-xl font-semibold tabular-nums",
          tone === "success"
            ? "text-emerald-700"
            : tone === "muted"
              ? "text-brand-text-secondary"
              : "text-brand-primary",
        )}
      >
        {value}
      </p>
    </div>
  );
}
