// src/services/analytics.service.ts

import mongoose from "mongoose";
import Order from "@/models/Order.model";
import Product from "@/models/Product.model";
import Category from "@/models/Category.model";
import { LOW_STOCK_THRESHOLD } from "@/lib/validations/product.schema";
import type {
  AnalyticsOverview,
  AnalyticsRange,
  CategoryBreakdownResult,
  CategoryBreakdownRow,
  KpiBundle,
  KpiChange,
  RecentOrderRow,
  RecentOrdersResult,
  RevenuePoint,
  RevenueSeries,
  RevenueSeriesGranularity,
  TopProductRow,
  TopProductsResult,
} from "@/lib/admin/analytics";

/* ============================================================
 * Status constants — typed as tuples for Mongoose
 * ============================================================ */

const NON_SALES_STATUSES = ["cancelled", "returned"] as const;
const PENDING_ORDER_STATUSES = ["pending", "confirmed", "processing"] as const;
const UNPAID_PAYMENT_STATUSES = ["pending", "partial"] as const;

/* ============================================================
 * Range resolution
 * ============================================================ */

type ResolvedRange = {
  from: Date | null;
  to: Date;
  previousFrom: Date | null;
  previousTo: Date | null;
  granularity: RevenueSeriesGranularity;
};

function resolveRange(range: AnalyticsRange): ResolvedRange {
  const to = new Date();
  const from = new Date();

  switch (range) {
    case "today": {
      from.setHours(0, 0, 0, 0);
      const prevTo = new Date(from);
      prevTo.setMilliseconds(-1);
      const prevFrom = new Date(prevTo);
      prevFrom.setHours(0, 0, 0, 0);
      return {
        from,
        to,
        previousFrom: prevFrom,
        previousTo: prevTo,
        granularity: "hourly",
      };
    }
    case "7d": {
      from.setDate(from.getDate() - 6);
      from.setHours(0, 0, 0, 0);
      const prevTo = new Date(from);
      prevTo.setMilliseconds(-1);
      const prevFrom = new Date(prevTo);
      prevFrom.setDate(prevFrom.getDate() - 6);
      prevFrom.setHours(0, 0, 0, 0);
      return {
        from,
        to,
        previousFrom: prevFrom,
        previousTo: prevTo,
        granularity: "daily",
      };
    }
    case "30d": {
      from.setDate(from.getDate() - 29);
      from.setHours(0, 0, 0, 0);
      const prevTo = new Date(from);
      prevTo.setMilliseconds(-1);
      const prevFrom = new Date(prevTo);
      prevFrom.setDate(prevFrom.getDate() - 29);
      prevFrom.setHours(0, 0, 0, 0);
      return {
        from,
        to,
        previousFrom: prevFrom,
        previousTo: prevTo,
        granularity: "daily",
      };
    }
    case "90d": {
      from.setDate(from.getDate() - 89);
      from.setHours(0, 0, 0, 0);
      const prevTo = new Date(from);
      prevTo.setMilliseconds(-1);
      const prevFrom = new Date(prevTo);
      prevFrom.setDate(prevFrom.getDate() - 89);
      prevFrom.setHours(0, 0, 0, 0);
      return {
        from,
        to,
        previousFrom: prevFrom,
        previousTo: prevTo,
        granularity: "weekly",
      };
    }
    case "1y": {
      from.setMonth(from.getMonth() - 11);
      from.setDate(1);
      from.setHours(0, 0, 0, 0);
      const prevTo = new Date(from);
      prevTo.setMilliseconds(-1);
      const prevFrom = new Date(prevTo);
      prevFrom.setMonth(prevFrom.getMonth() - 11);
      prevFrom.setDate(1);
      prevFrom.setHours(0, 0, 0, 0);
      return {
        from,
        to,
        previousFrom: prevFrom,
        previousTo: prevTo,
        granularity: "monthly",
      };
    }
    case "all":
    default:
      return {
        from: null,
        to,
        previousFrom: null,
        previousTo: null,
        granularity: "monthly",
      };
  }
}

/* ============================================================
 * Shared match stages
 * ============================================================ */

function salesMatch(from: Date | null, to: Date): Record<string, unknown> {
  const dateRange: Record<string, Date> = { $lte: to };
  if (from) dateRange.$gte = from;
  return {
    deletedAt: null,
    status: { $nin: [...NON_SALES_STATUSES] },
    orderDate: dateRange,
  };
}

