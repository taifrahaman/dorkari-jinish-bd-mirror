// src/models/User.model.ts

import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  phone?: string;
  password?: string; // optional for shadow accounts
  role: "admin" | "moderator" | "customer";
  isShadow: boolean;
  createdBy?: mongoose.Types.ObjectId | IUser;
  address?: string;
  status: "active" | "inactive";
  lastLogin?: Date;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    password: {
      type: String,
      required: false, // shadow accounts may not have password
    },
    role: {
      type: String,
      enum: ["admin", "moderator", "customer"],
      default: "customer",
    },
    isShadow: { type: Boolean, default: false },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    address: { type: String, trim: true },
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

// Indexes
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ phone: 1 }, { unique: true, sparse: true });
UserSchema.index({ role: 1 });
UserSchema.index({ isShadow: 1 });
UserSchema.index({ createdBy: 1 });

const User =
  (mongoose.models.User as Model<IUser>) ||
  mongoose.model<IUser>("User", UserSchema);

export default User;
