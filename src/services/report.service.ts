// src/services/report.service.ts

import mongoose from "mongoose";
import Order from "@/models/Order.model";
import Product from "@/models/Product.model";
import Category from "@/models/Category.model";
import { getSettings } from "@/services/setting.service";
import { LOW_STOCK_THRESHOLD } from "@/lib/validations/product.schema";
import type {
  InventoryReport,
  InventoryRow,
  InventoryStatus,
  ProfitReport,
  ProfitReportBucket,
  ProfitReportProductRow,
  ReportRange,
  VatReport,
  VatReportBucket,
} from "@/lib/admin/reports";

/* ============================================================
 * Status constants — typed tuples for Mongoose
 * ============================================================ */

const NON_SALES_STATUSES = ["cancelled", "returned"] as const;

/* ============================================================
 * Range resolution
 * ============================================================ */

type ResolvedRange = {
  from: Date | null;
  to: Date;
  granularity: "daily" | "weekly" | "monthly";
};

function resolveRange(range: ReportRange): ResolvedRange {
  const to = new Date();
  const from = new Date();

  switch (range) {
    case "today":
      from.setHours(0, 0, 0, 0);
      return { from, to, granularity: "daily" };
    case "7d":
      from.setDate(from.getDate() - 6);
      from.setHours(0, 0, 0, 0);
      return { from, to, granularity: "daily" };
    case "30d":
      from.setDate(from.getDate() - 29);
      from.setHours(0, 0, 0, 0);
      return { from, to, granularity: "daily" };
    case "90d":
      from.setDate(from.getDate() - 89);
      from.setHours(0, 0, 0, 0);
      return { from, to, granularity: "weekly" };
    case "1y":
      from.setMonth(from.getMonth() - 11);
      from.setDate(1);
      from.setHours(0, 0, 0, 0);
      return { from, to, granularity: "monthly" };
    case "all":
    default:
      return { from: null, to, granularity: "monthly" };
  }
}

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
 * Bucket helpers
 * ============================================================ */

function formatBucketKey(
  date: Date,
  g: "daily" | "weekly" | "monthly",
): string {
  const pad2 = (n: number) => String(n).padStart(2, "0");
  const y = date.getFullYear();
  const m = pad2(date.getMonth() + 1);
  const d = pad2(date.getDate());

  if (g === "monthly") return `${y}-${m}`;
  if (g === "weekly") {
    const tmp = new Date(date);
    const day = tmp.getDay() || 7;
    tmp.setDate(tmp.getDate() - (day - 1));
    return `${tmp.getFullYear()}-${pad2(tmp.getMonth() + 1)}-${pad2(tmp.getDate())}`;
  }
  return `${y}-${m}-${d}`;
}

function mongoDateFormat(g: "daily" | "weekly" | "monthly"): string {
  if (g === "monthly") return "%Y-%m";
  if (g === "weekly") return "%G-%V";
  return "%Y-%m-%d";
}

function buildContinuousBuckets(
  from: Date | null,
  to: Date,
  g: "daily" | "weekly" | "monthly",
): string[] {
  if (!from) return [];

  const keys: string[] = [];
  const cursor = new Date(from);
  const end = new Date(to);

  if (g === "daily") {
    cursor.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    while (cursor <= end) {
      keys.push(formatBucketKey(cursor, "daily"));
      cursor.setDate(cursor.getDate() + 1);
    }
  } else if (g === "weekly") {
    const day = cursor.getDay() || 7;
    cursor.setDate(cursor.getDate() - (day - 1));
    cursor.setHours(0, 0, 0, 0);
    while (cursor <= end) {
      keys.push(formatBucketKey(cursor, "weekly"));
      cursor.setDate(cursor.getDate() + 7);
    }
  } else {
    cursor.setDate(1);
    cursor.setHours(0, 0, 0, 0);
    end.setDate(1);
    end.setHours(0, 0, 0, 0);
    while (cursor <= end) {
      keys.push(formatBucketKey(cursor, "monthly"));
      cursor.setMonth(cursor.getMonth() + 1);
    }
  }

  return keys;
}

/* ============================================================
 * Profit report
 * ============================================================ */

