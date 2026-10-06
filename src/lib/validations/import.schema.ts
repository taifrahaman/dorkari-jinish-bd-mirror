// src/lib/validations/import.schema.ts

import { z } from "zod";
import { createProductSchema, type CreateProductInput } from "./product.schema";

/* ============================================================
 * Constants
 * ============================================================ */

export const MAX_BULK_SIZE = 500;
export const MAX_IMPORT_ROWS = 500;

/* ============================================================
 * Raw CSV row
 * ============================================================ */

const emptyToUndefined = (v: unknown) =>
  typeof v === "string" && v.trim() === "" ? undefined : v;

const booleanCell = z.preprocess(
  emptyToUndefined,
  z
    .enum(["true", "false", "1", "0", "yes", "no"])
    .transform((v) => ["true", "1", "yes"].includes(v.toLowerCase()))
    .default(false),
);

export const csvRowSchema = z.object({
  name_en: z.string().trim().min(1, "name_en is required"),
  name_bn: z.string().trim().min(1, "name_bn is required"),

  slug: z.string().trim().optional(),

  description_en: z.preprocess(emptyToUndefined, z.string().trim().optional()),
  description_bn: z.preprocess(emptyToUndefined, z.string().trim().optional()),

  price: z.preprocess(
    emptyToUndefined,
    z.coerce.number().nonnegative("price must be 0 or greater"),
  ),

  compare_at_price: z.preprocess(
    emptyToUndefined,
    z.coerce.number().nonnegative().optional(),
  ),

  /* ----- Category ----- */

  category_slug: z.string().trim().min(1, "category_slug is required"),
  category_path: z.string().trim().optional(),
  category_name_en: z.preprocess(
    emptyToUndefined,
    z.string().trim().optional(),
  ),
  category_name_bn: z.preprocess(
    emptyToUndefined,
    z.string().trim().optional(),
  ),

  /* ----- Brand ----- */

  brand_slug: z.preprocess(emptyToUndefined, z.string().trim().optional()),
  brand_name_en: z.preprocess(emptyToUndefined, z.string().trim().optional()),
  brand_name_bn: z.preprocess(emptyToUndefined, z.string().trim().optional()),

  /* ----- Simple fields ----- */

  stock: z.preprocess(
    emptyToUndefined,
    z.coerce.number().int().min(0).default(0),
  ),

  sku: z.preprocess(emptyToUndefined, z.string().trim().optional()),

  weight: z.preprocess(emptyToUndefined, z.string().trim().optional()),
  dimensions: z.preprocess(emptyToUndefined, z.string().trim().optional()),

  is_active: z.preprocess(
    emptyToUndefined,
    z
      .enum(["true", "false", "1", "0", "yes", "no"])
      .transform((v) => ["true", "1", "yes"].includes(v.toLowerCase()))
      .default(true),
  ),

  is_featured: booleanCell,

  /* ----- Pipe-delimited fields ----- */

  image_files: z.preprocess(emptyToUndefined, z.string().trim().optional()),
  colors: z.preprocess(emptyToUndefined, z.string().trim().optional()),
  specifications: z.preprocess(emptyToUndefined, z.string().trim().optional()),
});

export type CsvRow = z.infer<typeof csvRowSchema>;

/* ============================================================
 * Bulk create
 * ============================================================ */

export const bulkCreateProductSchema = z.object({
  products: z
    .array(createProductSchema)
    .min(1, "At least one product is required")
    .max(MAX_BULK_SIZE, `At most ${MAX_BULK_SIZE} products per request`),
});

export type BulkCreateProductInput = z.infer<typeof bulkCreateProductSchema>;

/* ============================================================
 * Import options
 * ============================================================ */

export const importDuplicateModeSchema = z.enum(["skip", "update", "fail"]);

export type ImportDuplicateMode = z.infer<typeof importDuplicateModeSchema>;

export const importOptionsSchema = z.object({
  onDuplicate: importDuplicateModeSchema.default("skip"),
  createMissingCategories: z.boolean().default(false),
  createMissingBrands: z.boolean().default(false),
  skipEmptyRows: z.boolean().default(true),
  dryRun: z.boolean().default(false),
});

export type ImportOptions = z.infer<typeof importOptionsSchema>;

