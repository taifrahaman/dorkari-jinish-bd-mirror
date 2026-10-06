// src/lib/validations/product.schema.ts

import { z } from "zod";
import {
  objectIdSchema,
  optionalSlugSchema,
  imageRefSchema,
  localizedTextSchema,
  localizedTextOptionalSchema,
} from "./common.schema";

/* ============================================================
 * Colors
 * ============================================================ */

export const productColorSchema = z.object({
  hex: z
    .string()
    .trim()
    .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "Invalid hex color"),
  name: localizedTextOptionalSchema.optional(),
});

export type ProductColorInput = z.infer<typeof productColorSchema>;

/* ============================================================
 * Supplier
 *
 * All fields optional at the Zod layer. Empty supplier is
 * normalized to `undefined` by the service layer. If any field
 * is filled but `name` is empty, the service raises a clear
 * error — see `normalizeSupplier()` in product.service.ts.
 *
 * Kept as a plain object (no preprocess/transform) so that
 * react-hook-form can infer nested field paths like
 * "supplier.name" for register().
 * ============================================================ */

export const productSupplierSchema = z.object({
  name: z.string().trim().max(120).optional().or(z.literal("")),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  email: z.string().trim().email("Invalid email").optional().or(z.literal("")),
  address: z.string().trim().max(300).optional().or(z.literal("")),
});

export type ProductSupplierInput = z.infer<typeof productSupplierSchema>;

/* ============================================================
 * Specifications
 * ============================================================ */

export const specificationsSchema = z
  .record(z.string().trim().min(1), z.string().trim())
  .default({});

/* ============================================================
 * Shared numeric helpers
 * ============================================================ */

const nonNegativeNumber = z.coerce.number().nonnegative("Must be 0 or greater");

const optionalNonNegative = z.preprocess(
  (v) => (v === "" || v === null ? undefined : v),
  nonNegativeNumber.optional(),
);

/* ============================================================
 * Create
 * ============================================================ */

const MAX_IMAGES = 10;

export const createProductSchema = z.object({
  name: localizedTextSchema,
  slug: optionalSlugSchema,
  description: localizedTextOptionalSchema.optional(),

  price: nonNegativeNumber,
  compareAtPrice: optionalNonNegative,
  costPrice: optionalNonNegative,
  taxRate: z.coerce.number().min(0).max(100).optional(),

  category: objectIdSchema,
  brand: objectIdSchema.optional(),

  stock: z.coerce.number().int().min(0).default(0),
  lowStockThreshold: z.coerce.number().int().min(0).optional(),

  images: z.array(imageRefSchema).max(MAX_IMAGES).default([]),

  colors: z.array(productColorSchema).default([]),

  sku: z.string().trim().max(50).optional(),
  barcode: z.string().trim().max(80).optional(),

  weight: z.string().trim().max(50).optional(),
  dimensions: z.string().trim().max(80).optional(),

  specifications: specificationsSchema,

  supplier: productSupplierSchema.optional(),

  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;

/* ============================================================
 * Update
 * ============================================================ */

export const updateProductSchema = z.object({
  name: localizedTextSchema.optional(),
  slug: optionalSlugSchema,
  description: localizedTextOptionalSchema.optional(),

  price: nonNegativeNumber.optional(),
  compareAtPrice: nonNegativeNumber.nullable().optional(),
  costPrice: nonNegativeNumber.nullable().optional(),
  taxRate: z.coerce.number().min(0).max(100).nullable().optional(),

  category: objectIdSchema.optional(),
  brand: objectIdSchema.nullable().optional(),

  stock: z.coerce.number().int().min(0).optional(),
  lowStockThreshold: z.coerce.number().int().min(0).nullable().optional(),

  images: z.array(imageRefSchema).max(MAX_IMAGES).optional(),
  colors: z.array(productColorSchema).optional(),

  sku: z.string().trim().max(50).optional(),
  barcode: z.string().trim().max(80).nullable().optional(),

  weight: z.string().trim().max(50).nullable().optional(),
  dimensions: z.string().trim().max(80).nullable().optional(),

  specifications: z.record(z.string(), z.string()).optional(),

  supplier: productSupplierSchema.nullable().optional(),

  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
});

export type UpdateProductInput = z.infer<typeof updateProductSchema>;

/* ============================================================
 * List query
 * ============================================================ */

const booleanFromString = z
  .enum(["true", "false"])
  .transform((v) => v === "true");

export const productListQuerySchema = z.object({
  q: z.string().trim().optional(),

  category: objectIdSchema.optional(),
  mainCategory: objectIdSchema.optional(),
  brand: objectIdSchema.optional(),

  isActive: booleanFromString.optional(),
  isFeatured: booleanFromString.optional(),

  stockStatus: z.enum(["in", "low", "out"]).optional(),

  minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().nonnegative().optional(),

  includeDeleted: booleanFromString.default(false),

  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),

  sortBy: z
    .enum([
      "name",
      "price",
      "costPrice",
      "stock",
      "createdAt",
      "updatedAt",
      "averageRating",
    ])
    .default("createdAt"),

  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type ProductListQuery = z.infer<typeof productListQuerySchema>;

/* ============================================================
 * Cost history entry (read-only)
 * ============================================================ */

export const costHistoryEntrySchema = z.object({
  cost: z.number(),
  changedAt: z.string(),
  changedBy: z
    .object({
      _id: z.string(),
      name: z.string().optional(),
      email: z.string().optional(),
    })
    .optional(),
  note: z.string().optional(),
});

export type CostHistoryEntry = z.infer<typeof costHistoryEntrySchema>;

/* ============================================================
 * Response
 * ============================================================ */

export const productResponseSchema = z.object({
  _id: z.string(),

  name: localizedTextSchema,
  slug: z.string(),
  sku: z.string().optional(),
  barcode: z.string().optional(),

  description: localizedTextOptionalSchema.optional(),

  price: z.number(),
  compareAtPrice: z.number().nullable().optional(),
  costPrice: z.number().nullable().optional(),
  taxRate: z.number().optional(),

  category: z.union([
    z.string(),
    z.object({
      _id: z.string(),
      name: z.string(),
      slug: z.string(),
    }),
  ]),

  mainCategory: z
    .union([
      z.string(),
      z.object({
        _id: z.string(),
        name: z.string(),
        slug: z.string(),
      }),
    ])
    .optional(),

  brand: z
    .union([
      z.string(),
      z.object({
        _id: z.string(),
        name: z.string(),
        slug: z.string(),
      }),
    ])
    .nullable()
    .optional(),

  stock: z.number(),
  lowStockThreshold: z.number().optional(),

  images: z.array(imageRefSchema),
  colors: z.array(productColorSchema),

  weight: z.string().optional(),
  dimensions: z.string().optional(),

  specifications: z.record(z.string(), z.unknown()).optional(),

  supplier: productSupplierSchema.optional(),

  costHistory: z.array(costHistoryEntrySchema).optional(),

  totalSold: z.number().optional(),
  totalRevenue: z.number().optional(),

  isActive: z.boolean(),
  isFeatured: z.boolean(),

  averageRating: z.number(),
  totalReviews: z.number(),

  deletedAt: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type ProductResponse = z.infer<typeof productResponseSchema>;

/* ============================================================
 * Constants
 * ============================================================ */

export const LOW_STOCK_THRESHOLD = 5;
export const MAX_PRODUCT_IMAGES = MAX_IMAGES;
