// src/lib/auth/auth.ts

import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import bcrypt from "bcrypt";

// Environment variables
const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-change-me";
const JWT_EXPIRY = process.env.JWT_EXPIRY || "7d";
const BCRYPT_SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS || "10", 10);

const secretKey = new TextEncoder().encode(JWT_SECRET);

/**
 * Application-specific JWT payload.
 */
export type AuthPayload = JWTPayload & {
  userId: string;
  email: string;
  role: "admin" | "moderator" | "customer";
  canCreateProduct?: boolean;
};

/**
 * Create a signed JWT.
 */
export async function signJwt(
  payload: AuthPayload,
  expiresIn: string = JWT_EXPIRY,
): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(secretKey);
}

/**
 * Verify a JWT and return the validated application payload.
 */
export async function verifyJwt(token: string): Promise<AuthPayload> {
  try {
    const { payload } = await jwtVerify(token, secretKey);

    if (
      typeof payload.userId !== "string" ||
      typeof payload.email !== "string" ||
      !["admin", "moderator", "customer"].includes(payload.role as string)
    ) {
      throw new Error("Invalid token payload");
    }

    return payload as AuthPayload;
  } catch {
    throw new Error("Invalid or expired token");
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
}

export async function comparePassword(
  plain: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 7,
};
