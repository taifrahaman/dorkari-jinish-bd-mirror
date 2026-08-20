// src/middlewares/admin.ts

import { NextRequest, NextResponse } from "next/server";
import { verifyAuth, requireRole, checkIp } from "./auth";

/**
 * Middleware to protect admin routes.
 * - Checks for valid JWT via cookie (or header).
 * - Requires role 'admin' or 'moderator'.
 * - Optionally checks IP allowlist (if IP_ALLOWLIST env var is set).
 * - Redirects to '/' on any failure.
 */
export async function adminMiddleware(request: NextRequest) {
  // Only run for paths that start with /admin
  if (!request.nextUrl.pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  try {
    // Verify JWT and get payload
    const payload = await verifyAuth(request);

    // Require admin or moderator role
    requireRole(payload, ["admin", "moderator"]);

    // Check IP allowlist (if configured)
    checkIp(request);

    // All checks passed → continue
    return NextResponse.next();
  } catch {
    // On any error (missing token, invalid role, IP not allowed) → redirect to home
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }
}