/* ============================================================
 * Overview
 * ============================================================ */

async function sumKpis(from: Date | null, to: Date): Promise<KpiBundle> {
  const rows = await Order.aggregate<{
    orders: number;
    revenue: number;
    cost: number;
    profit: number;
  }>([
    { $match: salesMatch(from, to) },
    {
      $group: {
        _id: null,
        orders: { $sum: 1 },
        revenue: { $sum: "$totalAmount" },
        cost: { $sum: "$costTotal" },
        profit: { $sum: "$profitTotal" },
      },
    },
  ]);

  const r = rows[0] ?? { orders: 0, revenue: 0, cost: 0, profit: 0 };
  return {
    orders: r.orders,
    revenue: r.revenue,
    cost: r.cost,
    profit: r.profit,
    avgOrderValue: r.orders > 0 ? r.revenue / r.orders : 0,
  };
}

function pctChange(current: number, previous: number): number | null {
  if (previous === 0) {
    return current > 0 ? 100 : null;
  }
  return ((current - previous) / previous) * 100;
}

export async function getOverview(
  range: AnalyticsRange,
): Promise<AnalyticsOverview> {
  const { from, to, previousFrom, previousTo } = resolveRange(range);

  const [current, previous, catalog, pending] = await Promise.all([
    sumKpis(from, to),
    previousFrom && previousTo
      ? sumKpis(previousFrom, previousTo)
      : Promise.resolve(null),
    (async () => {
      const [totalProducts, lowStockProducts, outOfStockProducts] =
        await Promise.all([
          Product.countDocuments({ deletedAt: null, isActive: true }),
          Product.countDocuments({
            deletedAt: null,
            isActive: true,
            stock: { $gt: 0, $lte: LOW_STOCK_THRESHOLD },
          }),
          Product.countDocuments({
            deletedAt: null,
            isActive: true,
            stock: 0,
          }),
        ]);
      return { totalProducts, lowStockProducts, outOfStockProducts };
    })(),
    (async () => {
      const [pendingOrders, unpaidOrders] = await Promise.all([
        Order.countDocuments({
          deletedAt: null,
          status: { $in: [...PENDING_ORDER_STATUSES] },
        }),
        Order.countDocuments({
          deletedAt: null,
          paymentStatus: { $in: [...UNPAID_PAYMENT_STATUSES] },
          status: { $nin: [...NON_SALES_STATUSES] },
        }),
      ]);
      return { pendingOrders, unpaidOrders };
    })(),
  ]);

  const change: KpiChange = {
    orders: previous ? pctChange(current.orders, previous.orders) : null,
    revenue: previous ? pctChange(current.revenue, previous.revenue) : null,
    profit: previous ? pctChange(current.profit, previous.profit) : null,
    avgOrderValue: previous
      ? pctChange(current.avgOrderValue, previous.avgOrderValue)
      : null,
  };

  return {
    range,
    from: from ? from.toISOString() : null,
    to: to.toISOString(),
    current,
    previous,
    change,
    catalog,
    pending,
  };
}

/* ============================================================
 * Revenue series
 * ============================================================ */

function formatBucketKey(date: Date, g: RevenueSeriesGranularity): string {
  const pad2 = (n: number) => String(n).padStart(2, "0");
  const y = date.getFullYear();
  const m = pad2(date.getMonth() + 1);
  const d = pad2(date.getDate());
  const h = pad2(date.getHours());

  switch (g) {
    case "hourly":
      return `${y}-${m}-${d} ${h}:00`;
    case "daily":
      return `${y}-${m}-${d}`;
    case "weekly": {
      const tmp = new Date(date);
      const day = tmp.getDay() || 7;
      tmp.setDate(tmp.getDate() - (day - 1));
      return `${tmp.getFullYear()}-${pad2(tmp.getMonth() + 1)}-${pad2(tmp.getDate())}`;
    }
    case "monthly":
    default:
      return `${y}-${m}`;
  }
}

function dateToStringFormat(g: RevenueSeriesGranularity): string {
  switch (g) {
    case "hourly":
      return "%Y-%m-%d %H:00";
    case "daily":
      return "%Y-%m-%d";
    case "weekly":
      return "%G-%V";
    case "monthly":
      return "%Y-%m";
  }
}

