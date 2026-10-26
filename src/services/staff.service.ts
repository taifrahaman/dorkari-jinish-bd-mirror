// src/services/staff.service.ts

import { User } from "@/models";
import { hashPassword } from "@/lib/auth";
import { ConflictError, NotFoundError, BadRequestError } from "@/lib/errors";
import type {
  CreateStaffInput,
  UpdateStaffInput,
} from "@/lib/validations/staff.schema";

export async function listStaff() {
  // Only return admins and moderators, ignore customers
  return User.find({ role: { $in: ["admin", "moderator"] }, deletedAt: null })
    .select("-password")
    .sort({ createdAt: -1 })
    .lean();
}

export async function createStaff(input: CreateStaffInput) {
  const existing = await User.findOne({ email: input.email });
  if (existing) {
    throw new ConflictError("Email is already in use by another account");
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
  // Destructure to remove password safely without using 'any'
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

export async function deleteStaff(id: string) {
  const user = await User.findById(id);
  if (!user) throw new NotFoundError("Staff member not found");
  if (user.role === "admin")
    throw new BadRequestError("Cannot delete an admin account");

  // Soft delete
  user.deletedAt = new Date();
  user.status = "inactive";
  await user.save();

  return { _id: id };
}
