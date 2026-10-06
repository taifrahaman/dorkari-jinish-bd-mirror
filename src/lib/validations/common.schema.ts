// src/lib/validations/common.schema.ts

import { z } from "zod";

/* ============================================================
 * Primitive helpers
 * ============================================================ */

/** 24-character MongoDB ObjectId */
export const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId");

/** URL-safe slug: lowercase, alphanumeric, hyphens only */
export const slugSchema = z
  .string()
  .min(1, "Slug is required")
  .max(120, "Slug must be 120 characters or fewer")
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Slug must be lowercase letters, numbers, and single hyphens",
  );

/**
 * Optional slug. Treats empty strings as "not provided" so that
 * forms leaving the field blank can pass without validation errors.
 */
export const optionalSlugSchema = z.preprocess(
  (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
  slugSchema.optional(),
);

/* ============================================================
 * Localized text (English + Bangla)
 * ============================================================ */

export const localizedTextSchema = z.object({
  en: z.string().trim().min(1, "English text is required"),
  bn: z.string().trim().min(1, "Bangla text is required"),
});

export const localizedTextOptionalSchema = z.object({
  en: z.string().trim().optional().default(""),
  bn: z.string().trim().optional().default(""),
});

/* ============================================================
 * Cloudinary image reference
 * ============================================================ */

export const imageRefSchema = z.object({
  url: z.string().url("Image URL must be a valid URL"),
  publicId: z.string().min(1, "Image publicId is required"),
  alt: z
    .string()
    .trim()
    .max(200, "Alt text must be 200 characters or fewer")
    .optional()
    .default(""),
});

/* ============================================================
 * Pagination
 * ============================================================ */

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type PaginationInput = z.infer<typeof paginationSchema>;

/* ============================================================
 * Sort
 * ============================================================ */

export const sortOrderSchema = z.enum(["asc", "desc"]).default("desc");

export type SortOrder = z.infer<typeof sortOrderSchema>;

/* ============================================================
 * IDs in route params
 * ============================================================ */

export const idParamSchema = z.object({
  id: objectIdSchema,
});

/* ============================================================
 * Generic API response shapes
 * ============================================================ */

export type ApiSuccess<T> = {
  success: true;
  data: T;
};

export type ApiFailure = {
  success: false;
  error: {
    message: string;
    code?: string;
    status?: number;
    details?: unknown;
  };
};

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

/* ============================================================
 * Paginated list envelope
 * ============================================================ */

export type Paginated<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

/* ============================================================
 * Bulk operation result
 * ============================================================ */

export const bulkRowResultSchema = z.object({
  row: z.number().int().min(0),
  status: z.enum(["created", "updated", "skipped", "failed"]),
  id: z.string().optional(),
  message: z.string().optional(),
});

export type BulkRowResult = z.infer<typeof bulkRowResultSchema>;

export const bulkResultSchema = z.object({
  total: z.number().int(),
  created: z.number().int(),
  updated: z.number().int(),
  skipped: z.number().int(),
  failed: z.number().int(),
  rows: z.array(bulkRowResultSchema),
});

export type BulkResult = z.infer<typeof bulkResultSchema>;