function buildContinuousBuckets(
  from: Date | null,
  to: Date,
  g: RevenueSeriesGranularity,
): string[] {
  if (!from) return [];

  const keys: string[] = [];
  const cursor = new Date(from);

  if (g === "hourly") {
    cursor.setMinutes(0, 0, 0);
    const end = new Date(to);
    end.setMinutes(59, 59, 999);
    while (cursor <= end) {
      keys.push(formatBucketKey(cursor, g));
      cursor.setHours(cursor.getHours() + 1);
    }
  } else if (g === "daily") {
    cursor.setHours(0, 0, 0, 0);
    const end = new Date(to);
    end.setHours(23, 59, 59, 999);
    while (cursor <= end) {
      keys.push(formatBucketKey(cursor, g));
      cursor.setDate(cursor.getDate() + 1);
    }
  } else if (g === "weekly") {
    const day = cursor.getDay() || 7;
    cursor.setDate(cursor.getDate() - (day - 1));
    cursor.setHours(0, 0, 0, 0);
    const end = new Date(to);
    while (cursor <= end) {
      keys.push(formatBucketKey(cursor, g));
      cursor.setDate(cursor.getDate() + 7);
    }
  } else {
    cursor.setDate(1);
    cursor.setHours(0, 0, 0, 0);
    const end = new Date(to);
    end.setDate(1);
    end.setHours(0, 0, 0, 0);
    while (cursor <= end) {
      keys.push(formatBucketKey(cursor, g));
      cursor.setMonth(cursor.getMonth() + 1);
    }
  }

  return keys;
}

export async function getRevenueSeries(
  range: AnalyticsRange,
): Promise<RevenueSeries> {
  const { from, to, granularity } = resolveRange(range);

  const fmt = dateToStringFormat(granularity);

  const rows = await Order.aggregate<{
    _id: string;
    revenue: number;
    profit: number;
    orders: number;
  }>([
    { $match: salesMatch(from, to) },
    {
      $group: {
        _id: { $dateToString: { format: fmt, date: "$orderDate" } },
        revenue: { $sum: "$totalAmount" },
        profit: { $sum: "$profitTotal" },
        orders: { $sum: 1 },
      },
    },
  ]);

  const byKey = new Map(
    rows.map((r) => [
      r._id,
      { revenue: r.revenue, profit: r.profit, orders: r.orders },
    ]),
  );

  const points: RevenuePoint[] = [];

  if (from) {
    const buckets = buildContinuousBuckets(from, to, granularity);
    for (const key of buckets) {
      const hit = byKey.get(key);
      points.push({
        date: key,
        revenue: hit?.revenue ?? 0,
        profit: hit?.profit ?? 0,
        orders: hit?.orders ?? 0,
      });
    }
  } else {
    const sorted = [...rows].sort((a, b) => a._id.localeCompare(b._id));
    for (const r of sorted) {
      points.push({
        date: r._id,
        revenue: r.revenue,
        profit: r.profit,
        orders: r.orders,
      });
    }
  }

  const totals = points.reduce(
    (acc, p) => {
      acc.revenue += p.revenue;
      acc.profit += p.profit;
      acc.orders += p.orders;
      return acc;
    },
    { revenue: 0, profit: 0, orders: 0 },
  );

  return {
    range,
    from: from ? from.toISOString() : null,
    to: to.toISOString(),
    granularity,
    points,
    totals,
  };
}

/* ============================================================
 * Top products
 * ============================================================ */

export async function getTopProducts(
  range: AnalyticsRange,
  limit = 8,
): Promise<TopProductsResult> {
  const { from, to } = resolveRange(range);

  const rows = await Order.aggregate<{
    _id: mongoose.Types.ObjectId;
    unitsSold: number;
    revenue: number;
    profit: number;
  }>([
    { $match: salesMatch(from, to) },
    { $unwind: "$items" },
    {
      $group: {
        _id: "$items.product",
        unitsSold: { $sum: "$items.quantity" },
        revenue: { $sum: "$items.lineTotal" },
        profit: {
          $sum: {
            $subtract: [
              "$items.lineTotal",
              { $multiply: ["$items.costPriceAtTime", "$items.quantity"] },
            ],
          },
        },
      },
    },
    { $sort: { revenue: -1 } },
    { $limit: limit },
  ]);

  if (rows.length === 0) {
    return { range, rows: [] };
  }

  const productIds = rows.map((r) => r._id);
  const products = await Product.find({ _id: { $in: productIds } })
    .select("_id name sku images")
    .lean<
      Array<{
        _id: mongoose.Types.ObjectId;
        name: { en: string; bn: string };
        sku?: string;
        images?: Array<{ url: string }>;
      }>
    >();

  const productMap = new Map(products.map((p) => [String(p._id), p]));

  const out: TopProductRow[] = [];
  for (const r of rows) {
    const p = productMap.get(String(r._id));
    if (!p) continue;
    out.push({
      productId: String(p._id),
      name: p.name.en,
      sku: p.sku ?? "",
      imageUrl: p.images?.[0]?.url,
      unitsSold: r.unitsSold,
      revenue: r.revenue,
      profit: r.profit,
    });
  }

  return { range, rows: out };
}

