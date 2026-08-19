// src/middlewares/auth.ts

import { NextRequest } from "next/server";
import { verifyJwt, type AuthPayload } from "@/lib/auth";
import { User } from "@/models";
import { UnauthorizedError, ForbiddenError } from "@/lib/errors";
import { getClientIp } from "@/lib/request";

/**
 * Extract JWT token from cookies or Authorization header.
 */
export function extractToken(request: NextRequest): string | null {
  // Check cookie first (default)
  const token = request.cookies.get("token")?.value;
  if (token) return token;

  // Fallback to Authorization header
  const authHeader = request.headers.get("authorization");

  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }

  return null;
}

/**
 * Verify the JWT token and return the decoded payload.
 * Throws UnauthorizedError if token is missing or invalid.
 */
export async function verifyAuth(request: NextRequest): Promise<AuthPayload> {
  const token = extractToken(request);

  if (!token) {
    throw new UnauthorizedError("Missing authentication token");
  }

  try {
    const payload = await verifyJwt(token);
    return payload;
  } catch {
    throw new UnauthorizedError("Invalid or expired token");
  }
}

/**
 * Role-based access control guard.
 * Throws ForbiddenError if the payload role is not allowed.
 */
export function requireRole(
  payload: AuthPayload,
  allowedRoles: string | string[],
) {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  if (!roles.includes(payload.role)) {
    throw new ForbiddenError("Insufficient permissions");
  }

  return true;
}

/**
 * IP allowlist check.
 * Throws ForbiddenError if the client IP is not in the allowlist.
 * If no allowlist is configured, the check passes silently.
 */
export function checkIp(request: NextRequest) {
  const allowedIps = process.env.ADMIN_ALLOWED_IPS?.split(",") || [];

  if (allowedIps.length === 0) {
    return true;
  }

  const clientIp = getClientIp(request);

  if (!clientIp) {
    throw new ForbiddenError("Could not determine client IP");
  }

  if (!allowedIps.includes(clientIp)) {
    throw new ForbiddenError("Access denied from this IP");
  }

  return true;
}

/**
 * Full authentication guard.
 * - Verifies the JWT token.
 * - Optionally checks role permissions.
 * - Optionally checks IP allowlist.
 * - Returns the decoded payload and (if available) the full user document.
 */
export async function withAuth(
  request: NextRequest,
  options?: {
    allowedRoles?: string | string[];
    checkIp?: boolean;
  },
) {
  const payload = await verifyAuth(request);

  if (options?.allowedRoles) {
    requireRole(payload, options.allowedRoles);
  }

  // Default: check IP if the allowlist env var is set
  if (options?.checkIp !== false) {
    checkIp(request);
  }

  // Fetch full user from DB (excluding password)
  const user = payload.userId
    ? await User.findById(payload.userId).select("-password")
    : null;

  return { payload, user };
}
