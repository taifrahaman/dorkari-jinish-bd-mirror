// src/lib/validations/color.schema.ts

import { z } from "zod";
import { optionalSlugSchema, localizedTextSchema } from "./common.schema";

/* ============================================================
 * Hex color
 * ============================================================ */

export const hexColorSchema = z
  .string()
  .trim()
  .regex(
    /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/,
    "Hex color must be #RRGGBB or #RGB",
  )
  .transform((v) => v.toLowerCase());

/* ============================================================
 * Create
 * ============================================================ */

export const createColorSchema = z.object({
  name: localizedTextSchema,
  hex: hexColorSchema,
  slug: optionalSlugSchema,
  order: z.coerce.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

export type CreateColorInput = z.infer<typeof createColorSchema>;

/* ============================================================
 * Update
 * ============================================================ */

export const updateColorSchema = z.object({
  name: localizedTextSchema.optional(),
  hex: hexColorSchema.optional(),
  slug: optionalSlugSchema,
  order: z.coerce.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

export type UpdateColorInput = z.infer<typeof updateColorSchema>;

/* ============================================================
 * List query
 * ============================================================ */

const booleanFromString = z
  .enum(["true", "false"])
  .transform((v) => v === "true");

export const colorListQuerySchema = z.object({
  q: z.string().trim().optional(),
  isActive: booleanFromString.optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(100),
  sortBy: z.enum(["name", "order", "createdAt", "updatedAt"]).default("order"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
});

export type ColorListQuery = z.infer<typeof colorListQuerySchema>;

/* ============================================================
 * Suggest
 * ============================================================ */

export const colorSuggestQuerySchema = z.object({
  q: z.string().trim().min(1, "Query is required").max(60),
  limit: z.coerce.number().int().min(1).max(30).default(15),
});

export type ColorSuggestQuery = z.infer<typeof colorSuggestQuerySchema>;

/* ============================================================
 * Response
 * ============================================================ */

export const colorResponseSchema = z.object({
  _id: z.string(),
  name: localizedTextSchema,
  hex: z.string(),
  slug: z.string(),
  order: z.number(),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type ColorResponse = z.infer<typeof colorResponseSchema>;
