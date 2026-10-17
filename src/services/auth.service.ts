// src/services/auth.service.ts

import { User } from "@/models";
import { signJwt, verifyJwt, hashPassword, comparePassword } from "@/lib/auth";
import { normalizePhone } from "@/lib/admin/phone";
import { randomUUID } from "crypto";
import {
  ConflictError,
  UnauthorizedError,
  BadRequestError,
} from "@/lib/errors";

/**
 * Register a new user (Phone required, Email optional)
 */
export async function registerUser(data: {
  name: string;
  phone: string;
  email?: string;
  password: string;
  role?: "admin" | "moderator" | "customer";
}) {
  const { name, phone, email, password, role = "customer" } = data;

  const normalizedPhone = normalizePhone(phone);
  if (!normalizedPhone) {
    throw new BadRequestError("Invalid Bangladeshi phone number");
  }

  // Check if phone already exists
  const existingPhone = await User.findOne({
    phoneNormalized: normalizedPhone,
  });
  if (existingPhone) {
    throw new ConflictError("An account with this phone number already exists");
  }

  // Check if email already exists (if provided)
  if (email && email.trim() !== "") {
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      throw new ConflictError("An account with this email already exists");
    }
  }

  const hashedPassword = await hashPassword(password);

  const user = await User.create({
    name,
    phone,
    phoneNormalized: normalizedPhone,
    email: email && email.trim() !== "" ? email : undefined,
    password: hashedPassword,
    role,
    source: "online",
  });

  const userWithoutPassword = user.toObject();
  delete userWithoutPassword.password;

  return userWithoutPassword;
}

/**
 * Login user with Phone OR Email
 */
export async function loginUser(identifier: string, password: string) {
  const isEmail = identifier.includes("@");

  const query = isEmail
    ? { email: identifier }
    : { phoneNormalized: normalizePhone(identifier) };

  const user = await User.findOne(query);

  if (!user || !user.password) {
    throw new Error("Invalid credentials");
  }

  const isValid = await comparePassword(password, user.password);
  if (!isValid) {
    throw new Error("Invalid credentials");
  }

  user.lastLogin = new Date();
  await user.save();

  // Fallback email to phone for the JWT if email is missing
  const emailForToken = user.email || user.phone || "";

  const token = await signJwt({
    userId: user._id.toString(),
    email: emailForToken,
    role: user.role,
  });

  const userWithoutPassword = user.toObject();
  delete userWithoutPassword.password;

  return {
    user: userWithoutPassword,
    token,
  };
}

/**
 * Generate a guest checkout token (UUID)
 */
export function generateGuestToken(): string {
  return randomUUID();
}

/**
 * Decode JWT and retrieve user (without password)
 */
export async function getUserFromToken(token: string) {
  try {
    const payload = await verifyJwt(token);
    const user = await User.findById(payload.userId).select("-password");
    return user || null;
  } catch {
    return null;
  }
}

/* ============================================================
 * ADMIN LOGIN (Restored)
 * ============================================================ */

const ADMIN_ROLES = ["admin", "moderator"] as const;

/**
 * Admin-only login. Rejects customers even with valid credentials.
 */
export async function loginAdmin(email: string, password: string) {
  const user = await User.findOne({
    email,
    role: { $in: ADMIN_ROLES },
    status: "active",
    deletedAt: null,
  });

  // Same message for "no such user" and "wrong password" — no enumeration
  if (!user || !user.password) {
    throw new UnauthorizedError("Invalid credentials");
  }

  const ok = await comparePassword(password, user.password);
  if (!ok) {
    throw new UnauthorizedError("Invalid credentials");
  }

  user.lastLogin = new Date();
  await user.save();

  const token = await signJwt({
    userId: user._id.toString(),
    email: user.email || email, // Fallback to the email provided in the login form
    role: user.role,
  });

  const userWithoutPassword = user.toObject();
  delete userWithoutPassword.password;

  return { user: userWithoutPassword, token };
}
