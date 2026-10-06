// src/lib/validations/order.schema.ts

import { z } from "zod";
import { objectIdSchema } from "./common.schema";

/* ============================================================
 * Enums — must match the model
 * ============================================================ */

export const orderChannelSchema = z.enum(["online", "pos", "phone", "walk-in"]);

export const orderStatusSchema = z.enum([
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "returned",
]);

export const paymentStatusSchema = z.enum([
  "pending",
  "partial",
  "paid",
  "failed",
  "refunded",
]);

export const paymentMethodSchema = z.enum([
  "cash",
  "mobile_payment",
  "cod",
  "card",
  "bank_transfer",
]);

/* ============================================================
 * Order item
 * ============================================================ */

export const orderItemInputSchema = z.object({
  product: objectIdSchema,
  quantity: z.coerce.number().int().min(1),
  priceAtTime: z.coerce.number().nonnegative(),
  costPriceAtTime: z.coerce.number().nonnegative().default(0),
  discount: z.coerce.number().nonnegative().default(0),
});

export type OrderItemInput = z.infer<typeof orderItemInputSchema>;

/* ============================================================
 * Customer snapshot
 * ============================================================ */

export const customerSnapshotSchema = z.object({
  name: z.string().trim().min(1).max(120),
  phone: z.string().trim().max(40).optional(),
  email: z.string().trim().email().optional().or(z.literal("")),
});

export type CustomerSnapshotInput = z.infer<typeof customerSnapshotSchema>;

/* ============================================================
 * Create order
 * ============================================================ */

export const createOrderSchema = z.object({
  channel: orderChannelSchema.default("online"),

  user: objectIdSchema.optional(),
  guestEmail: z.string().trim().email().optional().or(z.literal("")),
  guestName: z.string().trim().max(120).optional(),
  guestPhone: z.string().trim().max(40).optional(),
  customerSnapshot: customerSnapshotSchema.optional(),

  items: z
    .array(orderItemInputSchema)
    .min(1, "Order must have at least one item"),

  shippingFee: z.coerce.number().nonnegative().default(0),

  status: orderStatusSchema.default("pending"),
  paymentStatus: paymentStatusSchema.default("pending"),
  paymentMethod: paymentMethodSchema.optional(),

  shippingAddress: z.string().trim().max(500).optional(),
  trackingNumber: z.string().trim().max(120).optional(),

  notes: z.string().trim().max(1000).optional(),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

/* ============================================================
 * Update order — statuses + notes + tracking only
 * ============================================================ */

export const updateOrderSchema = z.object({
  status: orderStatusSchema.optional(),
  paymentStatus: paymentStatusSchema.optional(),
  paymentMethod: paymentMethodSchema.nullable().optional(),
  trackingNumber: z.string().trim().max(120).nullable().optional(),
  deliveredDate: z.string().datetime().nullable().optional(),
  notes: z.string().trim().max(1000).nullable().optional(),
});

export type UpdateOrderInput = z.infer<typeof updateOrderSchema>;

/* ============================================================
 * List query
 * ============================================================ */

const booleanFromString = z
  .enum(["true", "false"])
  .transform((v) => v === "true");

export const orderListQuerySchema = z.object({
  q: z.string().trim().optional(),

  channel: orderChannelSchema.optional(),
  status: orderStatusSchema.optional(),
  paymentStatus: paymentStatusSchema.optional(),
  paymentMethod: paymentMethodSchema.optional(),

  product: objectIdSchema.optional(),
  user: objectIdSchema.optional(),
  createdBy: objectIdSchema.optional(),

  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),

  includeDeleted: booleanFromString.default(false),

  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),

  sortBy: z
    .enum(["orderDate", "totalAmount", "profitTotal", "createdAt"])
    .default("orderDate"),

  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type OrderListQuery = z.infer<typeof orderListQuerySchema>;

/* ============================================================
 * Response
 * ============================================================ */

export const orderItemResponseSchema = z.object({
  product: z.union([
    z.string(),
    z.object({
      _id: z.string(),
      name: z.object({ en: z.string(), bn: z.string() }),
      slug: z.string(),
      images: z
        .array(
          z.object({
            url: z.string(),
            publicId: z.string(),
            alt: z.string().optional(),
          }),
        )
        .optional(),
    }),
  ]),
  nameSnapshot: z.string(),
  skuSnapshot: z.string(),
  quantity: z.number(),
  priceAtTime: z.number(),
  costPriceAtTime: z.number(),
  discount: z.number(),
  lineTotal: z.number(),
});

export const orderResponseSchema = z.object({
  _id: z.string(),
  orderNumber: z.string(),
  channel: orderChannelSchema,

  user: z.union([z.string(), z.null()]).optional(),
  guestEmail: z.string().optional(),
  guestName: z.string().optional(),
  guestPhone: z.string().optional(),
  customerSnapshot: customerSnapshotSchema.optional(),

  items: z.array(orderItemResponseSchema),

  subtotal: z.number(),
  discountTotal: z.number(),
  taxTotal: z.number(),
  shippingFee: z.number(),
  totalAmount: z.number(),

  costTotal: z.number(),
  profitTotal: z.number(),

  status: orderStatusSchema,
  paymentStatus: paymentStatusSchema,
  paymentMethod: paymentMethodSchema.optional(),

  shippingAddress: z.string().optional(),
  trackingNumber: z.string().optional(),
  orderDate: z.string(),
  deliveredDate: z.string().nullable().optional(),

  createdBy: z
    .union([
      z.string(),
      z.object({
        _id: z.string(),
        name: z.string().optional(),
        email: z.string().optional(),
      }),
    ])
    .nullable()
    .optional(),
  notes: z.string().optional(),

  deletedAt: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type OrderResponse = z.infer<typeof orderResponseSchema>;
