// src/services/customer.service.ts

import mongoose from "mongoose";
import User, {
  type IUser,
  type CustomerSource,
  type UserRole,
  type UserStatus,
} from "@/models/User.model";
import Order from "@/models/Order.model";
import { NotFoundError, ConflictError, BadRequestError } from "@/lib/errors";
import type {
  CreateCustomerInput,
  UpdateCustomerInput,
  CustomerListQuery,
  CustomerResponse,
  CustomerSuggestQuery,
  CustomerStats,
} from "@/lib/validations/customer.schema";

/* ============================================================
 * Internal types
 * ============================================================ */

type LeanUser = {
  _id: mongoose.Types.ObjectId;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  role: UserRole;
  isShadow: boolean;
  source: CustomerSource;
  tags: string[];
  notes?: string;
  status: UserStatus;
  lastLogin?: Date | null;
  createdBy?:
    | mongoose.Types.ObjectId
    | { _id: mongoose.Types.ObjectId; name: string }
    | null;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type OrderStats = {
  orderCount: number;
  lifetimeValue: number;
  lastOrderAt: Date | null;
};

const NON_SALES_STATUSES = ["cancelled", "returned"] as const;

/* ============================================================
 * Response mapping
 * ============================================================ */

function toCustomerResponse(
  doc: LeanUser,
  stats?: OrderStats,
): CustomerResponse {
  let createdByOut: string | { _id: string; name: string } | null | undefined =
    undefined;

  if (doc.createdBy instanceof mongoose.Types.ObjectId) {
    createdByOut = String(doc.createdBy);
  } else if (doc.createdBy && typeof doc.createdBy === "object") {
    createdByOut = {
      _id: String(doc.createdBy._id),
      name: doc.createdBy.name,
    };
  } else {
    createdByOut = null;
  }

  return {
    _id: String(doc._id),
    name: doc.name,
    email: doc.email,
    phone: doc.phone,
    address: doc.address,
    role: doc.role,
    isShadow: doc.isShadow,
    source: doc.source,
    tags: doc.tags ?? [],
    notes: doc.notes,
    status: doc.status,
    lastLogin: doc.lastLogin ? doc.lastLogin.toISOString() : null,
    createdBy: createdByOut,
    deletedAt: doc.deletedAt ? doc.deletedAt.toISOString() : null,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
    orderCount: stats?.orderCount,
    lifetimeValue: stats?.lifetimeValue,
    lastOrderAt: stats?.lastOrderAt ? stats.lastOrderAt.toISOString() : null,
  };
}

/* ============================================================
 * Helpers
 * ============================================================ */

function assertObjectId(id: string, label = "customer"): void {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new BadRequestError(`Invalid ${label} id`);
  }
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function mapDuplicateKey(err: unknown): never {
  if (typeof err === "object" && err !== null && "code" in err) {
    const e = err as { code?: number; keyPattern?: Record<string, unknown> };
    if (e.code === 11000) {
      const key = e.keyPattern ? Object.keys(e.keyPattern)[0] : "";
      if (key === "email") {
        throw new ConflictError("This email is already in use");
      }
      if (key === "phone") {
        throw new ConflictError("This phone number is already in use");
      }
      throw new ConflictError("Duplicate value detected");
    }
  }
  throw err;
}

/* ============================================================
 * Order stats batch lookup
 * ============================================================ */

async function loadOrderStats(
  userIds: mongoose.Types.ObjectId[],
): Promise<Map<string, OrderStats>> {
  if (userIds.length === 0) return new Map();

  const rows = await Order.aggregate<{
    _id: mongoose.Types.ObjectId;
    orderCount: number;
    lifetimeValue: number;
    lastOrderAt: Date;
  }>([
    {
      $match: {
        user: { $in: userIds },
        deletedAt: null,
        status: { $nin: [...NON_SALES_STATUSES] },
      },
    },
    {
      $group: {
        _id: "$user",
        orderCount: { $sum: 1 },
        lifetimeValue: { $sum: "$totalAmount" },
        lastOrderAt: { $max: "$orderDate" },
      },
    },
  ]);

  const map = new Map<string, OrderStats>();
  for (const r of rows) {
    map.set(String(r._id), {
      orderCount: r.orderCount,
      lifetimeValue: r.lifetimeValue,
      lastOrderAt: r.lastOrderAt,
    });
  }
  return map;
}

/* ============================================================
 * List
 * ============================================================ */

export async function listCustomers(query: CustomerListQuery): Promise<{
  items: CustomerResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> {
  const filter: Record<string, unknown> = {};

  if (!query.includeDeleted) {
    filter.deletedAt = null;
  }

  if (query.q) {
    const rx = new RegExp(escapeRegex(query.q), "i");
    filter.$or = [{ name: rx }, { email: rx }, { phone: rx }];
  }

  if (query.role) filter.role = query.role;
  if (query.source) filter.source = query.source;
  if (query.status) filter.status = query.status;

  if (query.tags) {
    const tagList = query.tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    if (tagList.length > 0) {
      filter.tags = { $in: tagList };
    }
  }

  /* Sorting: DB-side for user fields; in-memory for computed fields */

  const isComputedSort =
    query.sortBy === "orderCount" || query.sortBy === "lifetimeValue";

  const dbSortField =
    query.sortBy === "orderCount" || query.sortBy === "lifetimeValue"
      ? "createdAt" // placeholder; re-sorted after merge
      : query.sortBy === "name"
        ? "name"
        : query.sortBy;

  const sortDir: 1 | -1 = query.sortOrder === "asc" ? 1 : -1;

  const skip = (query.page - 1) * query.limit;

  /* If sorting by a computed field, fetch without pagination and
     sort in memory. At a few thousand customers this is fine;
     migrate to an aggregation-based approach if we ever exceed. */

  if (isComputedSort) {
    const allDocs = await User.find(filter)
      .sort({ createdAt: -1 })
      .lean<LeanUser[]>();

    const idList = allDocs.map((d) => d._id);
    const statsMap = await loadOrderStats(idList);

    const enriched = allDocs.map((d) =>
      toCustomerResponse(d, statsMap.get(String(d._id))),
    );

    enriched.sort((a, b) => {
      const av =
        (query.sortBy === "orderCount" ? a.orderCount : a.lifetimeValue) ?? 0;
      const bv =
        (query.sortBy === "orderCount" ? b.orderCount : b.lifetimeValue) ?? 0;
      return sortDir === 1 ? av - bv : bv - av;
    });

    const total = enriched.length;
    const slice = enriched.slice(skip, skip + query.limit);

    return {
      items: slice,
      total,
      page: query.page,
      limit: query.limit,
      totalPages: Math.max(1, Math.ceil(total / query.limit)),
    };
  }

  /* Standard DB-side pagination */

  const [docs, total] = await Promise.all([
    User.find(filter)
      .sort({ [dbSortField]: sortDir })
      .skip(skip)
      .limit(query.limit)
      .lean<LeanUser[]>(),
    User.countDocuments(filter),
  ]);

  const ids = docs.map((d) => d._id);
  const statsMap = await loadOrderStats(ids);

  const items = docs.map((d) =>
    toCustomerResponse(d, statsMap.get(String(d._id))),
  );

  return {
    items,
    total,
    page: query.page,
    limit: query.limit,
    totalPages: Math.max(1, Math.ceil(total / query.limit)),
  };
}

/* ============================================================
 * Get by ID
 * ============================================================ */

export async function getCustomerById(id: string): Promise<CustomerResponse> {
  assertObjectId(id);

  const doc = await User.findById(id)
    .populate({ path: "createdBy", select: "_id name" })
    .lean<LeanUser | null>();

  if (!doc) throw new NotFoundError("Customer not found");

  const statsMap = await loadOrderStats([doc._id]);

  return toCustomerResponse(doc, statsMap.get(String(doc._id)));
}

/* ============================================================
 * Create
 * ============================================================ */

export async function createCustomer(
  input: CreateCustomerInput,
  createdBy?: string,
): Promise<CustomerResponse> {
  const createdByOid =
    createdBy && mongoose.Types.ObjectId.isValid(createdBy)
      ? new mongoose.Types.ObjectId(createdBy)
      : undefined;

  try {
    const doc = await User.create({
      name: input.name.trim(),
      email: input.email?.trim().toLowerCase() || undefined,
      phone: input.phone?.trim() || undefined,
      address: input.address?.trim() || undefined,
      role: input.role,
      isShadow: true, // admin-created customers never have credentials
      source: input.source,
      tags: dedupeTags(input.tags ?? []),
      notes: input.notes?.trim() || undefined,
      status: input.status,
      createdBy: createdByOid,
    });

    return toCustomerResponse(doc.toObject() as LeanUser);
  } catch (err) {
    mapDuplicateKey(err);
  }
}

/* ============================================================
 * Update
 * ============================================================ */

export async function updateCustomer(
  id: string,
  input: UpdateCustomerInput,
): Promise<CustomerResponse> {
  assertObjectId(id);

  const doc = await User.findById(id);
  if (!doc) throw new NotFoundError("Customer not found");

  if (input.name !== undefined) doc.name = input.name.trim();

  if (input.email !== undefined) {
    doc.email =
      input.email === null || input.email === ""
        ? undefined
        : input.email.trim().toLowerCase();
  }

  if (input.phone !== undefined) {
    doc.phone =
      input.phone === null || input.phone === ""
        ? undefined
        : input.phone.trim();
  }

  if (input.address !== undefined) {
    doc.address =
      input.address === null || input.address === ""
        ? undefined
        : input.address.trim();
  }

  if (input.source !== undefined) doc.source = input.source;
  if (input.role !== undefined) doc.role = input.role;
  if (input.tags !== undefined) doc.tags = dedupeTags(input.tags);
  if (input.notes !== undefined) {
    doc.notes =
      input.notes === null || input.notes === ""
        ? undefined
        : input.notes.trim();
  }
  if (input.status !== undefined) doc.status = input.status;

  try {
    await doc.save();
  } catch (err) {
    mapDuplicateKey(err);
  }

  const populated = await User.findById(doc._id)
    .populate({ path: "createdBy", select: "_id name" })
    .lean<LeanUser>();

  if (!populated) throw new NotFoundError("Customer not found after update");

  const statsMap = await loadOrderStats([populated._id]);
  return toCustomerResponse(populated, statsMap.get(String(populated._id)));
}

/* ============================================================
 * Archive / Restore / Permanent delete
 * ============================================================ */

export async function archiveCustomer(id: string): Promise<{ _id: string }> {
  assertObjectId(id);

  const doc = await User.findById(id);
  if (!doc) throw new NotFoundError("Customer not found");
  if (doc.deletedAt) throw new ConflictError("Customer is already archived");

  doc.deletedAt = new Date();
  doc.status = "inactive";
  await doc.save();

  return { _id: id };
}

export async function restoreCustomer(id: string): Promise<CustomerResponse> {
  assertObjectId(id);

  const doc = await User.findById(id);
  if (!doc) throw new NotFoundError("Customer not found");
  if (!doc.deletedAt) throw new ConflictError("Customer is not archived");

  doc.deletedAt = null;
  doc.status = "active";
  await doc.save();

  const populated = await User.findById(doc._id)
    .populate({ path: "createdBy", select: "_id name" })
    .lean<LeanUser>();

  if (!populated) throw new NotFoundError("Customer not found after restore");

  return toCustomerResponse(populated);
}

export async function permanentDeleteCustomer(
  id: string,
): Promise<{ _id: string }> {
  assertObjectId(id);

  const doc = await User.findById(id).select("_id deletedAt role");
  if (!doc) throw new NotFoundError("Customer not found");
  if (!doc.deletedAt) {
    throw new ConflictError(
      "Customer must be archived before it can be permanently deleted",
    );
  }
  if (doc.role !== "customer") {
    throw new BadRequestError(
      "Only customer accounts can be permanently deleted",
    );
  }

  // Block if any orders reference this user — order history must
  // survive the customer's deletion.
  const orderCount = await Order.countDocuments({ user: doc._id });
  if (orderCount > 0) {
    throw new ConflictError(
      `Cannot delete: ${orderCount} order${orderCount === 1 ? "" : "s"} reference this customer. Archive them instead.`,
    );
  }

  await User.deleteOne({ _id: id });
  return { _id: id };
}

/* ============================================================
 * Suggest (fast autocomplete)
 * ============================================================ */

export async function suggestCustomers(
  query: CustomerSuggestQuery,
): Promise<CustomerResponse[]> {
  const rx = new RegExp(escapeRegex(query.q), "i");

  const docs = await User.find({
    deletedAt: null,
    role: "customer",
    $or: [{ name: rx }, { email: rx }, { phone: rx }],
  })
    .sort({ name: 1 })
    .limit(query.limit)
    .lean<LeanUser[]>();

  return docs.map((d) => toCustomerResponse(d));
}

/* ============================================================
 * Stats (detail page)
 * ============================================================ */

export async function getCustomerStats(id: string): Promise<CustomerStats> {
  assertObjectId(id);

  const userOid = new mongoose.Types.ObjectId(id);

  const [totalsRows, channelRows, recentDocs] = await Promise.all([
    Order.aggregate<{
      orderCount: number;
      lifetimeValue: number;
      totalProfit: number;
      firstOrderAt: Date | null;
      lastOrderAt: Date | null;
    }>([
      {
        $match: {
          user: userOid,
          deletedAt: null,
          status: { $nin: [...NON_SALES_STATUSES] },
        },
      },
      {
        $group: {
          _id: null,
          orderCount: { $sum: 1 },
          lifetimeValue: { $sum: "$totalAmount" },
          totalProfit: { $sum: "$profitTotal" },
          firstOrderAt: { $min: "$orderDate" },
          lastOrderAt: { $max: "$orderDate" },
        },
      },
    ]),

    Order.aggregate<{ _id: string; count: number }>([
      {
        $match: {
          user: userOid,
          deletedAt: null,
          status: { $nin: [...NON_SALES_STATUSES] },
        },
      },
      { $group: { _id: "$channel", count: { $sum: 1 } } },
    ]),

    Order.find({ user: userOid, deletedAt: null })
      .sort({ orderDate: -1 })
      .limit(10)
      .select("orderNumber channel status paymentStatus totalAmount orderDate")
      .lean<
        Array<{
          _id: mongoose.Types.ObjectId;
          orderNumber: string;
          channel: string;
          status: string;
          paymentStatus: string;
          totalAmount: number;
          orderDate: Date;
        }>
      >(),
  ]);

  const t = totalsRows[0] ?? {
    orderCount: 0,
    lifetimeValue: 0,
    totalProfit: 0,
    firstOrderAt: null,
    lastOrderAt: null,
  };

  const byChannel: Record<string, number> = {};
  for (const r of channelRows) byChannel[r._id] = r.count;

  const recentOrders = recentDocs.map((o) => ({
    orderId: String(o._id),
    orderNumber: o.orderNumber,
    channel: o.channel,
    status: o.status,
    paymentStatus: o.paymentStatus,
    totalAmount: o.totalAmount,
    orderDate: o.orderDate.toISOString(),
  }));

  return {
    customerId: id,
    totals: {
      orderCount: t.orderCount,
      lifetimeValue: t.lifetimeValue,
      averageOrderValue: t.orderCount > 0 ? t.lifetimeValue / t.orderCount : 0,
      totalProfit: t.totalProfit,
    },
    firstOrderAt: t.firstOrderAt ? t.firstOrderAt.toISOString() : null,
    lastOrderAt: t.lastOrderAt ? t.lastOrderAt.toISOString() : null,
    byChannel,
    recentOrders,
  };
}

/* ============================================================
 * Internal
 * ============================================================ */

function dedupeTags(tags: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of tags) {
    const t = raw.trim().toLowerCase();
    if (!t) continue;
    if (seen.has(t)) continue;
    seen.add(t);
    out.push(t);
  }
  return out;
}

/* Convenience type re-exports for callers that only import the service. */
export type { IUser };
