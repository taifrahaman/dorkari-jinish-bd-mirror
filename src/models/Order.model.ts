// src/models/Order.model.ts

import mongoose, { Schema, Document, Model } from "mongoose";

export interface IOrder extends Document {
  user?: mongoose.Types.ObjectId;
  guestEmail?: string;
  guestName?: string;
  guestPhone?: string;
  items: Array<{
    product: mongoose.Types.ObjectId;
    quantity: number;
    priceAtTime: number;
  }>;
  totalAmount: number;
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  paymentStatus: "pending" | "paid" | "failed" | "refunded";
  paymentMethod?: string;
  shippingAddress: string;
  trackingNumber?: string;
  orderDate: Date;
  deliveredDate?: Date;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const OrderSchema = new Schema<IOrder>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    guestEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },
    guestName: {
      type: String,
      trim: true,
    },
    guestPhone: {
      type: String,
      trim: true,
    },
    items: [
      {
        product: {
          type: Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        priceAtTime: {
          type: Number,
          required: true,
          min: 0,
        },
      },
    ],
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ["pending", "processing", "shipped", "delivered", "cancelled"],
      default: "pending",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },
    paymentMethod: {
      type: String,
      trim: true,
    },
    shippingAddress: {
      type: String,
      required: true,
      trim: true,
    },
    trackingNumber: {
      type: String,
      trim: true,
    },
    orderDate: {
      type: Date,
      default: Date.now,
    },
    deliveredDate: {
      type: Date,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

// --- Synchronous pre‑save hooks (no `next`) ---

// 1. Validate user or guest details – throws if invalid
OrderSchema.pre("validate", function () {
  if (!this.user && (!this.guestEmail || !this.guestName)) {
    throw new Error(
      "Either user or both guestEmail and guestName must be provided",
    );
  }
});

// 2. Auto‑calculate totalAmount from items – overwrites any incoming value
OrderSchema.pre("validate", function () {
  if (this.items && this.items.length > 0) {
    let calculatedTotal = 0;
    for (const item of this.items) {
      calculatedTotal += item.priceAtTime * item.quantity;
    }
    this.totalAmount = calculatedTotal;
  } else {
    this.totalAmount = 0;
  }
});

// --- Indexes ---
OrderSchema.index({ user: 1 });
OrderSchema.index({ guestEmail: 1 });
OrderSchema.index({ status: 1 });
OrderSchema.index({ orderDate: -1 });

// --- Model ---
const Order =
  (mongoose.models.Order as Model<IOrder>) ||
  mongoose.model<IOrder>("Order", OrderSchema);

export default Order;
