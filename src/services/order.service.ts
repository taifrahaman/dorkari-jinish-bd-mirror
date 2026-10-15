// src/services/order.service.ts

import mongoose from "mongoose";
import Order, {
  type IOrderItem,
  type OrderChannel,
  type OrderStatus,
  type PaymentStatus,
  type PaymentMethod,
} from "@/models/Order.model";
import Product from "@/models/Product.model";
import User from "@/models/User.model";
import { NotFoundError, ConflictError, BadRequestError } from "@/lib/errors";
import { generateOrderNumber } from "@/lib/admin/orders/order-number";
import { calculateOrderTotals } from "@/lib/admin/orders/calc";
import {
  findOrCreateCustomer,
  channelToSource,
} from "@/lib/admin/customers/find-or-create";
import type {
  CreateOrderInput,
  UpdateOrderInput,
  OrderListQuery,
  OrderResponse,
} from "@/lib/validations/order.schema";

/* ============================================================
 * Internal types
 * ============================================================ */

type PopulatedProductRef = {
  _id: mongoose.Types.ObjectId;
  name: { en: string; bn: string };
  slug: string;
  images?: Array<{ url: string; publicId: string; alt?: string }>;
};

type PopulatedUserRef = {
  _id: mongoose.Types.ObjectId;
  name?: string;
  email?: string;
};

type LeanOrderItem = {
  product: mongoose.Types.ObjectId | PopulatedProductRef;
  nameSnapshot: string;
  skuSnapshot: string;
  quantity: number;
  priceAtTime: number;
  costPriceAtTime: number;
  discount: number;
  lineTotal: number;
};

