// src/models/ActivityLog.model.ts

import mongoose, { Schema, Document, Model } from "mongoose";

export interface IActivityLog extends Document {
  user?: mongoose.Types.ObjectId | null; // null for guest
  action: string; // e.g., 'view_product', 'add_to_cart', 'place_order', 'login'
  entityType?: string; // 'Product', 'Order', 'Category', 'User', etc.
  entityId?: string; // ID of the entity (stored as string for flexibility)
  details?: Record<string, unknown>; // any additional context (e.g., { productSlug: 'abc', quantity: 2 })
  ip?: string;
  userAgent?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ActivityLogSchema = new Schema<IActivityLog>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    action: {
      type: String,
      required: true,
      trim: true,
    },
    entityType: {
      type: String,
      trim: true,
    },
    entityId: {
      type: String,
      trim: true,
    },
    details: {
      type: Schema.Types.Mixed,
      default: {},
    },
    ip: {
      type: String,
      trim: true,
    },
    userAgent: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true },
);

// Indexes
ActivityLogSchema.index({ user: 1 });
ActivityLogSchema.index({ entityType: 1 });
ActivityLogSchema.index({ createdAt: -1 }); // for time‑based queries

// Compound index for fast lookups of a user's activity on a specific entity
ActivityLogSchema.index({ user: 1, entityType: 1, entityId: 1 });

const ActivityLog =
  (mongoose.models.ActivityLog as Model<IActivityLog>) ||
  mongoose.model<IActivityLog>("ActivityLog", ActivityLogSchema);

export default ActivityLog;
