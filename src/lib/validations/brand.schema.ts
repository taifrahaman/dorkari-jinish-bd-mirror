// src/lib/validations/brand.schema.ts

import { z } from "zod";
import {
  optionalSlugSchema,
  imageRefSchema,
  localizedTextSchema,
} from "./common.schema";

/* ============================================================
 * Base
 * ============================================================ */

const brandBase = {
  name: localizedTextSchema,
  slug: optionalSlugSchema,
  logo: imageRefSchema.optional(),
  isActive: z.boolean().default(true),
};

/* ============================================================
 * Create
 * ============================================================ */

export const createBrandSchema = z.object(brandBase);
export type CreateBrandInput = z.infer<typeof createBrandSchema>;

/* ============================================================
 * Update
 * ============================================================ */

export const updateBrandSchema = z.object({
  name: localizedTextSchema.optional(),
  slug: optionalSlugSchema,
  logo: imageRefSchema.nullable().optional(),
  isActive: z.boolean().optional(),
});
export type UpdateBrandInput = z.infer<typeof updateBrandSchema>;

/* ============================================================
 * List query
 * ============================================================ */

const booleanFromString = z
  .enum(["true", "false"])
  .transform((v) => v === "true");

export const brandListQuerySchema = z.object({
  q: z.string().trim().optional(),
  isActive: booleanFromString.optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  sortBy: z.enum(["name", "createdAt", "updatedAt"]).default("name"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
});
export type BrandListQuery = z.infer<typeof brandListQuerySchema>;

/* ============================================================
 * Suggest
 * ============================================================ */

export const brandSuggestQuerySchema = z.object({
  q: z.string().trim().min(1).max(80),
  limit: z.coerce.number().int().min(1).max(20).default(10),
});
export type BrandSuggestQuery = z.infer<typeof brandSuggestQuerySchema>;

/* ============================================================
 * Response
 * ============================================================ */

export const brandResponseSchema = z.object({
  _id: z.string(),
  name: localizedTextSchema,
  slug: z.string(),
  logo: imageRefSchema.optional(),
  isActive: z.boolean(),
  productCount: z.number().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type BrandResponse = z.infer<typeof brandResponseSchema>;
