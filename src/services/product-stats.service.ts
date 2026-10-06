// src/services/product-stats.service.ts

import "server-only";

import mongoose from "mongoose";
import Product from "@/models/Product.model";
import Order from "@/models/Order.model";
import { NotFoundError, BadRequestError } from "@/lib/errors";
import type {
  ProductStatsRange,
  ProductStatsRangeOption,
} from "@/lib/admin/product-stats";

// Re-export for convenience so server-side code can still use them
export { PRODUCT_STATS_RANGES } from "@/lib/admin/product-stats";
export type { ProductStatsRange, ProductStatsRangeOption };

/* ============================================================
 * Public types
 * ============================================================ */

/** Aggregated totals for the range. */
export type ProductStatsTotals = {
  unitsSold: number;
  revenue: number;
  cost: number;
  profit: number;
  averagePrice: number;
  orderCount: number;
};

/** One bucket on the sales-over-time chart. */
export type ProductStatsBucket = {
  /** "2026-10-05" for daily, "2026-10" for monthly. */
  date: string;
  unitsSold: number;
  revenue: number;
  profit: number;
};

export type ProductRecentOrderRow = {
  orderId: string;
  orderNumber: string;
  channel: "online" | "pos" | "phone" | "walk-in";
  status: string;
  paymentStatus: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  orderDate: string;
};

export type ProductStats = {
  productId: string;
  range: ProductStatsRange;
  /** Date range actually used (for display). */
  from: string | null;
  to: string;

  /** Current snapshot metrics. */
  current: {
    price: number;
    compareAtPrice: number | null;
    costPrice: number | null;
    marginPerUnit: number | null;
    marginPercent: number | null;
    stock: number;
    lowStockThreshold: number | null;
    stockValue: number | null; // stock × costPrice
    potentialRevenue: number | null; // stock × price
  };

  /** Range-scoped aggregates. */
  totals: ProductStatsTotals;

  /** Time series, ordered oldest → newest. */
  buckets: ProductStatsBucket[];

  /** Whether buckets are daily or monthly. */
  bucketGranularity: "daily" | "monthly";

  /** Last 10 orders containing this product, newest first. */
  recentOrders: ProductRecentOrderRow[];
};

/* ============================================================
 * Range parsing
 * ============================================================ */

