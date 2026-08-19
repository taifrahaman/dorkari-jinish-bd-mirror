// src/models/FAQ.model.ts

import mongoose, { Schema, Document, Model } from "mongoose";

export interface IFAQ extends Document {
  question: string;
  answer: string;
  // category: string; // We'll replace this with the structured targeting below

  // --- Targeting fields ---
  targetType: "global" | "product" | "category"; // Where this FAQ appears
  targetId?: mongoose.Types.ObjectId | null; // Product ID or Category ID (null for global)

  // --- Display fields ---
  order: number;
  isActive: boolean;

  // --- Soft delete ---
  deletedAt?: Date | null;

  // --- Timestamps ---
  createdAt: Date;
  updatedAt: Date;
}

const FAQSchema = new Schema<IFAQ>(
  {
    question: {
      type: String,
      required: true,
      trim: true,
    },
    answer: {
      type: String,
      required: true,
      trim: true,
    },
    targetType: {
      type: String,
      enum: ["global", "product", "category"],
      required: true,
      default: "global",
    },
    targetId: {
      type: Schema.Types.ObjectId,
      refPath: "targetType", // Dynamic reference: if targetType is 'product', ref 'Product'; if 'category', ref 'Category'.
      default: null,
    },
    order: {
      type: Number,
      default: 0,
    },
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

// Indexes
FAQSchema.index({ targetType: 1, targetId: 1 });
FAQSchema.index({ targetType: 1, targetId: 1, order: 1 });
FAQSchema.index({ isActive: 1 });

// Validation: If targetType is product or category, targetId MUST be provided
FAQSchema.pre("validate", function () {
  if (this.targetType !== "global" && !this.targetId) {
    throw new Error(
      `targetId is required when targetType is '${this.targetType}'`,
    );
  }
  if (this.targetType === "global") {
    this.targetId = null; // ensure consistency
  }
});

const FAQ =
  (mongoose.models.FAQ as Model<IFAQ>) ||
  mongoose.model<IFAQ>("FAQ", FAQSchema);

export default FAQ;
