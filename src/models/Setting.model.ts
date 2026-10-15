// src/models/Setting.model.ts

import mongoose, { Schema, Document, Model } from "mongoose";

/* ============================================================
 * Singleton settings document
 *
 * One document per database, keyed by `key: "singleton"`.
 * `getSettings()` upserts the defaults if it doesn't exist.
 * ============================================================ */

export interface ILocalizedText {
  en: string;
  bn: string;
}

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
  /** Shown on every product detail page. */
  deliveryEstimate: ILocalizedText;
  /** Shown on every product detail page. */
  returnPolicy: ILocalizedText;
  lowStockThreshold: number;
  createdAt: Date;
  updatedAt: Date;
}

/* ============================================================
 * Sub-schemas
 * ============================================================ */

const LocalizedTextSchema = new Schema<ILocalizedText>(
  {
    en: { type: String, trim: true, default: "" },
    bn: { type: String, trim: true, default: "" },
  },
  { _id: false },
);

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
    deliveryEstimate: {
      type: LocalizedTextSchema,
      default: () => ({
        en: "Delivery in 2–4 days across Dhaka",
        bn: "ঢাকার মধ্যে ২-৪ দিনে ডেলিভারি",
      }),
    },
    returnPolicy: {
      type: LocalizedTextSchema,
      default: () => ({
        en: "7-day easy return if unused and in original packaging",
        bn: "অব্যবহৃত ও মূল প্যাকেজিং থাকলে ৭ দিনের সহজ রিটার্ন",
      }),
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
