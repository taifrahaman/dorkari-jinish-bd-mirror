// src/services/staff.service.ts

import { User } from "@/models";
import { hashPassword } from "@/lib/auth";
import { ConflictError, NotFoundError, BadRequestError } from "@/lib/errors";
import type {
  CreateStaffInput,
  UpdateStaffInput,
} from "@/lib/validations/staff.schema";

export async function listStaff() {
  // Return ALL staff, even deactivated ones. The frontend will filter them.
  return User.find({ role: { $in: ["admin", "moderator"] } })
    .select("-password")
    .sort({ createdAt: -1 })
    .lean();
}

export async function createStaff(input: CreateStaffInput) {
  // Make the search case-insensitive and match ANY account (active or deleted)
  const existing = await User.findOne({
    email: { $regex: new RegExp(`^${input.email}$`, "i") },
  });

  if (existing) {
    if (existing.deletedAt) {
      throw new ConflictError(
        "This email belongs to a deactivated account. Please go to the 'Deactivated' tab and reactivate it instead of creating a new one.",
      );
    }
    throw new ConflictError(
      "Email is already in use by another active account.",
    );
  }

  const hashed = await hashPassword(input.password);

  const user = await User.create({
    name: input.name,
    email: input.email,
    password: hashed,
    role: "moderator",
    canCreateProduct: input.canCreateProduct,
    status: "active",
    source: "manual",
    isShadow: false,
  });

  const obj = user.toObject();
  const { password: _pw, ...safeUser } = obj;
  return safeUser;
}

export async function updateStaff(id: string, input: UpdateStaffInput) {
  const user = await User.findById(id);
  if (!user) throw new NotFoundError("Staff member not found");
  if (user.role === "admin")
    throw new BadRequestError("Cannot modify admin permissions");

  user.canCreateProduct = input.canCreateProduct;
  await user.save();

  const obj = user.toObject();
  const { password: _pw, ...safeUser } = obj;
  return safeUser;
}

export async function deactivateStaff(id: string) {
  const user = await User.findById(id);
  if (!user) throw new NotFoundError("Staff member not found");
  if (user.role === "admin")
    throw new BadRequestError("Cannot deactivate an admin account");

  user.deletedAt = new Date();
  user.status = "inactive";
  await user.save();

  return { _id: id };
}

export async function reactivateStaff(id: string) {
  const user = await User.findById(id);
  if (!user) throw new NotFoundError("Staff member not found");

  user.deletedAt = null;
  user.status = "active";
  await user.save();

  return { _id: id };
}

export async function permanentDeleteStaff(id: string) {
  const user = await User.findById(id);
  if (!user) throw new NotFoundError("Staff member not found");
  if (user.role === "admin")
    throw new BadRequestError("Cannot permanently delete an admin account");

  // Hard delete from the database
  await User.findByIdAndDelete(id);

  return { _id: id };
}
