// src/models/Setting.model.ts

import mongoose, { Schema, Document, Model } from "mongoose";

/* ============================================================
 * Singleton settings document
 *
 * One document per database, keyed by `key: "singleton"`.
 * `getSettings()` upserts the defaults if it doesn't exist.
 * ============================================================ */

export interface IStoreInfo {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  website?: string;
}

export interface IVatConfig {
  enabled: boolean;
  /** Default rate in percent (e.g. 15 for 15%). */
  defaultRate: number;
  /** True = prices already include VAT. False = VAT added at checkout. */
  inclusive: boolean;
}

export interface ISetting extends Document {
  key: "singleton";
  store: IStoreInfo;
  vat: IVatConfig;
  lowStockThreshold: number;
  createdAt: Date;
  updatedAt: Date;
}

/* ============================================================
 * Sub-schemas
 * ============================================================ */

const StoreInfoSchema = new Schema<IStoreInfo>(
  {
    name: { type: String, trim: true, default: "Dorkari Jinish BD" },
    phone: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    address: { type: String, trim: true },
    website: { type: String, trim: true },
  },
  { _id: false },
);

const VatConfigSchema = new Schema<IVatConfig>(
  {
    enabled: { type: Boolean, default: false },
    defaultRate: { type: Number, min: 0, max: 100, default: 15 },
    inclusive: { type: Boolean, default: true },
  },
  { _id: false },
);

/* ============================================================
 * Main schema
 * ============================================================ */

const SettingSchema = new Schema<ISetting>(
  {
    key: {
      type: String,
      enum: ["singleton"],
      default: "singleton",
      unique: true,
      required: true,
    },
    store: {
      type: StoreInfoSchema,
      default: () => ({}),
    },
    vat: {
      type: VatConfigSchema,
      default: () => ({}),
    },
    lowStockThreshold: { type: Number, default: 5, min: 0 },
  },
  { timestamps: true },
);

SettingSchema.index({ key: 1 }, { unique: true });

/* ============================================================
 * Model
 * ============================================================ */

const Setting =
  (mongoose.models.Setting as Model<ISetting>) ||
  mongoose.model<ISetting>("Setting", SettingSchema);

export default Setting;
