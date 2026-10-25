// src/lib/validations/setting.schema.ts

import { z } from "zod";

/* ============================================================
 * Localized text
 * ============================================================ */

export const localizedTextSchema = z.object({
  en: z.string().trim().max(500).default(""),
  bn: z.string().trim().max(500).default(""),
});

export type LocalizedTextInput = z.infer<typeof localizedTextSchema>;

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
 * Delivery config
 * ============================================================ */

export const deliveryConfigSchema = z.object({
  fee: z.coerce.number().min(0).default(60),
  freeShippingThreshold: z.coerce.number().min(0).default(3000),
  freeShippingEnabled: z.boolean().default(true),
});

export type DeliveryConfigInput = z.infer<typeof deliveryConfigSchema>;

/* ============================================================
 * Update — all fields optional (partial patch)
 * ============================================================ */

export const updateSettingsSchema = z.object({
  store: storeInfoSchema.optional(),
  vat: vatConfigSchema.optional(),
  delivery: deliveryConfigSchema.optional(),
  deliveryEstimate: localizedTextSchema.optional(),
  returnPolicy: localizedTextSchema.optional(),
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
  delivery: deliveryConfigSchema,
  deliveryEstimate: localizedTextSchema,
  returnPolicy: localizedTextSchema,
  lowStockThreshold: z.number(),
  updatedAt: z.string(),
});

export type SettingResponse = z.infer<typeof settingResponseSchema>;
