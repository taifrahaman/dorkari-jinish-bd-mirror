// src/models/FAQ.model.ts

import mongoose, { Schema, Document, Model } from "mongoose";

export interface ILocalizedText {
  en: string;
  bn: string;
}

export interface IFAQ extends Document {
  question: ILocalizedText;
  answer: ILocalizedText;

  /** Where this FAQ appears. */
  targetType: "global" | "product" | "category";
  /** Product or Category ObjectId; null when targetType is "global". */
  targetId?: mongoose.Types.ObjectId | null;

  order: number;
  isActive: boolean;

  deletedAt?: Date | null;

  createdAt: Date;
  updatedAt: Date;
}

/* ============================================================
 * Sub-schemas
 * ============================================================ */

const LocalizedTextSchema = new Schema<ILocalizedText>(
  {
    en: { type: String, required: true, trim: true },
    bn: { type: String, required: true, trim: true },
  },
  { _id: false },
);

/* ============================================================
 * FAQ
 * ============================================================ */

const FAQSchema = new Schema<IFAQ>(
  {
    question: { type: LocalizedTextSchema, required: true },
    answer: { type: LocalizedTextSchema, required: true },

    targetType: {
      type: String,
      enum: ["global", "product", "category"],
      required: true,
      default: "global",
    },
    targetId: {
      type: Schema.Types.ObjectId,
      refPath: "targetType",
      default: null,
    },

    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

/* ============================================================
 * Indexes
 * ============================================================ */

FAQSchema.index({ targetType: 1, targetId: 1 });
FAQSchema.index({ targetType: 1, targetId: 1, order: 1 });
FAQSchema.index({ isActive: 1 });

/* ============================================================
 * Validation
 * ============================================================ */

FAQSchema.pre("validate", function () {
  if (this.targetType !== "global" && !this.targetId) {
    throw new Error(
      `targetId is required when targetType is '${this.targetType}'`,
    );
  }
  if (this.targetType === "global") {
    this.targetId = null;
  }
});

/* ============================================================
 * Model
 * ============================================================ */

const FAQ =
  (mongoose.models.FAQ as Model<IFAQ>) ||
  mongoose.model<IFAQ>("FAQ", FAQSchema);

export default FAQ;