/* ============================================================
 * Category breakdown
 * ============================================================ */

export async function getCategoryBreakdown(
  range: AnalyticsRange,
): Promise<CategoryBreakdownResult> {
  const { from, to } = resolveRange(range);

  const rows = await Order.aggregate<{
    _id: mongoose.Types.ObjectId;
    unitsSold: number;
    revenue: number;
    profit: number;
  }>([
    { $match: salesMatch(from, to) },
    { $unwind: "$items" },
    {
      $lookup: {
        from: "products",
        localField: "items.product",
        foreignField: "_id",
        as: "product",
      },
    },
    { $unwind: "$product" },
    {
      $lookup: {
        from: "categories",
        localField: "product.mainCategory",
        foreignField: "_id",
        as: "mainCategory",
      },
    },
    { $unwind: "$mainCategory" },
    {
      $group: {
        _id: "$mainCategory._id",
        unitsSold: { $sum: "$items.quantity" },
        revenue: { $sum: "$items.lineTotal" },
        profit: {
          $sum: {
            $subtract: [
              "$items.lineTotal",
              { $multiply: ["$items.costPriceAtTime", "$items.quantity"] },
            ],
          },
        },
      },
    },
    { $sort: { revenue: -1 } },
  ]);

  if (rows.length === 0) {
    return { range, rows: [], totalRevenue: 0 };
  }

  const categoryIds = rows.map((r) => r._id);
  const categories = await Category.find({ _id: { $in: categoryIds } })
    .select("_id name")
    .lean<
      Array<{
        _id: mongoose.Types.ObjectId;
        name: { en: string; bn: string };
      }>
    >();

  const catMap = new Map(categories.map((c) => [String(c._id), c]));

  const totalRevenue = rows.reduce((acc, r) => acc + r.revenue, 0);

  const out: CategoryBreakdownRow[] = [];
  for (const r of rows) {
    const cat = catMap.get(String(r._id));
    if (!cat) continue;
    out.push({
      categoryId: String(cat._id),
      name: cat.name.en,
      unitsSold: r.unitsSold,
      revenue: r.revenue,
      profit: r.profit,
      share: totalRevenue > 0 ? r.revenue / totalRevenue : 0,
    });
  }

  return { range, rows: out, totalRevenue };
}

/* ============================================================
 * Recent orders
 * ============================================================ */

export async function getRecentOrders(limit = 8): Promise<RecentOrdersResult> {
  const docs = await Order.find({ deletedAt: null })
    .sort({ orderDate: -1 })
    .limit(limit)
    .select(
      "orderNumber channel status paymentStatus customerSnapshot guestName guestPhone items totalAmount orderDate",
    )
    .lean<
      Array<{
        _id: mongoose.Types.ObjectId;
        orderNumber: string;
        channel: "online" | "pos" | "phone" | "walk-in";
        status: string;
        paymentStatus: string;
        customerSnapshot?: { name?: string };
        guestName?: string;
        guestPhone?: string;
        items: Array<unknown>;
        totalAmount: number;
        orderDate: Date;
      }>
    >();

  const rows: RecentOrderRow[] = docs.map((o) => ({
    orderId: String(o._id),
    orderNumber: o.orderNumber,
    channel: o.channel,
    status: o.status,
    paymentStatus: o.paymentStatus,
    customerName: o.customerSnapshot?.name ?? o.guestName ?? "Walk-in customer",
    itemsCount: o.items.length,
    totalAmount: o.totalAmount,
    orderDate: o.orderDate.toISOString(),
  }));

  return { rows };
}
