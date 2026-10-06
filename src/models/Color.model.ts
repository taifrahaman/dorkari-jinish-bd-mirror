// src/models/Color.model.ts

import mongoose, { Schema, Document, Model } from "mongoose";

/* ============================================================
 * Localized text
 * ============================================================ */

export interface ILocalizedText {
  en: string;
  bn: string;
}

export interface IColor extends Document {
  name: ILocalizedText;
  hex: string;
  slug: string;
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const LocalizedTextSchema = new Schema<ILocalizedText>(
  {
    en: { type: String, required: true, trim: true },
    bn: { type: String, required: true, trim: true },
  },
  { _id: false },
);

const ColorSchema = new Schema<IColor>(
  {
    name: { type: LocalizedTextSchema, required: true },
    hex: {
      type: String,
      required: true,
      trim: true,
      match: /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/,
    },
    slug: { type: String, required: true, unique: true, trim: true },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

// Indexes
ColorSchema.index({ slug: 1 }, { unique: true });
ColorSchema.index({ isActive: 1 });
ColorSchema.index({ order: 1 });
ColorSchema.index({ "name.en": 1 });
ColorSchema.index({ "name.bn": 1 });

const Color =
  (mongoose.models.Color as Model<IColor>) ||
  mongoose.model<IColor>("Color", ColorSchema);

export default Color;
