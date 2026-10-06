// src/components/admin/dashboard/DashboardLayout.tsx

"use client";

import { useState } from "react";
import {
  AlertTriangle,
  ClipboardList,
  DollarSign,
  Receipt,
  ShoppingBag,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { StatCard } from "./StatCard";
import { RevenueChart } from "./RevenueChart";
import { TopProductsCard } from "./TopProductsChart";
import { CategoryBreakdownCard } from "./CategoryBreakdown";
import { RecentOrdersCard } from "./RecentOrdersTable";
import { DateRangePicker } from "./DateRangePicker";
import {
  useAnalyticsOverview,
  useCategoryBreakdown,
  useRecentOrders,
  useRevenueSeries,
  useTopProducts,
} from "@/hooks/admin";
import { formatNumber, formatPrice } from "@/lib/admin/format";
import type { AnalyticsRange } from "@/lib/admin/analytics";

/* ============================================================
 * Component
 * ============================================================ */

export function DashboardLayout() {
  const [range, setRange] = useState<AnalyticsRange>("30d");

  const overview = useAnalyticsOverview(range);
  const revenue = useRevenueSeries(range);
  const topProducts = useTopProducts(range, 8);
  const categories = useCategoryBreakdown(range);
  const recentOrders = useRecentOrders(8);

  const current = overview.data?.current;
  const change = overview.data?.change;
  const catalog = overview.data?.catalog;
  const pending = overview.data?.pending;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Welcome to the Dorkari Jinish BD admin panel."
        breadcrumbs={[{ label: "Dashboard" }]}
        actions={<DateRangePicker value={range} onChange={setRange} />}
      />

      {/* ------------------------------------------------------
       * KPI cards — revenue, profit, orders, AOV
       * ------------------------------------------------------ */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          icon={DollarSign}
          label="Revenue"
          value={current ? formatPrice(current.revenue) : "—"}
          change={change?.revenue}
        />
        <StatCard
          icon={TrendingUp}
          label="Profit"
          value={current ? formatPrice(current.profit) : "—"}
          change={change?.profit}
          tone={current && current.profit >= 0 ? "success" : "warning"}
        />
        <StatCard
          icon={Receipt}
          label="Orders"
          value={current ? formatNumber(current.orders) : "—"}
          change={change?.orders}
        />
        <StatCard
          icon={Wallet}
          label="Avg order value"
          value={current ? formatPrice(current.avgOrderValue) : "—"}
          change={change?.avgOrderValue}
        />
      </div>

      {/* ------------------------------------------------------
       * Operational snapshot — catalog, pending
       * ------------------------------------------------------ */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          icon={ShoppingBag}
          label="Active products"
          value={catalog ? formatNumber(catalog.totalProducts) : "—"}
          sub={
            catalog ? `${catalog.outOfStockProducts} out of stock` : undefined
          }
        />
        <StatCard
          icon={AlertTriangle}
          label="Low stock"
          value={catalog ? formatNumber(catalog.lowStockProducts) : "—"}
          tone={catalog && catalog.lowStockProducts > 0 ? "warning" : "default"}
        />
        <StatCard
          icon={ClipboardList}
          label="Pending orders"
          value={pending ? formatNumber(pending.pendingOrders) : "—"}
          sub={pending ? `${pending.unpaidOrders} awaiting payment` : undefined}
        />
        <StatCard
          icon={Receipt}
          label="All-time revenue"
          value={
            overview.data ? formatPrice(overview.data.current.revenue) : "—"
          }
          sub={`In ${range === "all" ? "all time" : "current range"}`}
        />
      </div>

      {/* ------------------------------------------------------
       * Revenue chart — full width
       * ------------------------------------------------------ */}
      <RevenueChart series={revenue.data} isLoading={revenue.isLoading} />

      {/* ------------------------------------------------------
       * Two-column: top products + categories
       * ------------------------------------------------------ */}
      <div className="grid gap-4 lg:grid-cols-2">
        <TopProductsCard
          data={topProducts.data}
          isLoading={topProducts.isLoading}
        />
        <CategoryBreakdownCard
          data={categories.data}
          isLoading={categories.isLoading}
        />
      </div>

      {/* ------------------------------------------------------
       * Recent orders — full width
       * ------------------------------------------------------ */}
      <RecentOrdersCard
        data={recentOrders.data}
        isLoading={recentOrders.isLoading}
      />
    </div>
  );
}

export default DashboardLayout;
