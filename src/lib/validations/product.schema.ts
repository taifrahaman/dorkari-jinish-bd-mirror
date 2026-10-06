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
 * Specifications
 * ============================================================ */

export const specificationsSchema = z
  .record(z.string().trim().min(1), z.string().trim())
  .default({});

/* ============================================================
 * Create
 * ============================================================ */

const MAX_IMAGES = 10;

export const createProductSchema = z.object({
  name: localizedTextSchema,

  slug: optionalSlugSchema,

  description: localizedTextOptionalSchema.optional(),

  price: z.coerce.number().nonnegative("Price must be 0 or greater"),

  compareAtPrice: z.coerce
    .number()
    .nonnegative("Compare-at price must be 0 or greater")
    .optional(),

  category: objectIdSchema,

  brand: objectIdSchema.optional(),

  stock: z.coerce.number().int().min(0).default(0),

  images: z
    .array(imageRefSchema)
    .max(MAX_IMAGES, `At most ${MAX_IMAGES} images are allowed`)
    .default([]),

  colors: z.array(productColorSchema).default([]),

  sku: z.string().trim().max(50).optional(),

  weight: z.string().trim().max(50).optional(),

  dimensions: z.string().trim().max(80).optional(),

  specifications: specificationsSchema,

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

  price: z.coerce.number().nonnegative().optional(),

  compareAtPrice: z.coerce.number().nonnegative().nullable().optional(),

  category: objectIdSchema.optional(),

  brand: objectIdSchema.nullable().optional(),

  stock: z.coerce.number().int().min(0).optional(),

  images: z.array(imageRefSchema).max(MAX_IMAGES).optional(),

  colors: z.array(productColorSchema).optional(),

  sku: z.string().trim().max(50).optional(),

  weight: z.string().trim().max(50).nullable().optional(),

  dimensions: z.string().trim().max(80).nullable().optional(),

  specifications: z.record(z.string(), z.string()).optional(),

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
    .enum(["name", "price", "stock", "createdAt", "updatedAt", "averageRating"])
    .default("createdAt"),

  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type ProductListQuery = z.infer<typeof productListQuerySchema>;

/* ============================================================
 * Response
 * ============================================================ */

export const productResponseSchema = z.object({
  _id: z.string(),

  name: localizedTextSchema,

  slug: z.string(),

  description: localizedTextOptionalSchema.optional(),

  price: z.number(),
  compareAtPrice: z.number().nullable().optional(),

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

  images: z.array(imageRefSchema),

  colors: z.array(productColorSchema),

  sku: z.string().optional(),

  weight: z.string().optional(),
  dimensions: z.string().optional(),

  specifications: z.record(z.string(), z.unknown()).optional(),

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
