// src/models/Brand.model.ts

import mongoose, { Schema, Document, Model } from "mongoose";

export interface IBrand extends Document {
  name: {
    en: string;
    bn: string;
  };
  slug: string;
  logo?: {
    url: string;
    publicId: string;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const BrandSchema = new Schema<IBrand>(
  {
    name: {
      en: { type: String, required: true, trim: true },
      bn: { type: String, required: true, trim: true },
    },
    slug: { type: String, required: true, unique: true, trim: true },
    logo: {
      url: { type: String },
      publicId: { type: String },
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

BrandSchema.index({ slug: 1 }, { unique: true });
BrandSchema.index({ isActive: 1 });

const Brand =
  (mongoose.models.Brand as Model<IBrand>) ||
  mongoose.model<IBrand>("Brand", BrandSchema);

export default Brand;
