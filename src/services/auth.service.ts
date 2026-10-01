// src/services/auth.service.ts

import { User } from "@/models";
import { signJwt, verifyJwt, hashPassword, comparePassword } from "@/lib/auth";
import { randomUUID } from "crypto";
import { ConflictError, UnauthorizedError } from "@/lib/errors";

/**
 * Register a new user
 */
export async function registerUser(data: {
  email: string;
  password: string;
  name: string;
  role?: "admin" | "moderator" | "customer";
}) {
  const { email, password, name, role = "customer" } = data;

  // Check for existing user
  const existing = await User.findOne({ email });

  if (existing) {
    throw new ConflictError("User with this email already exists");
  }

  const hashedPassword = await hashPassword(password);

  const user = await User.create({
    email,
    password: hashedPassword,
    name,
    role,
  });

  // Return user without password
  const userWithoutPassword = user.toObject();
  delete userWithoutPassword.password;

  return userWithoutPassword;
}

/**
 * Login user with email and password
 */
export async function loginUser(email: string, password: string) {
  const user = await User.findOne({ email });

  if (!user) {
    throw new Error("Invalid email or password");
  }

  // Shadow accounts or social login users may not have a password
  if (!user.password) {
    throw new Error("Invalid email or password");
  }

  const isValid = await comparePassword(password, user.password);

  if (!isValid) {
    throw new Error("Invalid email or password");
  }

  // Update last login timestamp
  user.lastLogin = new Date();
  await user.save();

  const token = await signJwt({
    userId: user._id.toString(),
    email: user.email,
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

const ADMIN_ROLES = ["admin", "moderator"] as const;

// Admin-only login. Rejects customers even with valid credentials.
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
    email: user.email,
    role: user.role,
  });

  const userWithoutPassword = user.toObject();
  delete userWithoutPassword.password;

  return { user: userWithoutPassword, token };
}