type LeanOrder = {
  _id: mongoose.Types.ObjectId;
  orderNumber: string;
  channel: OrderChannel;
  user?: mongoose.Types.ObjectId | null;
  guestEmail?: string;
  guestName?: string;
  guestPhone?: string;
  customerSnapshot?: { name: string; phone?: string; email?: string };
  items: LeanOrderItem[];
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  shippingFee: number;
  totalAmount: number;
  costTotal: number;
  profitTotal: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod?: PaymentMethod;
  shippingAddress?: string;
  trackingNumber?: string;
  orderDate: Date;
  deliveredDate?: Date | null;
  createdBy?: mongoose.Types.ObjectId | PopulatedUserRef | null;
  notes?: string;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

/* ============================================================
 * Population config
 * ============================================================ */

const POPULATE = [
  { path: "items.product", select: "_id name slug images" },
  { path: "createdBy", select: "_id name email" },
];

/* ============================================================
 * Response mapping
 * ============================================================ */

function toOrderItemResponse(
  item: LeanOrderItem,
): OrderResponse["items"][number] {
  let productOut:
    | string
    | {
        _id: string;
        name: { en: string; bn: string };
        slug: string;
        images?: Array<{ url: string; publicId: string; alt?: string }>;
      };

  if (item.product instanceof mongoose.Types.ObjectId) {
    productOut = String(item.product);
  } else {
    productOut = {
      _id: String(item.product._id),
      name: item.product.name,
      slug: item.product.slug,
      images: (item.product.images ?? []).map((i) => ({
        url: i.url,
        publicId: i.publicId,
        alt: i.alt ?? "",
      })),
    };
  }

  return {
    product: productOut,
    nameSnapshot: item.nameSnapshot,
    skuSnapshot: item.skuSnapshot,
    quantity: item.quantity,
    priceAtTime: item.priceAtTime,
    costPriceAtTime: item.costPriceAtTime,
    discount: item.discount,
    lineTotal: item.lineTotal,
  };
}

function toOrderResponse(doc: LeanOrder): OrderResponse {
  let createdByOut:
    string | { _id: string; name?: string; email?: string } | null | undefined =
    undefined;

  if (doc.createdBy instanceof mongoose.Types.ObjectId) {
    createdByOut = String(doc.createdBy);
  } else if (doc.createdBy && typeof doc.createdBy === "object") {
    createdByOut = {
      _id: String(doc.createdBy._id),
      name: doc.createdBy.name,
      email: doc.createdBy.email,
    };
  } else {
    createdByOut = null;
  }

  return {
    _id: String(doc._id),
    orderNumber: doc.orderNumber,
    channel: doc.channel,
    user: doc.user ? String(doc.user) : null,
    guestEmail: doc.guestEmail,
    guestName: doc.guestName,
    guestPhone: doc.guestPhone,
    customerSnapshot: doc.customerSnapshot,
    items: doc.items.map(toOrderItemResponse),
    subtotal: doc.subtotal,
    discountTotal: doc.discountTotal,
    taxTotal: doc.taxTotal,
    shippingFee: doc.shippingFee,
    totalAmount: doc.totalAmount,
    costTotal: doc.costTotal,
    profitTotal: doc.profitTotal,
    status: doc.status,
    paymentStatus: doc.paymentStatus,
    paymentMethod: doc.paymentMethod,
    shippingAddress: doc.shippingAddress,
    trackingNumber: doc.trackingNumber,
    orderDate: doc.orderDate.toISOString(),
    deliveredDate: doc.deliveredDate ? doc.deliveredDate.toISOString() : null,
    createdBy: createdByOut,
    notes: doc.notes,
    deletedAt: doc.deletedAt ? doc.deletedAt.toISOString() : null,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

/* ============================================================
 * Helpers
 * ============================================================ */

function assertObjectId(id: string, label = "order"): void {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new BadRequestError(`Invalid ${label} id`);
  }
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildListFilter(query: OrderListQuery): Record<string, unknown> {
  const filter: Record<string, unknown> = {};

  if (!query.includeDeleted) filter.deletedAt = null;

  if (query.channel) filter.channel = query.channel;
  if (query.status) filter.status = query.status;
  if (query.paymentStatus) filter.paymentStatus = query.paymentStatus;
  if (query.paymentMethod) filter.paymentMethod = query.paymentMethod;

  if (query.product) {
    filter["items.product"] = new mongoose.Types.ObjectId(query.product);
  }
  if (query.user) {
    filter.user = new mongoose.Types.ObjectId(query.user);
  }
  if (query.createdBy) {
    filter.createdBy = new mongoose.Types.ObjectId(query.createdBy);
  }

  if (query.from || query.to) {
    const range: Record<string, Date> = {};
    if (query.from) range.$gte = new Date(query.from);
    if (query.to) range.$lte = new Date(query.to);
    filter.orderDate = range;
  }

  if (query.q) {
    const rx = new RegExp(escapeRegex(query.q), "i");
    filter.$or = [
      { orderNumber: rx },
      { guestName: rx },
      { guestPhone: rx },
      { guestEmail: rx },
      { "customerSnapshot.name": rx },
      { "customerSnapshot.phone": rx },
      { "customerSnapshot.email": rx },
      { "items.nameSnapshot": rx },
      { "items.skuSnapshot": rx },
    ];
  }

  return filter;
}

function buildListSort(
  sortBy: OrderListQuery["sortBy"],
  order: "asc" | "desc",
): Record<string, 1 | -1> {
  const dir: 1 | -1 = order === "asc" ? 1 : -1;
  return { [sortBy]: dir };
}

/* ============================================================
 * List
 * ============================================================ */

export async function listOrders(query: OrderListQuery): Promise<{
  items: OrderResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> {
  const filter = buildListFilter(query);
  const sort = buildListSort(query.sortBy, query.sortOrder);
  const skip = (query.page - 1) * query.limit;

  const [docs, total] = await Promise.all([
    Order.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(query.limit)
      .populate(POPULATE)
      .lean<LeanOrder[]>(),
    Order.countDocuments(filter),
  ]);

  return {
    items: docs.map(toOrderResponse),
    total,
    page: query.page,
    limit: query.limit,
    totalPages: Math.max(1, Math.ceil(total / query.limit)),
  };
}

/* ============================================================
 * Get by ID
 * ============================================================ */

export async function getOrderById(id: string): Promise<OrderResponse> {
  assertObjectId(id);

  const doc = await Order.findById(id)
    .populate(POPULATE)
    .lean<LeanOrder | null>();

  if (!doc) throw new NotFoundError("Order not found");
  return toOrderResponse(doc);
}

/* ============================================================
 * Create
 * ============================================================ */

export async function createOrder(
  input: CreateOrderInput,
  createdBy?: string,
): Promise<OrderResponse> {
  /* ----- 1. Resolve customer ----- */

  let userOid: mongoose.Types.ObjectId | undefined;
  let customerSnapshot:
    { name: string; phone?: string; email?: string } | undefined;

  const c = input.customer;

  if (c?.id && mongoose.Types.ObjectId.isValid(c.id)) {
    // Existing customer by id
    const user = await User.findById(c.id).select("_id name phone email").lean<{
      _id: mongoose.Types.ObjectId;
      name: string;
      phone?: string;
      email?: string;
    } | null>();

    if (user) {
      userOid = user._id;
      customerSnapshot = {
        name: user.name,
        phone: user.phone,
        email: user.email,
      };
    }
  } else if (c?.name?.trim()) {
    // Find-or-create by name + phone/email
    const result = await findOrCreateCustomer({
      name: c.name,
      phone: c.phone,
      email: c.email || undefined,
      source: channelToSource(input.channel),
      createdBy,
    });

    userOid = result.user._id as mongoose.Types.ObjectId;
    customerSnapshot = {
      name: result.user.name,
      phone: result.user.phone,
      email: result.user.email,
    };
  } else {
    // Fully anonymous walk-in — snapshot only, no User doc
    customerSnapshot = { name: "Walk-in customer" };
  }

  /* ----- 2. Validate items + snapshot products ----- */

  const productIds = input.items.map(
    (i) => new mongoose.Types.ObjectId(i.product),
  );

  const products = await Product.find({
    _id: { $in: productIds },
    deletedAt: null,
  })
    .select("_id name sku costPrice stock")
    .lean<
      Array<{
        _id: mongoose.Types.ObjectId;
        name: { en: string; bn: string };
        sku?: string;
        costPrice?: number;
        stock: number;
      }>
    >();

  const productMap = new Map(products.map((p) => [String(p._id), p]));

  const orderItems: IOrderItem[] = [];

  for (const item of input.items) {
    const product = productMap.get(item.product);
    if (!product) {
      throw new BadRequestError(
        `Product ${item.product} does not exist or is archived`,
      );
    }

    const costPriceAtTime =
      item.costPriceAtTime > 0
        ? item.costPriceAtTime
        : (product.costPrice ?? 0);

    orderItems.push({
      product: product._id,
      nameSnapshot: product.name.en,
      skuSnapshot: product.sku ?? "",
      quantity: item.quantity,
      priceAtTime: item.priceAtTime,
      costPriceAtTime,
      discount: item.discount ?? 0,
      lineTotal: 0,
    });
  }

  /* ----- 3. Totals ----- */

  const totals = calculateOrderTotals(
    orderItems.map((i) => ({
      quantity: i.quantity,
      priceAtTime: i.priceAtTime,
      costPriceAtTime: i.costPriceAtTime,
      discount: i.discount,
    })),
    input.shippingFee ?? 0,
  );

  /* ----- 4. Order number ----- */

  const orderNumber = await generateOrderNumber(Order);

  /* ----- 5. Insert ----- */

  const createdByOid =
    createdBy && mongoose.Types.ObjectId.isValid(createdBy)
      ? new mongoose.Types.ObjectId(createdBy)
      : undefined;

  const doc = await Order.create({
    orderNumber,
    channel: input.channel,
    user: userOid,
    customerSnapshot,
    items: orderItems,
    subtotal: totals.subtotal,
    discountTotal: totals.discountTotal,
    taxTotal: totals.taxTotal,
    shippingFee: totals.shippingFee,
    totalAmount: totals.totalAmount,
    costTotal: totals.costTotal,
    profitTotal: totals.profitTotal,
    status: input.status,
    paymentStatus: input.paymentStatus,
    paymentMethod: input.paymentMethod,
    shippingAddress: input.shippingAddress,
    trackingNumber: input.trackingNumber,
    orderDate: new Date(),
    createdBy: createdByOid,
    notes: input.notes,
  });

  const populated = await Order.findById(doc._id)
    .populate(POPULATE)
    .lean<LeanOrder>();
  if (!populated) throw new NotFoundError("Order not found after create");

  return toOrderResponse(populated);
}

/* ============================================================
 * Update
 * ============================================================ */

export async function updateOrder(
  id: string,
  input: UpdateOrderInput,
): Promise<OrderResponse> {
  assertObjectId(id);

  const doc = await Order.findById(id);
  if (!doc) throw new NotFoundError("Order not found");
  if (doc.deletedAt) {
    throw new ConflictError("Cannot update an archived order");
  }

  if (input.status !== undefined) doc.status = input.status;
  if (input.paymentStatus !== undefined) {
    doc.paymentStatus = input.paymentStatus;
  }
  if (input.paymentMethod !== undefined) {
    doc.paymentMethod =
      input.paymentMethod === null ? undefined : input.paymentMethod;
  }
  if (input.trackingNumber !== undefined) {
    doc.trackingNumber =
      input.trackingNumber === null ? undefined : input.trackingNumber;
  }
  if (input.deliveredDate !== undefined) {
    doc.deliveredDate = input.deliveredDate
      ? new Date(input.deliveredDate)
      : undefined;
  }
  if (input.notes !== undefined) {
    doc.notes = input.notes === null ? undefined : input.notes;
  }

  if (input.status === "delivered" && !doc.deliveredDate) {
    doc.deliveredDate = new Date();
  }

  await doc.save();

  const populated = await Order.findById(doc._id)
    .populate(POPULATE)
    .lean<LeanOrder>();
  if (!populated) throw new NotFoundError("Order not found after update");

  return toOrderResponse(populated);
}

/* ============================================================
 * Archive / Restore / Permanent delete
 * ============================================================ */

export async function archiveOrder(id: string): Promise<{ _id: string }> {
  assertObjectId(id);

  const doc = await Order.findById(id);
  if (!doc) throw new NotFoundError("Order not found");
  if (doc.deletedAt) throw new ConflictError("Order is already archived");

  doc.deletedAt = new Date();
  await doc.save();

  return { _id: id };
}

export async function restoreOrder(id: string): Promise<OrderResponse> {
  assertObjectId(id);

  const doc = await Order.findById(id);
  if (!doc) throw new NotFoundError("Order not found");
  if (!doc.deletedAt) throw new ConflictError("Order is not archived");

  doc.deletedAt = null;
  await doc.save();

  const populated = await Order.findById(doc._id)
    .populate(POPULATE)
    .lean<LeanOrder>();
  if (!populated) throw new NotFoundError("Order not found after restore");

  return toOrderResponse(populated);
}

export async function permanentDeleteOrder(
  id: string,
): Promise<{ _id: string }> {
  assertObjectId(id);

  const doc = await Order.findById(id).select("_id deletedAt");
  if (!doc) throw new NotFoundError("Order not found");
  if (!doc.deletedAt) {
    throw new ConflictError(
      "Order must be archived before it can be permanently deleted",
    );
  }

  await Order.deleteOne({ _id: id });
  return { _id: id };
}

/* ============================================================
 * Stats
 * ============================================================ */

export type OrderStatsRange = "today" | "7d" | "30d" | "all";

export type OrderStats = {
  range: OrderStatsRange;
  from: string | null;
  to: string;
  orderCount: number;
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  averageOrderValue: number;
  byChannel: Record<OrderChannel, number>;
  byStatus: Record<OrderStatus, number>;
  byPaymentStatus: Record<PaymentStatus, number>;
};

function resolveStatsRange(range: OrderStatsRange): {
  from: Date | null;
  to: Date;
} {
  const to = new Date();
  const from = new Date();

  switch (range) {
    case "today":
      from.setHours(0, 0, 0, 0);
      return { from, to };
    case "7d":
      from.setDate(from.getDate() - 6);
      from.setHours(0, 0, 0, 0);
      return { from, to };
    case "30d":
      from.setDate(from.getDate() - 29);
      from.setHours(0, 0, 0, 0);
      return { from, to };
    case "all":
    default:
      return { from: null, to };
  }
}

export async function getOrderStats(
  range: OrderStatsRange = "30d",
): Promise<OrderStats> {
  const { from, to } = resolveStatsRange(range);

  const dateMatch: Record<string, unknown> = {};
  if (from) dateMatch.$gte = from;
  dateMatch.$lte = to;

  const match: Record<string, unknown> = {
    deletedAt: null,
    orderDate: dateMatch,
    status: { $nin: ["cancelled", "returned"] },
  };

  const [summaryRows, byChannelRows, byStatusRows, byPaymentRows] =
    await Promise.all([
      Order.aggregate<{
        _id: null;
        orderCount: number;
        totalRevenue: number;
        totalCost: number;
        totalProfit: number;
      }>([
        { $match: match },
        {
          $group: {
            _id: null,
            orderCount: { $sum: 1 },
            totalRevenue: { $sum: "$totalAmount" },
            totalCost: { $sum: "$costTotal" },
            totalProfit: { $sum: "$profitTotal" },
          },
        },
      ]),

      Order.aggregate<{ _id: OrderChannel; count: number }>([
        { $match: match },
        { $group: { _id: "$channel", count: { $sum: 1 } } },
      ]),

      Order.aggregate<{ _id: OrderStatus; count: number }>([
        { $match: { deletedAt: null, orderDate: dateMatch } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),

      Order.aggregate<{ _id: PaymentStatus; count: number }>([
        { $match: { deletedAt: null, orderDate: dateMatch } },
        { $group: { _id: "$paymentStatus", count: { $sum: 1 } } },
      ]),
    ]);

  const summary = summaryRows[0] ?? {
    orderCount: 0,
    totalRevenue: 0,
    totalCost: 0,
    totalProfit: 0,
  };

  const byChannel: Record<OrderChannel, number> = {
    online: 0,
    pos: 0,
    "walk-in": 0,
    phone: 0,
    facebook: 0,
    whatsapp: 0,
  };
  for (const row of byChannelRows) byChannel[row._id] = row.count;

  const byStatus: Record<OrderStatus, number> = {
    pending: 0,
    confirmed: 0,
    processing: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
    returned: 0,
  };
  for (const row of byStatusRows) byStatus[row._id] = row.count;

  const byPaymentStatus: Record<PaymentStatus, number> = {
    pending: 0,
    partial: 0,
    paid: 0,
    failed: 0,
    refunded: 0,
  };
  for (const row of byPaymentRows) byPaymentStatus[row._id] = row.count;

  return {
    range,
    from: from ? from.toISOString() : null,
    to: to.toISOString(),
    orderCount: summary.orderCount,
    totalRevenue: summary.totalRevenue,
    totalCost: summary.totalCost,
    totalProfit: summary.totalProfit,
    averageOrderValue:
      summary.orderCount > 0 ? summary.totalRevenue / summary.orderCount : 0,
    byChannel,
    byStatus,
    byPaymentStatus,
  };
}
