// src/components/admin/reports/InventoryReport.tsx

"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ClipboardList,
  Loader2,
  Package,
  PackageX,
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
import { useInventoryReport } from "@/hooks/admin";
import {
  INVENTORY_STATUS_OPTIONS,
  type InventoryStatus,
} from "@/lib/admin/reports";

/* ============================================================
 * Component
 * ============================================================ */

export function InventoryReport() {
  const [status, setStatus] = useState<InventoryStatus>("all");
  const query = useInventoryReport(status);

  const summary = query.data?.summary;
  const rows = query.data?.rows ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        backHref="/admin/reports"
        title="Inventory report"
        description="Stock levels, valuation, and low-stock alerts."
        breadcrumbs={[
          { label: "Dashboard", href: "/admin" },
          { label: "Reports", href: "/admin/reports" },
          { label: "Inventory" },
        ]}
        actions={
          <Select
            value={status}
            onValueChange={(v) => setStatus(v as InventoryStatus)}
          >
            <SelectTrigger className="h-9 w-[170px]" aria-label="Stock filter">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {INVENTORY_STATUS_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <SummaryCard
          icon={Package}
          label="Total products"
          value={summary ? formatNumber(summary.totalProducts) : "—"}
          sub={
            summary
              ? `${formatNumber(summary.totalUnits)} units on hand`
              : undefined
          }
        />
        <SummaryCard
          icon={AlertTriangle}
          label="Low stock"
          value={summary ? formatNumber(summary.lowStockCount) : "—"}
          tone={summary && summary.lowStockCount > 0 ? "warning" : "default"}
        />
        <SummaryCard
          icon={PackageX}
          label="Out of stock"
          value={summary ? formatNumber(summary.outOfStockCount) : "—"}
          tone={
            summary && summary.outOfStockCount > 0 ? "destructive" : "default"
          }
        />
        <SummaryCard
          icon={ClipboardList}
          label="Retail value"
          value={summary ? formatPrice(summary.totalRetailValue) : "—"}
          sub={
            summary
              ? `${formatPrice(summary.totalCostValue)} at cost`
              : undefined
          }
        />
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-brand-border bg-brand-surface">
        <header className="flex items-center justify-between border-b border-brand-border px-5 py-4">
          <div>
            <h2 className="font-heading text-sm font-semibold text-brand-primary">
              Products
            </h2>
            <p className="mt-0.5 text-xs text-brand-text-secondary">
              {rows.length} product{rows.length === 1 ? "" : "s"}
            </p>
          </div>
          {summary && (
            <p className="text-xs text-brand-text-secondary">
              Potential profit:{" "}
              <span className="font-medium text-emerald-700 tabular-nums">
                {formatPrice(summary.totalPotentialProfit)}
              </span>
            </p>
          )}
        </header>

        {query.isLoading && rows.length === 0 ? (
          <div className="grid place-items-center px-5 py-12">
            <Loader2
              className="h-5 w-5 animate-spin text-brand-text-secondary"
              aria-hidden="true"
            />
          </div>
        ) : rows.length === 0 ? (
          <div className="grid place-items-center px-5 py-12 text-center">
            <div className="flex flex-col items-center gap-2">
              <div className="grid h-10 w-10 place-items-center rounded-full bg-muted text-brand-text-secondary">
                <Package className="h-4 w-4" aria-hidden="true" />
              </div>
              <p className="text-sm text-brand-text-secondary">
                No products match this filter.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-brand-border text-left text-xs text-brand-text-secondary">
                  <th className="px-5 py-2 font-medium">Product</th>
                  <th className="px-3 py-2 font-medium">Category</th>
                  <th className="px-3 py-2 text-right font-medium">Stock</th>
                  <th className="px-3 py-2 text-right font-medium">
                    Cost value
                  </th>
                  <th className="px-3 py-2 text-right font-medium">
                    Retail value
                  </th>
                  <th className="px-5 py-2 text-right font-medium">
                    Potential profit
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.productId}
                    className="border-b border-brand-border last:border-b-0 hover:bg-muted/40"
                  >
                    <td className="min-w-0 px-5 py-2.5">
                      <Link
                        href={`/admin/products/${row.productId}`}
                        className="block truncate text-sm text-brand-primary hover:underline"
                      >
                        {row.name}
                      </Link>
                      {row.sku && (
                        <p className="truncate text-[11px] font-mono text-brand-text-secondary">
                          {row.sku}
                        </p>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-xs text-brand-text-secondary">
                      {row.categoryName}
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <StockBadge
                        stock={row.stock}
                        threshold={row.lowStockThreshold}
                      />
                    </td>
                    <td className="px-3 py-2.5 text-right text-xs tabular-nums text-brand-text-secondary">
                      {row.costValue !== null
                        ? formatPrice(row.costValue)
                        : "—"}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-brand-primary">
                      {formatPrice(row.retailValue)}
                    </td>
                    <td className="px-5 py-2.5 text-right text-xs font-medium tabular-nums text-emerald-700">
                      {row.potentialProfit !== null
                        ? formatPrice(row.potentialProfit)
                        : "—"}
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

export default InventoryReport;

/* ============================================================
 * Summary card
 * ============================================================ */

function SummaryCard({
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
  tone?: "default" | "warning" | "destructive";
}) {
  return (
    <div className="rounded-lg border border-brand-border bg-brand-surface px-4 py-3">
      <div className="flex items-center gap-2">
        <Icon
          className={cn(
            "h-3.5 w-3.5",
            tone === "warning"
              ? "text-amber-600"
              : tone === "destructive"
                ? "text-destructive"
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
          tone === "warning"
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

/* ============================================================
 * Stock badge
 * ============================================================ */

function StockBadge({
  stock,
  threshold,
}: {
  stock: number;
  threshold: number;
}) {
  const level: "out" | "low" | "in" =
    stock === 0 ? "out" : stock <= threshold ? "low" : "in";

  const tone =
    level === "out"
      ? "border-destructive/30 bg-destructive/10 text-destructive"
      : level === "low"
        ? "border-amber-300 bg-amber-50 text-amber-700"
        : "border-brand-border bg-muted text-brand-text-secondary";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium tabular-nums",
        tone,
      )}
    >
      {stock}
    </span>
  );
}
