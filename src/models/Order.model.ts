// src/models/Order.model.ts

import mongoose, { Schema, Document, Model } from "mongoose";

/* ============================================================
 * Constants
 * ============================================================ */

export const ORDER_CHANNELS = [
  "online",
  "pos",
  "walk-in",
  "phone",
  "facebook",
  "whatsapp",
] as const;

export type OrderChannel = (typeof ORDER_CHANNELS)[number];

export const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "returned",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const PAYMENT_STATUSES = [
  "pending",
  "partial",
  "paid",
  "failed",
  "refunded",
] as const;

export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const PAYMENT_METHODS = [
  "cash",
  "mobile_payment",
  "cod",
  "card",
  "bank_transfer",
] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

/* ============================================================
 * Interfaces
 * ============================================================ */

export interface IOrderItem {
  product: mongoose.Types.ObjectId;
  nameSnapshot: string;
  skuSnapshot: string;
  quantity: number;
  priceAtTime: number;
  costPriceAtTime: number;
  discount: number;
  lineTotal: number;
}

export interface ICustomerSnapshot {
  name: string;
  phone?: string;
  email?: string;
}

export interface IOrder extends Document {
  /* Identification */
  orderNumber: string;
  channel: OrderChannel;

  /* Customer — all optional for POS sales */
  user?: mongoose.Types.ObjectId;
  guestEmail?: string;
  guestName?: string;
  guestPhone?: string;
  customerSnapshot?: ICustomerSnapshot;

  /* Items */
  items: IOrderItem[];

  /* Financial */
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  shippingFee: number;
  totalAmount: number;

  /* Profit */
  costTotal: number;
  profitTotal: number;

  /* Status */
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod?: PaymentMethod;

  /* Delivery */
  shippingAddress?: string;
  trackingNumber?: string;
  orderDate: Date;
  deliveredDate?: Date;

  /* Staff / audit */
  createdBy?: mongoose.Types.ObjectId;
  notes?: string;

  /* Soft delete */
  deletedAt?: Date | null;

  createdAt: Date;
  updatedAt: Date;
}

/* ============================================================
 * Schemas
 * ============================================================ */

const OrderItemSchema = new Schema<IOrderItem>(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    nameSnapshot: { type: String, required: true, trim: true },
    skuSnapshot: { type: String, default: "", trim: true },
    quantity: { type: Number, required: true, min: 1 },
    priceAtTime: { type: Number, required: true, min: 0 },
    costPriceAtTime: { type: Number, required: true, min: 0, default: 0 },
    discount: { type: Number, default: 0, min: 0 },
    lineTotal: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const CustomerSnapshotSchema = new Schema<ICustomerSnapshot>(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
  },
  { _id: false },
);

const OrderSchema = new Schema<IOrder>(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    channel: {
      type: String,
      enum: [...ORDER_CHANNELS],
      default: "online",
    },

    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    guestEmail: { type: String, trim: true, lowercase: true },
    guestName: { type: String, trim: true },
    guestPhone: { type: String, trim: true },
    customerSnapshot: { type: CustomerSnapshotSchema },

    items: {
      type: [OrderItemSchema],
      required: true,
      validate: {
        validator: (v: IOrderItem[]) => v.length > 0,
        message: "Order must have at least one item",
      },
    },

    subtotal: { type: Number, required: true, min: 0, default: 0 },
    discountTotal: { type: Number, default: 0, min: 0 },
    taxTotal: { type: Number, default: 0, min: 0 },
    shippingFee: { type: Number, default: 0, min: 0 },
    totalAmount: { type: Number, required: true, min: 0, default: 0 },

    costTotal: { type: Number, default: 0, min: 0 },
    profitTotal: { type: Number, default: 0 },

    status: {
      type: String,
      enum: [...ORDER_STATUSES],
      default: "pending",
    },
    paymentStatus: {
      type: String,
      enum: [...PAYMENT_STATUSES],
      default: "pending",
    },
    paymentMethod: {
      type: String,
      enum: [...PAYMENT_METHODS],
    },

    shippingAddress: { type: String, trim: true },
    trackingNumber: { type: String, trim: true },
    orderDate: { type: Date, default: Date.now },
    deliveredDate: { type: Date },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    notes: { type: String, trim: true, maxlength: 1000 },

    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

/* ============================================================
 * Middleware
 * ============================================================ */

OrderSchema.pre("validate", function () {
  const walkInChannels: OrderChannel[] = ["pos", "walk-in"];
  const isWalkIn = walkInChannels.includes(this.channel);

  if (isWalkIn) return;

  if (
    !this.user &&
    !this.customerSnapshot &&
    (!this.guestEmail || !this.guestName)
  ) {
    throw new Error(
      "Either user, customerSnapshot, or both guestEmail and guestName must be provided",
    );
  }
});

OrderSchema.pre("validate", function () {
  let subtotal = 0;
  let costTotal = 0;
  let lineDiscounts = 0;

  for (const item of this.items) {
    const gross = item.priceAtTime * item.quantity;
    const lineTotal = Math.max(0, gross - (item.discount ?? 0));

    item.lineTotal = lineTotal;
    subtotal += gross;
    lineDiscounts += item.discount ?? 0;
    costTotal += (item.costPriceAtTime ?? 0) * item.quantity;
  }

  this.subtotal = subtotal;
  this.costTotal = costTotal;
  this.discountTotal = lineDiscounts;
  this.taxTotal = 0;
  this.totalAmount =
    subtotal - this.discountTotal + this.taxTotal + (this.shippingFee ?? 0);
  this.profitTotal = subtotal - this.discountTotal - costTotal;
});

/* ============================================================
 * Indexes
 * ============================================================ */

OrderSchema.index({ orderNumber: 1 }, { unique: true });
OrderSchema.index({ user: 1 });
OrderSchema.index({ guestEmail: 1 });
OrderSchema.index({ status: 1 });
OrderSchema.index({ paymentStatus: 1 });
OrderSchema.index({ channel: 1 });
OrderSchema.index({ orderDate: -1 });
OrderSchema.index({ createdAt: -1 });
OrderSchema.index({ "items.product": 1 });
OrderSchema.index({ createdBy: 1 });

/* ============================================================
 * Model
 * ============================================================ */

const Order =
  (mongoose.models.Order as Model<IOrder>) ||
  mongoose.model<IOrder>("Order", OrderSchema);

export default Order;
