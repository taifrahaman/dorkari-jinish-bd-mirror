// src/models/Coupon.model.ts

import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICoupon extends Document {
  code: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  minOrderAmount: number;
  maxDiscount?: number; // only for percentage type
  usageLimit?: number; // total times usable (null = unlimited)
  usedCount: number;
  validFrom: Date;
  validTo: Date;
  applicableCategories?: mongoose.Types.ObjectId[]; // ref: Category (empty = all)
  applicableProducts?: mongoose.Types.ObjectId[]; // ref: Product (empty = all)
  isActive: boolean;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const CouponSchema = new Schema<ICoupon>(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    discountType: {
      type: String,
      enum: ["percentage", "fixed"],
      required: true,
    },
    discountValue: {
      type: Number,
      required: true,
      min: 0,
    },
    minOrderAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    maxDiscount: {
      type: Number,
      min: 0,
    },
    usageLimit: {
      type: Number,
      min: 0,
    },
    usedCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    validFrom: {
      type: Date,
      required: true,
    },
    validTo: {
      type: Date,
      required: true,
    },
    applicableCategories: [
      {
        type: Schema.Types.ObjectId,
        ref: "Category",
      },
    ],
    applicableProducts: [
      {
        type: Schema.Types.ObjectId,
        ref: "Product",
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

// Validate that validTo is after validFrom
CouponSchema.pre("validate", function () {
  if (this.validTo <= this.validFrom) {
    throw new Error("validTo must be after validFrom");
  }
});

// Indexes
CouponSchema.index({ code: 1 }, { unique: true });
CouponSchema.index({ validFrom: 1, validTo: 1 });
CouponSchema.index({ isActive: 1 });

const Coupon =
  (mongoose.models.Coupon as Model<ICoupon>) ||
  mongoose.model<ICoupon>("Coupon", CouponSchema);

export default Coupon;
