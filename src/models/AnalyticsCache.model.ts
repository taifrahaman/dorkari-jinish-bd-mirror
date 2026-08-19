// src/models/AnalyticsCache.model.ts

import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAnalyticsCache extends Document {
  key: string; // e.g., 'daily-sales-2025-01-01', 'top-products-week-12'
  value: Record<string, unknown>; // cached aggregated data (JSON)
  expiresAt: Date; // when this cache should expire (TTL index)
  createdAt: Date;
  updatedAt: Date;
}

const AnalyticsCacheSchema = new Schema<IAnalyticsCache>(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    value: {
      type: Schema.Types.Mixed,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true },
);

// Indexes
AnalyticsCacheSchema.index({ key: 1 }, { unique: true });
AnalyticsCacheSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index - auto-delete after expiresAt

const AnalyticsCache =
  (mongoose.models.AnalyticsCache as Model<IAnalyticsCache>) ||
  mongoose.model<IAnalyticsCache>("AnalyticsCache", AnalyticsCacheSchema);

export default AnalyticsCache;
