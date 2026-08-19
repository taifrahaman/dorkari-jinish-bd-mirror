// src/models/Review.model.ts

import mongoose, { Schema, Document, Model } from "mongoose";
import Order from "./Order.model"; // Import to check order history

export interface IReview extends Document {
  user: mongoose.Types.ObjectId;
  product: mongoose.Types.ObjectId;
  rating: number;
  comment?: string;
  images?: Array<{ url: string; publicId: string }>;
  isVerifiedPurchase: boolean;
  helpfulCount: number;
  status: "pending" | "approved" | "rejected";
  moderationNotes?: string;
  approvedBy?: mongoose.Types.ObjectId;
  approvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ReviewSchema = new Schema<IReview>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      trim: true,
    },
    images: [
      {
        url: { type: String, required: true },
        publicId: { type: String, required: true },
      },
    ],
    isVerifiedPurchase: {
      type: Boolean,
      default: false,
    },
    helpfulCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    moderationNotes: {
      type: String,
      trim: true,
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    approvedAt: {
      type: Date,
    },
  },
  { timestamps: true },
);

// --- Pre‑validate hook to auto‑set isVerifiedPurchase ---
ReviewSchema.pre("validate", async function () {
  // Only check if we have a user and product, and flag is not already set
  if (this.user && this.product) {
    // Check if this user has a delivered order containing this product
    const deliveredOrder = await Order.findOne({
      user: this.user,
      status: "delivered",
      "items.product": this.product,
    });

    this.isVerifiedPurchase = !!deliveredOrder; // true if found, false otherwise
  }
});

// Indexes
ReviewSchema.index({ user: 1, product: 1 }, { unique: true });
ReviewSchema.index({ product: 1, status: 1 });
ReviewSchema.index({ status: 1 });
ReviewSchema.index({ rating: 1 });

const Review =
  (mongoose.models.Review as Model<IReview>) ||
  mongoose.model<IReview>("Review", ReviewSchema);

export default Review;