export const importPayloadSchema = z.object({
  products: z
    .array(createProductSchema)
    .min(1, "At least one product is required")
    .max(MAX_IMPORT_ROWS, `At most ${MAX_IMPORT_ROWS} products per import`),
  options: importOptionsSchema.default({
    onDuplicate: "skip",
    createMissingCategories: false,
    createMissingBrands: false,
    skipEmptyRows: true,
    dryRun: false,
  }),
});

export type ImportPayload = z.infer<typeof importPayloadSchema>;

/* ============================================================
 * Export
 * ============================================================ */

export const exportFormatSchema = z.enum(["csv", "json"]).default("csv");
export type ExportFormat = z.infer<typeof exportFormatSchema>;

export const exportQuerySchema = z.object({
  format: exportFormatSchema,
  category: z.string().optional(),
  isActive: z
    .enum(["true", "false"])
    .transform((v) => v === "true")
    .optional(),
  includeDeleted: z
    .enum(["true", "false"])
    .transform((v) => v === "true")
    .default(false),
  ids: z
    .string()
    .transform((v) =>
      v
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    )
    .optional(),
});

export type ExportQuery = z.infer<typeof exportQuerySchema>;

/* ============================================================
 * Result
 * ============================================================ */

export const importRowResultSchema = z.object({
  row: z.number().int().min(0),
  status: z.enum(["created", "updated", "skipped", "failed"]),
  id: z.string().optional(),
  sku: z.string().optional(),
  name: z.string().optional(),
  message: z.string().optional(),
  fieldErrors: z.record(z.string(), z.array(z.string())).optional(),
});

export type ImportRowResult = z.infer<typeof importRowResultSchema>;

export const importResultSchema = z.object({
  total: z.number().int(),
  created: z.number().int(),
  updated: z.number().int(),
  skipped: z.number().int(),
  failed: z.number().int(),
  dryRun: z.boolean(),
  rows: z.array(importRowResultSchema),
});

export type ImportResult = z.infer<typeof importResultSchema>;

/* ============================================================
 * csvRowToProductPartial
 * ============================================================ */

export type CsvRowToProductPartial = Omit<
  CreateProductInput,
  "category" | "brand" | "images"
> & {
  categorySlug?: string;
  categoryPath?: string;
  categoryNameEn?: string;
  categoryNameBn?: string;
  brandSlug?: string;
  brandNameEn?: string;
  brandNameBn?: string;
  imageFiles?: string[];
};

export function csvRowToProductPartial(row: CsvRow): CsvRowToProductPartial {
  const splitPipe = (v?: string) =>
    v
      ? v
          .split("|")
          .map((s) => s.trim())
          .filter(Boolean)
      : undefined;

  return {
    name: { en: row.name_en, bn: row.name_bn },
    slug: row.slug,
    description: {
      en: row.description_en ?? "",
      bn: row.description_bn ?? "",
    },
    price: row.price,
    compareAtPrice: row.compare_at_price,
    stock: row.stock,
    sku: row.sku,
    weight: row.weight,
    dimensions: row.dimensions,
    isActive: row.is_active,
    isFeatured: row.is_featured,
    categorySlug: row.category_slug,
    categoryPath: row.category_path,
    categoryNameEn: row.category_name_en,
    categoryNameBn: row.category_name_bn,
    brandSlug: row.brand_slug,
    brandNameEn: row.brand_name_en,
    brandNameBn: row.brand_name_bn,
    imageFiles: splitPipe(row.image_files),
    colors: parseColors(row.colors),
    specifications: parseSpecifications(row.specifications),
  };
}

/* ============================================================
 * Pipe-field parsers
 * ============================================================ */

function parseColors(
  raw?: string,
): Array<{ hex: string; name?: { en: string; bn: string } }> {
  if (!raw) return [];
  return raw
    .split("|")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const [hex, en, bn] = part.split(":").map((s) => s.trim());
      if (!hex) return null;
      const name = en || bn ? { en: en ?? "", bn: bn ?? "" } : undefined;
      return { hex, name };
    })
    .filter((c): c is NonNullable<typeof c> => c !== null);
}

function parseSpecifications(raw?: string): Record<string, string> {
  if (!raw) return {};
  const out: Record<string, string> = {};
  for (const part of raw.split("|")) {
    const idx = part.indexOf(":");
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const value = part.slice(idx + 1).trim();
    if (key) out[key] = value;
  }
  return out;
}
