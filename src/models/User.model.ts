// src/models/User.model.ts

import mongoose, { Schema, Document, Model } from "mongoose";
import { normalizePhone } from "@/lib/admin/phone";

/* ============================================================
 * Types
 * ============================================================ */

export type UserRole = "admin" | "moderator" | "customer";
export type UserStatus = "active" | "inactive";

export type CustomerSource =
  | "online"
  | "google"
  | "walk-in"
  | "phone"
  | "facebook"
  | "whatsapp"
  | "manual"
  | "import";

export interface IUser extends Document {
  name: string;
  email?: string;
  /** Display phone — as entered by whoever created the record. */
  phone?: string;
  /** Normalized to BD local format — used for matching. */
  phoneNormalized?: string;
  password?: string;
  role: UserRole;
  isShadow: boolean;
  source: CustomerSource;
  createdBy?: mongoose.Types.ObjectId | IUser;
  address?: string;
  notes?: string;
  tags: string[];
  status: UserStatus;
  lastLogin?: Date;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/* ============================================================
 * Constants
 * ============================================================ */

export const CUSTOMER_SOURCES: readonly CustomerSource[] = [
  "online",
  "google",
  "walk-in",
  "phone",
  "facebook",
  "whatsapp",
  "manual",
  "import",
] as const;

/* ============================================================
 * Schema
 * ============================================================ */

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    phoneNormalized: { type: String, trim: true },
    password: { type: String },
    role: {
      type: String,
      enum: ["admin", "moderator", "customer"],
      default: "customer",
    },
    isShadow: { type: Boolean, default: false },
    source: {
      type: String,
      enum: [...CUSTOMER_SOURCES],
      default: "online",
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    address: { type: String, trim: true },
    notes: { type: String, trim: true, maxlength: 2000 },
    tags: { type: [String], default: [] },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    lastLogin: { type: Date },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

/* ============================================================
 * Middleware — auto-compute phoneNormalized
 * ============================================================ */

UserSchema.pre("save", async function () {
  if (this.isModified("phone") || this.isNew) {
    const raw = this.phone?.trim();
    this.phoneNormalized = raw ? normalizePhone(raw) || undefined : undefined;
  }
});

/* ============================================================
 * Indexes
 * ============================================================ */

UserSchema.index({ email: 1 }, { unique: true, sparse: true });
UserSchema.index(
  { phoneNormalized: 1 },
  { unique: true, sparse: true, name: "phoneNormalized_1" },
);
UserSchema.index({ role: 1 });
UserSchema.index({ isShadow: 1 });
UserSchema.index({ source: 1 });
UserSchema.index({ tags: 1 });
UserSchema.index({ createdBy: 1 });
UserSchema.index({ createdAt: -1 });
UserSchema.index({ deletedAt: 1 });

const User =
  (mongoose.models.User as Model<IUser>) ||
  mongoose.model<IUser>("User", UserSchema);

export default User;
