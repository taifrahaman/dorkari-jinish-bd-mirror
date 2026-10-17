// src/app/api/auth/profile/route.ts

import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import mongoose from "mongoose"; // <-- Added mongoose import
import { withDb } from "@/lib/api/api-handler";
import { handleApiError, BadRequestError, ConflictError } from "@/lib/errors";
import { withAuth } from "@/middlewares/auth";
import { User } from "@/models";
import { normalizePhone } from "@/lib/admin/phone";

const addressSchema = z.object({
  _id: z.string().optional(),
  label: z.string().min(1),
  address: z.string().min(5),
  phone: z.string().min(11),
  isDefault: z.boolean().default(false),
});

const profileUpdateSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().min(11).optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  addresses: z.array(addressSchema).optional(),
});

export const PUT = withDb(async (request: NextRequest) => {
  try {
    const { user } = await withAuth(request, { checkIp: false });
    if (!user) throw new BadRequestError("Not logged in");

    const body = await request.json();
    const data = profileUpdateSchema.parse(body);

    const dbUser = await User.findById(user._id);
    if (!dbUser) throw new BadRequestError("User not found");

    // Update Name
    if (data.name) dbUser.name = data.name;

    // Update Phone (Normalize it)
    if (data.phone) {
      const normalized = normalizePhone(data.phone);
      if (!normalized) throw new BadRequestError("Invalid phone number");
      // Check if phone is taken by another user
      const existing = await User.findOne({
        phoneNormalized: normalized,
        _id: { $ne: dbUser._id },
      });
      if (existing)
        throw new ConflictError(
          "Phone number is already in use by another account",
        );

      dbUser.phone = data.phone;
      dbUser.phoneNormalized = normalized;
    }

    // Update Email (Ensure uniqueness)
    if (data.email !== undefined) {
      if (data.email.trim() === "") {
        dbUser.email = undefined; // Allow removing email
      } else {
        const existing = await User.findOne({
          email: data.email,
          _id: { $ne: dbUser._id },
        });
        if (existing)
          throw new ConflictError("Email is already in use by another account");
        dbUser.email = data.email;
      }
    }

    // Update Addresses
    if (data.addresses) {
      let hasDefault = false;
      const mapped = data.addresses.map((a) => {
        let isDefault = a.isDefault;
        if (isDefault && hasDefault) isDefault = false;
        if (isDefault) hasDefault = true;

        return {
          ...a,
          isDefault,
          // Convert string _id to ObjectId for TypeScript/Mongoose compatibility
          _id: a._id ? new mongoose.Types.ObjectId(a._id) : undefined,
        };
      });

      if (mapped.length > 0 && !hasDefault) mapped[0].isDefault = true;
      dbUser.addresses = mapped;
    }

    await dbUser.save();

    const updatedUser = dbUser.toObject();
    delete updatedUser.password;

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (err) {
    return handleApiError(err);
  }
});
