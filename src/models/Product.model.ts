// src/models/Product.model.ts

import mongoose, { Schema, Document, Model } from "mongoose";
import Category, { ICategory } from "./Category.model";

export interface IProduct extends Document {
  name: string;
  slug: string;
  description?: string;
  price: number;
  category: mongoose.Types.ObjectId | ICategory;
  mainCategory: mongoose.Types.ObjectId | ICategory; // denormalized root
  stock: number;
  images: Array<{ url: string; publicId: string }>;
  sku: string;
  brand?: string;
  weight?: string;
  dimensions?: string;
  specifications?: Record<string, unknown>;
  isActive: boolean;
  isFeatured: boolean;
  averageRating: number;
  totalReviews: number;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true },
    description: { type: String, trim: true },
    price: { type: Number, required: true, min: 0 },
    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    mainCategory: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    stock: { type: Number, default: 0, min: 0 },
    images: [
      {
        url: { type: String, required: true },
        publicId: { type: String, required: true },
      },
    ],
    sku: { type: String, unique: true, sparse: true, trim: true },
    brand: { type: String, trim: true },
    weight: { type: String, trim: true },
    dimensions: { type: String, trim: true },
    specifications: { type: Schema.Types.Mixed, default: {} },
    isActive: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    averageRating: { type: Number, default: 0, min: 0, max: 5 },
    totalReviews: { type: Number, default: 0, min: 0 },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

// Indexes
ProductSchema.index({ slug: 1 }, { unique: true });
ProductSchema.index({ sku: 1 }, { unique: true, sparse: true });
ProductSchema.index({ category: 1 });
ProductSchema.index({ mainCategory: 1 });
ProductSchema.index({ price: 1 });
ProductSchema.index({ isFeatured: 1 });
ProductSchema.index({ isActive: 1 });

// Pre-save middleware to auto-populate mainCategory
ProductSchema.pre("validate", async function () {
  if (this.category) {
    const categoryId = this.category;
    let current = await Category.findById(categoryId);
    while (current && current.parent) {
      current = await Category.findById(current.parent);
    }
    if (current) {
      this.mainCategory = current._id as mongoose.Types.ObjectId;
    }
  }
});

const Product =
  (mongoose.models.Product as Model<IProduct>) ||
  mongoose.model<IProduct>("Product", ProductSchema);

export default Product;
