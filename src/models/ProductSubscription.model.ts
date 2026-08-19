// src/models/ProductSubscription.model.ts

import mongoose, { Schema, Document, Model } from "mongoose";

export interface IProductSubscription extends Document {
  user?: mongoose.Types.ObjectId; // null for guest
  email?: string; // required if user is null
  product: mongoose.Types.ObjectId;
  status: "active" | "inactive";
  createdAt: Date;
  updatedAt: Date;
}

const ProductSubscriptionSchema = new Schema<IProductSubscription>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  { timestamps: true },
);

// Ensure either user or email is provided
ProductSubscriptionSchema.pre("validate", function () {
  if (!this.user && !this.email) {
    throw new Error("Either user or email must be provided");
  }
});

// Indexes
ProductSubscriptionSchema.index({ product: 1, status: 1 });
ProductSubscriptionSchema.index(
  { user: 1, product: 1 },
  { unique: true, sparse: true },
);
ProductSubscriptionSchema.index(
  { email: 1, product: 1 },
  { unique: true, sparse: true },
);

const ProductSubscription =
  (mongoose.models.ProductSubscription as Model<IProductSubscription>) ||
  mongoose.model<IProductSubscription>(
    "ProductSubscription",
    ProductSubscriptionSchema,
  );

export default ProductSubscription;
