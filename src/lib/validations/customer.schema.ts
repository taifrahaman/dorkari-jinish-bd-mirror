// src/lib/validations/customer.schema.ts

import { z } from "zod";

/* ============================================================
 * Enums — mirror the User model
 * ============================================================ */

export const customerRoleSchema = z.enum(["admin", "moderator", "customer"]);

export const customerStatusSchema = z.enum(["active", "inactive"]);

export const customerSourceSchema = z.enum([
  "online",
  "google",
  "walk-in",
  "phone",
  "facebook",
  "whatsapp",
  "manual",
  "import",
]);

export type CustomerSource = z.infer<typeof customerSourceSchema>;
export type CustomerRole = z.infer<typeof customerRoleSchema>;
export type CustomerStatus = z.infer<typeof customerStatusSchema>;

/* ============================================================
 * Tag
 * ============================================================ */

export const customerTagSchema = z
  .string()
  .trim()
  .min(1, "Tag cannot be empty")
  .max(50, "Tag must be 50 characters or fewer");

/* ============================================================
 * Create
 * ============================================================ */

export const createCustomerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(120, "Name must be 120 characters or fewer"),

  email: z.string().trim().email("Invalid email").optional().or(z.literal("")),

  phone: z.string().trim().max(40).optional().or(z.literal("")),

  address: z.string().trim().max(500).optional().or(z.literal("")),

  source: customerSourceSchema.default("manual"),

  role: customerRoleSchema.default("customer"),

  tags: z.array(customerTagSchema).max(20).default([]),

  notes: z.string().trim().max(2000).optional().or(z.literal("")),

  status: customerStatusSchema.default("active"),
});

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;

/* ============================================================
 * Update — all optional
 * ============================================================ */

export const updateCustomerSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),

  email: z
    .string()
    .trim()
    .email("Invalid email")
    .nullable()
    .optional()
    .or(z.literal("")),

  phone: z.string().trim().max(40).nullable().optional().or(z.literal("")),

  address: z.string().trim().max(500).nullable().optional().or(z.literal("")),

  source: customerSourceSchema.optional(),

  role: customerRoleSchema.optional(),

  tags: z.array(customerTagSchema).max(20).optional(),

  notes: z.string().trim().max(2000).nullable().optional().or(z.literal("")),

  status: customerStatusSchema.optional(),
});

export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;

/* ============================================================
 * List query
 * ============================================================ */

const booleanFromString = z
  .enum(["true", "false"])
  .transform((v) => v === "true");

export const customerListQuerySchema = z.object({
  q: z.string().trim().optional(),

  role: customerRoleSchema.optional(),
  source: customerSourceSchema.optional(),
  status: customerStatusSchema.optional(),

  /** Comma-separated tag list. Matches customers with ANY tag. */
  tags: z.string().trim().optional(),

  includeDeleted: booleanFromString.default(false),

  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),

  sortBy: z
    .enum(["name", "createdAt", "lastLogin", "orderCount", "lifetimeValue"])
    .default("createdAt"),

  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type CustomerListQuery = z.infer<typeof customerListQuerySchema>;

/* ============================================================
 * Suggest
 * ============================================================ */

export const customerSuggestQuerySchema = z.object({
  q: z.string().trim().min(1, "Query is required").max(80),
  limit: z.coerce.number().int().min(1).max(20).default(10),
});

export type CustomerSuggestQuery = z.infer<typeof customerSuggestQuerySchema>;

/* ============================================================
 * Response
 * ============================================================ */

export const customerResponseSchema = z.object({
  _id: z.string(),
  name: z.string(),
  email: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  role: customerRoleSchema,
  isShadow: z.boolean(),
  source: customerSourceSchema,
  tags: z.array(z.string()),
  notes: z.string().optional(),
  status: customerStatusSchema,
  lastLogin: z.string().nullable().optional(),

  createdBy: z
    .union([
      z.string(),
      z.object({
        _id: z.string(),
        name: z.string(),
      }),
    ])
    .nullable()
    .optional(),

  deletedAt: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),

  /** Computed from orders — populated in list & detail. */
  orderCount: z.number().optional(),
  lifetimeValue: z.number().optional(),
  lastOrderAt: z.string().nullable().optional(),
});

export type CustomerResponse = z.infer<typeof customerResponseSchema>;

/* ============================================================
 * Customer stats (detail page)
 * ============================================================ */

export const customerStatsRecentOrderSchema = z.object({
  orderId: z.string(),
  orderNumber: z.string(),
  channel: z.string(),
  status: z.string(),
  paymentStatus: z.string(),
  totalAmount: z.number(),
  orderDate: z.string(),
});

export const customerStatsSchema = z.object({
  customerId: z.string(),
  totals: z.object({
    orderCount: z.number(),
    lifetimeValue: z.number(),
    averageOrderValue: z.number(),
    totalProfit: z.number(),
  }),
  firstOrderAt: z.string().nullable(),
  lastOrderAt: z.string().nullable(),
  byChannel: z.record(z.string(), z.number()),
  recentOrders: z.array(customerStatsRecentOrderSchema),
});

export type CustomerStats = z.infer<typeof customerStatsSchema>;