export async function getProfitReport(
  range: ReportRange,
): Promise<ProfitReport> {
  const { from, to, granularity } = resolveRange(range);
  const match = salesMatch(from, to);
  const fmt = mongoDateFormat(granularity);

  /* ----- Totals ----- */
  const totalsRows = await Order.aggregate<{
    orders: number;
    revenue: number;
    cost: number;
    profit: number;
  }>([
    { $match: match },
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

  const t = totalsRows[0] ?? { orders: 0, revenue: 0, cost: 0, profit: 0 };

  const totals = {
    orders: t.orders,
    revenue: t.revenue,
    cost: t.cost,
    profit: t.profit,
    margin: t.revenue > 0 ? t.profit / t.revenue : null,
    averageOrderValue: t.orders > 0 ? t.revenue / t.orders : 0,
    averageProfitPerOrder: t.orders > 0 ? t.profit / t.orders : 0,
  };

  /* ----- Buckets ----- */
  const bucketRows = await Order.aggregate<{
    _id: string;
    orders: number;
    revenue: number;
    cost: number;
    profit: number;
  }>([
    { $match: match },
    {
      $group: {
        _id: { $dateToString: { format: fmt, date: "$orderDate" } },
        orders: { $sum: 1 },
        revenue: { $sum: "$totalAmount" },
        cost: { $sum: "$costTotal" },
        profit: { $sum: "$profitTotal" },
      },
    },
  ]);

  const bucketMap = new Map(
    bucketRows.map((r) => [
      r._id,
      {
        orders: r.orders,
        revenue: r.revenue,
        cost: r.cost,
        profit: r.profit,
      },
    ]),
  );

  const buckets: ProfitReportBucket[] = [];

  if (from) {
    for (const key of buildContinuousBuckets(from, to, granularity)) {
      const hit = bucketMap.get(key);
      const revenue = hit?.revenue ?? 0;
      const profit = hit?.profit ?? 0;
      buckets.push({
        date: key,
        orders: hit?.orders ?? 0,
        revenue,
        cost: hit?.cost ?? 0,
        profit,
        margin: revenue > 0 ? profit / revenue : null,
      });
    }
  } else {
    const sorted = [...bucketRows].sort((a, b) => a._id.localeCompare(b._id));
    for (const r of sorted) {
      buckets.push({
        date: r._id,
        orders: r.orders,
        revenue: r.revenue,
        cost: r.cost,
        profit: r.profit,
        margin: r.revenue > 0 ? r.profit / r.revenue : null,
      });
    }
  }

  /* ----- Per-product profit (for top/worst) ----- */
  const productRows = await Order.aggregate<{
    _id: mongoose.Types.ObjectId;
    unitsSold: number;
    revenue: number;
    cost: number;
    profit: number;
  }>([
    { $match: match },
    { $unwind: "$items" },
    {
      $group: {
        _id: "$items.product",
        unitsSold: { $sum: "$items.quantity" },
        revenue: { $sum: "$items.lineTotal" },
        cost: {
          $sum: {
            $multiply: ["$items.costPriceAtTime", "$items.quantity"],
          },
        },
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
  ]);

  const productMap = new Map<string, ProfitReportProductRow>();

  if (productRows.length > 0) {
    const productIds = productRows.map((r) => r._id);
    const products = await Product.find({ _id: { $in: productIds } })
      .select("_id name sku")
      .lean<
        Array<{
          _id: mongoose.Types.ObjectId;
          name: { en: string; bn: string };
          sku?: string;
        }>
      >();

    const docMap = new Map(products.map((p) => [String(p._id), p]));

    for (const r of productRows) {
      const doc = docMap.get(String(r._id));
      if (!doc) continue;
      productMap.set(String(r._id), {
        productId: String(r._id),
        name: doc.name.en,
        sku: doc.sku ?? "",
        unitsSold: r.unitsSold,
        revenue: r.revenue,
        cost: r.cost,
        profit: r.profit,
        margin: r.revenue > 0 ? r.profit / r.revenue : null,
      });
    }
  }

  const allRows = Array.from(productMap.values());

  const topProducts = [...allRows]
    .sort((a, b) => b.profit - a.profit)
    .slice(0, 8);

  const worstProducts = [...allRows]
    .sort((a, b) => a.profit - b.profit)
    .slice(0, 5);

  return {
    range,
    from: from ? from.toISOString() : null,
    to: to.toISOString(),
    granularity,
    totals,
    buckets,
    topProducts,
    worstProducts,
  };
}

/* ============================================================
 * Inventory report
 * ============================================================ */

export async function getInventoryReport(
  status: InventoryStatus = "all",
): Promise<InventoryReport> {
  /* Global low-stock threshold from settings */
  const settings = await getSettings();
  const globalThreshold = settings.lowStockThreshold ?? LOW_STOCK_THRESHOLD;

  /* Build filter */
  const filter: Record<string, unknown> = {
    deletedAt: null,
    isActive: true,
  };

  if (status === "out") {
    filter.stock = 0;
  } else if (status === "low") {
    filter.$expr = {
      $and: [
        { $gt: ["$stock", 0] },
        {
          $lte: [
            "$stock",
            { $ifNull: ["$lowStockThreshold", globalThreshold] },
          ],
        },
      ],
    };
  } else if (status === "in") {
    filter.$expr = {
      $gt: ["$stock", { $ifNull: ["$lowStockThreshold", globalThreshold] }],
    };
  }

  const docs = await Product.find(filter)
    .sort({ stock: 1, "name.en": 1 })
    .populate({ path: "mainCategory", select: "_id name" })
    .lean<
      Array<{
        _id: mongoose.Types.ObjectId;
        name: { en: string; bn: string };
        sku?: string;
        stock: number;
        price: number;
        costPrice?: number | null;
        lowStockThreshold?: number | null;
        mainCategory?: { name?: { en?: string; bn?: string } } | null;
      }>
    >();

  const rows: InventoryRow[] = [];
  let inStockCount = 0;
  let lowStockCount = 0;
  let outOfStockCount = 0;
  let totalUnits = 0;
  let totalCostValue = 0;
  let totalRetailValue = 0;
  let totalPotentialProfit = 0;

  for (const d of docs) {
    const threshold = d.lowStockThreshold ?? globalThreshold;
    const costPrice =
      d.costPrice === undefined || d.costPrice === null ? null : d.costPrice;

    const costValue = costPrice !== null ? d.stock * costPrice : null;
    const retailValue = d.stock * d.price;
    const potentialProfit = costValue !== null ? retailValue - costValue : null;

    if (d.stock === 0) outOfStockCount += 1;
    else if (d.stock <= threshold) lowStockCount += 1;
    else inStockCount += 1;

    totalUnits += d.stock;
    if (costValue !== null) totalCostValue += costValue;
    totalRetailValue += retailValue;
    if (potentialProfit !== null) totalPotentialProfit += potentialProfit;

    rows.push({
      productId: String(d._id),
      name: d.name.en,
      sku: d.sku ?? "",
      categoryName: d.mainCategory?.name?.en ?? "—",
      stock: d.stock,
      lowStockThreshold: threshold,
      costValue,
      retailValue,
      potentialProfit,
    });
  }

  return {
    status,
    generatedAt: new Date().toISOString(),
    summary: {
      totalProducts: rows.length,
      inStockCount,
      lowStockCount,
      outOfStockCount,
      totalUnits,
      totalCostValue,
      totalRetailValue,
      totalPotentialProfit,
    },
    rows,
  };
}

/* ============================================================
 * VAT report
 * ============================================================ */

export async function getVatReport(range: ReportRange): Promise<VatReport> {
  const { from, to, granularity } = resolveRange(range);
  const match = salesMatch(from, to);
  const fmt = mongoDateFormat(granularity);

  const settings = await getSettings();

  /* ----- Totals ----- */
  const totalRows = await Order.aggregate<{
    orderCount: number;
    subtotal: number;
    taxTotal: number;
    totalAmount: number;
  }>([
    { $match: match },
    {
      $group: {
        _id: null,
        orderCount: { $sum: 1 },
        subtotal: { $sum: "$subtotal" },
        taxTotal: { $sum: "$taxTotal" },
        totalAmount: { $sum: "$totalAmount" },
      },
    },
  ]);

  const t = totalRows[0] ?? {
    orderCount: 0,
    subtotal: 0,
    taxTotal: 0,
    totalAmount: 0,
  };

  /* ----- Buckets ----- */
  const bucketRows = await Order.aggregate<{
    _id: string;
    orderCount: number;
    subtotal: number;
    taxTotal: number;
    totalAmount: number;
  }>([
    { $match: match },
    {
      $group: {
        _id: { $dateToString: { format: fmt, date: "$orderDate" } },
        orderCount: { $sum: 1 },
        subtotal: { $sum: "$subtotal" },
        taxTotal: { $sum: "$taxTotal" },
        totalAmount: { $sum: "$totalAmount" },
      },
    },
  ]);

  const bucketMap = new Map(bucketRows.map((r) => [r._id, r]));

  const buckets: VatReportBucket[] = [];

  if (from) {
    for (const key of buildContinuousBuckets(from, to, granularity)) {
      const hit = bucketMap.get(key);
      buckets.push({
        date: key,
        orderCount: hit?.orderCount ?? 0,
        subtotal: hit?.subtotal ?? 0,
        taxTotal: hit?.taxTotal ?? 0,
        totalAmount: hit?.totalAmount ?? 0,
      });
    }
  } else {
    const sorted = [...bucketRows].sort((a, b) => a._id.localeCompare(b._id));
    for (const r of sorted) {
      buckets.push({
        date: r._id,
        orderCount: r.orderCount,
        subtotal: r.subtotal,
        taxTotal: r.taxTotal,
        totalAmount: r.totalAmount,
      });
    }
  }

  return {
    range,
    from: from ? from.toISOString() : null,
    to: to.toISOString(),
    enabled: settings.vat.enabled,
    defaultRate: settings.vat.defaultRate,
    inclusive: settings.vat.inclusive,
    totals: {
      orderCount: t.orderCount,
      subtotal: t.subtotal,
      taxTotal: t.taxTotal,
      totalAmount: t.totalAmount,
    },
    buckets,
  };
}