function resolveRange(range: ProductStatsRange): {
  from: Date | null;
  to: Date;
  granularity: "daily" | "monthly";
} {
  const to = new Date();
  const from = new Date();

  switch (range) {
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
      return { from, to, granularity: "daily" };
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

/* ============================================================
 * Main function
 * ============================================================ */

export async function getProductStats(
  productId: string,
  range: ProductStatsRange = "30d",
): Promise<ProductStats> {
  if (!mongoose.Types.ObjectId.isValid(productId)) {
    throw new BadRequestError("Invalid product id");
  }

  const product = await Product.findById(productId).lean<{
    _id: mongoose.Types.ObjectId;
    price: number;
    compareAtPrice?: number | null;
    costPrice?: number | null;
    stock: number;
    lowStockThreshold?: number | null;
  } | null>();

  if (!product) throw new NotFoundError("Product not found");

  const { from, to, granularity } = resolveRange(range);
  const productOid = new mongoose.Types.ObjectId(productId);

  /* ----------------------------------------------------------
   * 1. Totals + buckets via a single aggregation
   * ---------------------------------------------------------- */

  const dateMatch: Record<string, unknown> = {};
  if (from) dateMatch.$gte = from;
  dateMatch.$lte = to;

  const matchStage: Record<string, unknown> = {
    deletedAt: null,
    "items.product": productOid,
    orderDate: dateMatch,
  };

  const dateFormat = granularity === "daily" ? "%Y-%m-%d" : "%Y-%m";

  const [bucketsAndTotals] = await Order.aggregate<{
    totals: Array<{
      unitsSold: number;
      revenue: number;
      cost: number;
      profit: number;
      orderCount: number;
    }>;
    buckets: Array<{
      _id: string;
      unitsSold: number;
      revenue: number;
      profit: number;
    }>;
  }>([
    { $match: matchStage },
    { $unwind: "$items" },
    { $match: { "items.product": productOid } },
    {
      $facet: {
        totals: [
          {
            $group: {
              _id: null,
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
                    {
                      $multiply: ["$items.costPriceAtTime", "$items.quantity"],
                    },
                  ],
                },
              },
              orderIds: { $addToSet: "$_id" },
            },
          },
          {
            $project: {
              _id: 0,
              unitsSold: 1,
              revenue: 1,
              cost: 1,
              profit: 1,
              orderCount: { $size: "$orderIds" },
            },
          },
        ],
        buckets: [
          {
            $group: {
              _id: {
                $dateToString: { format: dateFormat, date: "$orderDate" },
              },
              unitsSold: { $sum: "$items.quantity" },
              revenue: { $sum: "$items.lineTotal" },
              profit: {
                $sum: {
                  $subtract: [
                    "$items.lineTotal",
                    {
                      $multiply: ["$items.costPriceAtTime", "$items.quantity"],
                    },
                  ],
                },
              },
            },
          },
          { $sort: { _id: 1 } },
        ],
      },
    },
  ]);

  const totalsRow = bucketsAndTotals?.totals[0] ?? {
    unitsSold: 0,
    revenue: 0,
    cost: 0,
    profit: 0,
    orderCount: 0,
  };

  const totals: ProductStatsTotals = {
    unitsSold: totalsRow.unitsSold,
    revenue: totalsRow.revenue,
    cost: totalsRow.cost,
    profit: totalsRow.profit,
    averagePrice:
      totalsRow.unitsSold > 0 ? totalsRow.revenue / totalsRow.unitsSold : 0,
    orderCount: totalsRow.orderCount,
  };

  /* ----------------------------------------------------------
   * 2. Fill gaps in buckets so the chart has a continuous line
   * ---------------------------------------------------------- */

  const buckets = fillBucketGaps(
    bucketsAndTotals?.buckets ?? [],
    from,
    to,
    granularity,
  );

  /* ----------------------------------------------------------
   * 3. Recent orders
   * ---------------------------------------------------------- */

  type RawRecentOrder = {
    _id: mongoose.Types.ObjectId;
    orderNumber: string;
    channel: "online" | "pos" | "phone" | "walk-in";
    status: string;
    paymentStatus: string;
    orderDate: Date;
    items: Array<{
      product: mongoose.Types.ObjectId;
      quantity: number;
      priceAtTime: number;
      lineTotal: number;
    }>;
  };

  const rawRecent = await Order.find({
    deletedAt: null,
    "items.product": productOid,
  })
    .sort({ orderDate: -1 })
    .limit(10)
    .select("orderNumber channel status paymentStatus orderDate items")
    .lean<RawRecentOrder[]>();

  const recentOrders: ProductRecentOrderRow[] = rawRecent.map((o) => {
    const line = o.items.find((i) => String(i.product) === productId);
    return {
      orderId: String(o._id),
      orderNumber: o.orderNumber,
      channel: o.channel,
      status: o.status,
      paymentStatus: o.paymentStatus,
      quantity: line?.quantity ?? 0,
      unitPrice: line?.priceAtTime ?? 0,
      lineTotal: line?.lineTotal ?? 0,
      orderDate: o.orderDate.toISOString(),
    };
  });

  /* ----------------------------------------------------------
   * 4. Current snapshot metrics
   * ---------------------------------------------------------- */

  const price = product.price;
  const costPrice =
    product.costPrice === undefined || product.costPrice === null
      ? null
      : product.costPrice;

  const marginPerUnit = costPrice !== null ? price - costPrice : null;
  const marginPercent =
    costPrice !== null && price > 0
      ? ((price - costPrice) / price) * 100
      : null;

  const stockValue = costPrice !== null ? product.stock * costPrice : null;
  const potentialRevenue = product.stock * price;

  return {
    productId,
    range,
    from: from ? from.toISOString() : null,
    to: to.toISOString(),
    current: {
      price,
      compareAtPrice:
        product.compareAtPrice === undefined || product.compareAtPrice === null
          ? null
          : product.compareAtPrice,
      costPrice,
      marginPerUnit,
      marginPercent,
      stock: product.stock,
      lowStockThreshold:
        product.lowStockThreshold === undefined ||
        product.lowStockThreshold === null
          ? null
          : product.lowStockThreshold,
      stockValue,
      potentialRevenue,
    },
    totals,
    buckets,
    bucketGranularity: granularity,
    recentOrders,
  };
}

/* ============================================================
 * Bucket gap-filling
 * ============================================================ */

function fillBucketGaps(
  buckets: Array<{
    _id: string;
    unitsSold: number;
    revenue: number;
    profit: number;
  }>,
  from: Date | null,
  to: Date,
  granularity: "daily" | "monthly",
): ProductStatsBucket[] {
  const map = new Map<
    string,
    { unitsSold: number; revenue: number; profit: number }
  >();
  for (const b of buckets) {
    map.set(b._id, {
      unitsSold: b.unitsSold,
      revenue: b.revenue,
      profit: b.profit,
    });
  }

  const out: ProductStatsBucket[] = [];

  if (!from) {
    // "all time" — no gap filling, just return what came back
    for (const b of buckets) {
      out.push({
        date: b._id,
        unitsSold: b.unitsSold,
        revenue: b.revenue,
        profit: b.profit,
      });
    }
    return out;
  }

  const cursor = new Date(from);
  const end = new Date(to);

  if (granularity === "daily") {
    cursor.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    while (cursor <= end) {
      const key = formatDateKey(cursor);
      const hit = map.get(key);
      out.push({
        date: key,
        unitsSold: hit?.unitsSold ?? 0,
        revenue: hit?.revenue ?? 0,
        profit: hit?.profit ?? 0,
      });
      cursor.setDate(cursor.getDate() + 1);
    }
  } else {
    cursor.setDate(1);
    cursor.setHours(0, 0, 0, 0);
    end.setDate(1);
    end.setHours(0, 0, 0, 0);

    while (cursor <= end) {
      const key = formatMonthKey(cursor);
      const hit = map.get(key);
      out.push({
        date: key,
        unitsSold: hit?.unitsSold ?? 0,
        revenue: hit?.revenue ?? 0,
        profit: hit?.profit ?? 0,
      });
      cursor.setMonth(cursor.getMonth() + 1);
    }
  }

  return out;
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function formatDateKey(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function formatMonthKey(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;
}
