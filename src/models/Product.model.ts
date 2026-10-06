// src/models/Product.model.ts

import mongoose, { Schema, Document, Model } from "mongoose";
import Category, { ICategory } from "./Category.model";
import { IBrand } from "./Brand.model";

interface ILocalizedText {
  en: string;
  bn: string;
}

/* ============================================================
 * Sub-documents
 * ============================================================ */

export interface IProductColor {
  hex: string;
  name?: {
    en?: string;
    bn?: string;
  };
}

export interface IProductImage {
  url: string;
  publicId: string;
  alt: string;
}

export interface IProductCostHistoryEntry {
  cost: number;
  changedAt: Date;
  changedBy?: mongoose.Types.ObjectId;
  note?: string;
}

export interface IProductSupplier {
  /** Optional at the DB layer — Zod enforces it when any field is set. */
  name?: string;
  phone?: string;
  email?: string;
  address?: string;
}

/* ============================================================
 * Main interface
 * ============================================================ */

export interface IProduct extends Document {
  name: ILocalizedText;
  slug: string;
  sku: string;
  barcode?: string;

  description?: {
    en?: string;
    bn?: string;
  };

  price: number;
  compareAtPrice?: number;
  costPrice?: number;
  taxRate?: number;

  category: mongoose.Types.ObjectId | ICategory;
  mainCategory: mongoose.Types.ObjectId | ICategory;
  brand?: mongoose.Types.ObjectId | IBrand;

  stock: number;
  lowStockThreshold?: number;

  images: IProductImage[];
  colors: IProductColor[];

  weight?: string;
  dimensions?: string;
  specifications?: Record<string, unknown>;

  supplier?: IProductSupplier;
  costHistory: IProductCostHistoryEntry[];

  totalSold?: number;
  totalRevenue?: number;

  isActive: boolean;
  isFeatured: boolean;
  averageRating: number;
  totalReviews: number;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/* ============================================================
 * Constants
 * ============================================================ */

export const MAX_COST_HISTORY_ENTRIES = 100;
export const DEFAULT_LOW_STOCK_THRESHOLD = 5;

/* ============================================================
 * Schemas
 * ============================================================ */

const ProductColorSchema = new Schema<IProductColor>(
  {
    hex: { type: String, required: true },
    name: {
      en: { type: String },
      bn: { type: String },
    },
  },
  { _id: false },
);

const ProductImageSchema = new Schema<IProductImage>(
  {
    url: { type: String, required: true, trim: true },
    publicId: { type: String, required: true, trim: true },
    alt: { type: String, default: "", trim: true, maxlength: 200 },
  },
  { _id: false },
);

const CostHistorySchema = new Schema<IProductCostHistoryEntry>(
  {
    cost: { type: Number, required: true, min: 0 },
    changedAt: { type: Date, default: Date.now },
    changedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    note: { type: String, trim: true, maxlength: 200 },
  },
  { _id: false },
);

/**
 * Supplier sub-schema. All fields optional — the Zod layer
 * enforces `name` only when some field is filled.
 */
const SupplierSchema = new Schema<IProductSupplier>(
  {
    name: { type: String, trim: true },
    phone: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    address: { type: String, trim: true },
  },
  { _id: false },
);

/* ============================================================
 * Main schema
 * ============================================================ */

const ProductSchema = new Schema<IProduct>(
  {
    name: {
      en: { type: String, required: true, trim: true },
      bn: { type: String, required: true, trim: true },
    },
    slug: { type: String, required: true, unique: true, trim: true },
    sku: { type: String, unique: true, sparse: true, trim: true },
    barcode: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },

    description: {
      en: { type: String, trim: true },
      bn: { type: String, trim: true },
    },

    price: { type: Number, required: true, min: 0 },
    compareAtPrice: { type: Number, min: 0 },
    costPrice: { type: Number, min: 0 },
    taxRate: { type: Number, min: 0, max: 100, default: 0 },

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
    brand: {
      type: Schema.Types.ObjectId,
      ref: "Brand",
    },

    stock: { type: Number, default: 0, min: 0 },
    lowStockThreshold: { type: Number, min: 0 },

    images: [ProductImageSchema],
    colors: [ProductColorSchema],

    weight: { type: String, trim: true },
    dimensions: { type: String, trim: true },

    specifications: { type: Schema.Types.Mixed, default: {} },

    supplier: { type: SupplierSchema, default: undefined },
    costHistory: {
      type: [CostHistorySchema],
      default: [],
    },

    totalSold: { type: Number, default: 0, min: 0 },
    totalRevenue: { type: Number, default: 0, min: 0 },

    isActive: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },

    averageRating: { type: Number, default: 0, min: 0, max: 5 },
    totalReviews: { type: Number, default: 0, min: 0 },

    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

/* ============================================================
 * Indexes
 * ============================================================ */

ProductSchema.index({ slug: 1 }, { unique: true });
ProductSchema.index({ sku: 1 }, { unique: true, sparse: true });
ProductSchema.index({ barcode: 1 }, { unique: true, sparse: true });
ProductSchema.index({ category: 1 });
ProductSchema.index({ mainCategory: 1 });
ProductSchema.index({ brand: 1 });
ProductSchema.index({ price: 1 });
ProductSchema.index({ costPrice: 1 });
ProductSchema.index({ isFeatured: 1 });
ProductSchema.index({ isActive: 1 });
ProductSchema.index({ stock: 1 });

/* ============================================================
 * Middleware
 * ============================================================ */

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

ProductSchema.pre("save", function () {
  if (!this.isModified("costPrice")) return;
  if (typeof this.costPrice !== "number") return;

  const last = this.costHistory[this.costHistory.length - 1];
  if (last && last.cost === this.costPrice) return;

  const changedBy = (
    this as unknown as { __changedBy?: mongoose.Types.ObjectId }
  ).__changedBy;

  this.costHistory.push({
    cost: this.costPrice,
    changedAt: new Date(),
    changedBy,
  });

  if (this.costHistory.length > MAX_COST_HISTORY_ENTRIES) {
    this.costHistory = this.costHistory.slice(-MAX_COST_HISTORY_ENTRIES);
  }
});

/* ============================================================
 * Model
 * ============================================================ */

const Product =
  (mongoose.models.Product as Model<IProduct>) ||
  mongoose.model<IProduct>("Product", ProductSchema);

export default Product;
