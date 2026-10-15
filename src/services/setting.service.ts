// src/services/setting.service.ts

import { revalidateTag } from "next/cache";

import Setting from "@/models/Setting.model";
import { STOREFRONT_SETTINGS_TAG } from "@/lib/storefront/cache-tags";
import type {
  SettingResponse,
  UpdateSettingsInput,
} from "@/lib/validations/setting.schema";

/* ============================================================
 * Internal types
 * ============================================================ */

type LocalizedText = { en: string; bn: string };

type LeanSetting = {
  _id: unknown;
  store: {
    name?: string;
    phone?: string;
    email?: string;
    address?: string;
    website?: string;
  };
  vat: {
    enabled?: boolean;
    defaultRate?: number;
    inclusive?: boolean;
  };
  deliveryEstimate?: { en?: string; bn?: string };
  returnPolicy?: { en?: string; bn?: string };
  lowStockThreshold: number;
  updatedAt: Date;
};

/* ============================================================
 * Defaults
 * ============================================================ */

const DEFAULT_STORE_NAME = "Dorkari Jinish BD";
const DEFAULT_VAT_RATE = 15;
const DEFAULT_LOW_STOCK_THRESHOLD = 5;

const DEFAULT_DELIVERY: LocalizedText = {
  en: "Delivery in 2–4 days across Dhaka",
  bn: "ঢাকার মধ্যে ২-৪ দিনে ডেলিভারি",
};

const DEFAULT_RETURN_POLICY: LocalizedText = {
  en: "7-day easy return if unused and in original packaging",
  bn: "অব্যবহৃত ও মূল প্যাকেজিং থাকলে ৭ দিনের সহজ রিটার্ন",
};

/* ============================================================
 * Normalization
 * ============================================================ */

function toLocalizedText(
  value: { en?: string; bn?: string } | undefined,
  fallback: LocalizedText,
): LocalizedText {
  return {
    en: value?.en?.trim() ? value.en : fallback.en,
    bn: value?.bn?.trim() ? value.bn : fallback.bn,
  };
}

function toSettingResponse(doc: LeanSetting): SettingResponse {
  return {
    _id: String(doc._id),
    store: {
      name: doc.store?.name ?? DEFAULT_STORE_NAME,
      phone: doc.store?.phone || undefined,
      email: doc.store?.email || undefined,
      address: doc.store?.address || undefined,
      website: doc.store?.website || undefined,
    },
    vat: {
      enabled: doc.vat?.enabled ?? false,
      defaultRate: doc.vat?.defaultRate ?? DEFAULT_VAT_RATE,
      inclusive: doc.vat?.inclusive ?? true,
    },
    deliveryEstimate: toLocalizedText(doc.deliveryEstimate, DEFAULT_DELIVERY),
    returnPolicy: toLocalizedText(doc.returnPolicy, DEFAULT_RETURN_POLICY),
    lowStockThreshold: doc.lowStockThreshold ?? DEFAULT_LOW_STOCK_THRESHOLD,
    updatedAt: doc.updatedAt.toISOString(),
  };
}

/* ============================================================
 * Get — upsert defaults on first access
 * ============================================================ */

export async function getSettings(): Promise<SettingResponse> {
  const doc = await Setting.findOneAndUpdate(
    { key: "singleton" },
    {
      $setOnInsert: {
        key: "singleton",
        store: { name: DEFAULT_STORE_NAME },
        vat: {
          enabled: false,
          defaultRate: DEFAULT_VAT_RATE,
          inclusive: true,
        },
        deliveryEstimate: DEFAULT_DELIVERY,
        returnPolicy: DEFAULT_RETURN_POLICY,
        lowStockThreshold: DEFAULT_LOW_STOCK_THRESHOLD,
      },
    },
    { upsert: true, new: true, lean: true },
  );

  return toSettingResponse(doc as unknown as LeanSetting);
}

/* ============================================================
 * Update
 * ============================================================ */

export async function updateSettings(
  input: UpdateSettingsInput,
): Promise<SettingResponse> {
  const update: Record<string, unknown> = {};

  if (input.store) {
    update["store.name"] = input.store.name;
    update["store.phone"] = input.store.phone || undefined;
    update["store.email"] = input.store.email || undefined;
    update["store.address"] = input.store.address || undefined;
    update["store.website"] = input.store.website || undefined;
  }

  if (input.vat) {
    update["vat.enabled"] = input.vat.enabled;
    update["vat.defaultRate"] = input.vat.defaultRate;
    update["vat.inclusive"] = input.vat.inclusive;
  }

  if (input.deliveryEstimate !== undefined) {
    update["deliveryEstimate.en"] = input.deliveryEstimate.en;
    update["deliveryEstimate.bn"] = input.deliveryEstimate.bn;
  }

  if (input.returnPolicy !== undefined) {
    update["returnPolicy.en"] = input.returnPolicy.en;
    update["returnPolicy.bn"] = input.returnPolicy.bn;
  }

  if (input.lowStockThreshold !== undefined) {
    update.lowStockThreshold = input.lowStockThreshold;
  }

  const doc = await Setting.findOneAndUpdate(
    { key: "singleton" },
    { $set: update, $setOnInsert: { key: "singleton" } },
    { upsert: true, new: true, lean: true },
  );

  // Any admin change to settings invalidates the storefront settings cache.
  revalidateTag(STOREFRONT_SETTINGS_TAG, "max");

  return toSettingResponse(doc as unknown as LeanSetting);
}

/* ============================================================
 * Storefront settings — slim, public-safe DTO
 * ============================================================ */

export type StorefrontSettings = {
  deliveryEstimate: LocalizedText;
  returnPolicy: LocalizedText;
};

export async function getStorefrontSettings(): Promise<StorefrontSettings> {
  const settings = await getSettings();
  return {
    deliveryEstimate: settings.deliveryEstimate,
    returnPolicy: settings.returnPolicy,
  };
}
