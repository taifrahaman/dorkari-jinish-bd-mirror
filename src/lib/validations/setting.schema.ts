// src/lib/validations/setting.schema.ts

import { z } from "zod";

/* ============================================================
 * Store info
 * ============================================================ */

export const storeInfoSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Store name is required")
    .max(120, "Store name is 120 characters or fewer"),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  email: z.string().trim().email("Invalid email").optional().or(z.literal("")),
  address: z.string().trim().max(300).optional().or(z.literal("")),
  website: z.string().trim().max(200).optional().or(z.literal("")),
});

export type StoreInfoInput = z.infer<typeof storeInfoSchema>;

/* ============================================================
 * VAT config
 * ============================================================ */

export const vatConfigSchema = z.object({
  enabled: z.boolean().default(false),
  defaultRate: z.coerce.number().min(0).max(100).default(15),
  inclusive: z.boolean().default(true),
});

export type VatConfigInput = z.infer<typeof vatConfigSchema>;

/* ============================================================
 * Update — all fields optional (partial patch)
 * ============================================================ */

export const updateSettingsSchema = z.object({
  store: storeInfoSchema.optional(),
  vat: vatConfigSchema.optional(),
  lowStockThreshold: z.coerce.number().int().min(0).optional(),
});

export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;

/* ============================================================
 * Response
 * ============================================================ */

export const settingResponseSchema = z.object({
  _id: z.string(),
  store: storeInfoSchema,
  vat: vatConfigSchema,
  lowStockThreshold: z.number(),
  updatedAt: z.string(),
});

export type SettingResponse = z.infer<typeof settingResponseSchema>;
