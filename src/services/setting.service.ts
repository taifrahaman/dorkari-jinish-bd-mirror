// src/services/setting.service.ts

import Setting from "@/models/Setting.model";
import type {
  SettingResponse,
  UpdateSettingsInput,
} from "@/lib/validations/setting.schema";

/* ============================================================
 * Internal types
 * ============================================================ */

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
  lowStockThreshold: number;
  updatedAt: Date;
};

/* ============================================================
 * Defaults
 * ============================================================ */

const DEFAULT_STORE_NAME = "Dorkari Jinish BD";
const DEFAULT_VAT_RATE = 15;
const DEFAULT_LOW_STOCK_THRESHOLD = 5;

/* ============================================================
 * Normalization
 * ============================================================ */

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

  if (input.lowStockThreshold !== undefined) {
    update.lowStockThreshold = input.lowStockThreshold;
  }

  const doc = await Setting.findOneAndUpdate(
    { key: "singleton" },
    { $set: update, $setOnInsert: { key: "singleton" } },
    { upsert: true, new: true, lean: true },
  );

  return toSettingResponse(doc as unknown as LeanSetting);
}
