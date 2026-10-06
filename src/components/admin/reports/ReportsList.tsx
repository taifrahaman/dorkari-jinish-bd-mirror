// src/components/admin/reports/ReportsList.tsx

"use client";

import Link from "next/link";
import { BarChart3, ClipboardList, Receipt, TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { cn } from "@/lib/utils";

/* ============================================================
 * Report definitions
 * ============================================================ */

type ReportDef = {
  href: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
};

const REPORTS: ReportDef[] = [
  {
    href: "/admin/reports/profit",
    title: "Profit report",
    description:
      "Revenue, cost, and profit over time with top/worst performing products.",
    icon: TrendingUp,
  },
  {
    href: "/admin/reports/inventory",
    title: "Inventory report",
    description:
      "Stock levels, cost valuation, and low/out-of-stock products at a glance.",
    icon: ClipboardList,
  },
  {
    href: "/admin/reports/vat",
    title: "VAT report",
    description:
      "Tax collected per period. Requires VAT to be enabled in Settings.",
    icon: Receipt,
  },
];

/* ============================================================
 * Component
 * ============================================================ */

export function ReportsList() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description="Exportable business reports built from your order and inventory data."
        breadcrumbs={[
          { label: "Dashboard", href: "/admin" },
          { label: "Reports" },
        ]}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {REPORTS.map((report) => (
          <ReportCard key={report.href} report={report} />
        ))}
      </div>
    </div>
  );
}

export default ReportsList;

/* ============================================================
 * Card
 * ============================================================ */

function ReportCard({ report }: { report: ReportDef }) {
  const Icon = report.icon;

  return (
    <Link
      href={report.href}
      className={cn(
        "group flex flex-col gap-3 rounded-lg border border-brand-border bg-brand-surface p-5 transition-all",
        "hover:border-brand-accent/40 hover:shadow-sm",
      )}
    >
      <div className="grid h-10 w-10 place-items-center rounded-full bg-brand-accent-light text-brand-primary transition-colors group-hover:bg-brand-accent/20">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </div>

      <div>
        <h3 className="font-heading text-sm font-semibold text-brand-primary">
          {report.title}
        </h3>
        <p className="mt-1 text-xs text-brand-text-secondary">
          {report.description}
        </p>
      </div>

      <div className="mt-auto flex items-center gap-1 text-xs font-medium text-brand-primary opacity-0 transition-opacity group-hover:opacity-100">
        View report
        <BarChart3 className="h-3 w-3" aria-hidden="true" />
      </div>
    </Link>
  );
}
