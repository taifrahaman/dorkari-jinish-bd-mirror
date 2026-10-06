// src/models/Category.model.ts

import mongoose, { Schema, Document, Model } from "mongoose";

/* ============================================================
 * Localized text
 * ============================================================ */

export interface ILocalizedText {
  en: string;
  bn: string;
}

/* ============================================================
 * Image sub-schema
 *
 * Wrapped as a proper sub-schema with `default: undefined` on
 * the outer path so an absent image doesn't trigger validation
 * of the required url/publicId fields.
 *
 * `alt` defaults to "" — required by SEO best practice to have
 * a field, but not enforced. The storefront renders empty alt
 * as decorative.
 * ============================================================ */

export interface IImageRef {
  url: string;
  publicId: string;
  alt: string;
}

const ImageRefSchema = new Schema<IImageRef>(
  {
    url: { type: String, required: true, trim: true },
    publicId: { type: String, required: true, trim: true },
    alt: { type: String, default: "", trim: true, maxlength: 200 },
  },
  { _id: false },
);

/* ============================================================
 * Category
 * ============================================================ */

export interface ICategory extends Document {
  name: ILocalizedText;
  slug: string;
  description?: string;
  parent?: mongoose.Types.ObjectId | ICategory | null;
  image?: IImageRef;
  specTemplate: string[];
  order: number;
  isActive: boolean;
  deletedAt?: Date | null;
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

const CategorySchema = new Schema<ICategory>(
  {
    name: { type: LocalizedTextSchema, required: true },
    slug: { type: String, required: true, unique: true, trim: true },
    description: { type: String, trim: true },
    parent: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },
    image: {
      type: ImageRefSchema,
      default: undefined,
    },
    specTemplate: { type: [String], default: [] },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

CategorySchema.index({ slug: 1 }, { unique: true });
CategorySchema.index({ parent: 1 });
CategorySchema.index({ isActive: 1 });
CategorySchema.index({ "name.en": 1 });
CategorySchema.index({ "name.bn": 1 });

const Category =
  (mongoose.models.Category as Model<ICategory>) ||
  mongoose.model<ICategory>("Category", CategorySchema);

export default Category;
