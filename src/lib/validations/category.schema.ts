// src/lib/validations/category.schema.ts

import { z } from "zod";
import {
  objectIdSchema,
  optionalSlugSchema,
  imageRefSchema,
  localizedTextSchema,
} from "./common.schema";

/* ============================================================
 * Shared spec template schema
 * ============================================================ */

const specTemplateSchema = z
  .array(
    z
      .string()
      .trim()
      .min(1, "Spec key cannot be empty")
      .max(80, "Spec key must be 80 characters or fewer"),
  )
  .max(50, "At most 50 spec keys")
  .default([]);

/* ============================================================
 * Base fields
 * ============================================================ */

const categoryBase = {
  name: localizedTextSchema,

  slug: optionalSlugSchema,

  description: z
    .string()
    .trim()
    .max(500, "Description must be 500 characters or fewer")
    .optional()
    .or(z.literal("")),

  parent: objectIdSchema.nullable().optional(),

  image: imageRefSchema.optional(),

  specTemplate: specTemplateSchema,

  order: z.coerce.number().int().min(0).default(0),

  isActive: z.boolean().default(true),
};

/* ============================================================
 * Create
 * ============================================================ */

export const createCategorySchema = z.object(categoryBase);

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;

/* ============================================================
 * Update
 * ============================================================ */

export const updateCategorySchema = z.object({
  name: localizedTextSchema.optional(),
  slug: optionalSlugSchema,
  description: categoryBase.description,
  parent: categoryBase.parent,
  image: categoryBase.image,
  specTemplate: specTemplateSchema.optional(),
  order: z.coerce.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;

/* ============================================================
 * List query
 * ============================================================ */

const booleanFromString = z
  .enum(["true", "false"])
  .transform((v) => v === "true");

export const categoryListQuerySchema = z.object({
  q: z.string().trim().optional(),
  parent: objectIdSchema.or(z.literal("root")).optional(),
  isActive: booleanFromString.optional(),
  includeDeleted: booleanFromString.default(false),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  sortBy: z.enum(["name", "order", "createdAt", "updatedAt"]).default("order"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
});

export type CategoryListQuery = z.infer<typeof categoryListQuerySchema>;

/* ============================================================
 * Suggest
 * ============================================================ */

export const categorySuggestQuerySchema = z.object({
  q: z.string().trim().min(1, "Query is required").max(80),
  limit: z.coerce.number().int().min(1).max(20).default(10),
});

export type CategorySuggestQuery = z.infer<typeof categorySuggestQuerySchema>;

/* ============================================================
 * Response
 * ============================================================ */

export const categoryResponseSchema = z.object({
  _id: z.string(),
  name: localizedTextSchema,
  slug: z.string(),
  description: z.string().optional().default(""),
  parent: z.union([z.string(), z.null()]).optional(),
  parentName: z.string().optional(),
  path: z.string().optional(),
  image: imageRefSchema.optional(),
  specTemplate: z.array(z.string()).default([]),
  order: z.number(),
  isActive: z.boolean(),
  productCount: z.number().optional(),
  deletedAt: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type CategoryResponse = z.infer<typeof categoryResponseSchema>;

/* ============================================================
 * Tree
 * ============================================================ */

export type CategoryTreeNode = CategoryResponse & {
  children: CategoryTreeNode[];
};
