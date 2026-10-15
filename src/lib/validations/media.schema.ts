// src/lib/validations/media.schema.ts

import { z } from "zod";

/* ============================================================
 * List query
 * ============================================================ */

export const mediaListQuerySchema = z.object({
  entity: z
    .enum(["all", "products", "categories", "brands", "tmp"])
    .default("all"),

  used: z.enum(["all", "true", "false"]).default("all"),

  /** ObjectId — only meaningful when entity is "products" or "all". */
  category: z.string().trim().optional(),

  /** Substring match against the public_id. */
  q: z.string().trim().optional(),

  sort: z.enum(["newest", "oldest", "name", "size"]).default("newest"),

  cursor: z.string().trim().optional(),

  limit: z.coerce.number().int().min(1).max(100).default(60),
});

export type MediaListQuery = z.infer<typeof mediaListQuerySchema>;

/* ============================================================
 * Usage query
 * ============================================================ */

export const mediaUsageQuerySchema = z.object({
  /** Comma-separated public IDs. Max 100. */
  publicIds: z
    .string()
    .min(1, "publicIds is required")
    .transform((s) =>
      s
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean),
    )
    .refine((arr) => arr.length > 0, "At least one publicId is required")
    .refine((arr) => arr.length <= 100, "Max 100 publicIds per request"),
});

export type MediaUsageQuery = z.infer<typeof mediaUsageQuerySchema>;
