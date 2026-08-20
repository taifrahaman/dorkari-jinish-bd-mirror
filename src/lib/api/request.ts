// src/lib/request.ts

import { NextRequest } from "next/server";

/**
 * Extracts the client IP address from a NextRequest object.
 * Checks common proxy headers in order of precedence.
 */
export function getClientIp(request: NextRequest): string | undefined {
  // X-Forwarded-For is the standard proxy header
  const forwarded = request.headers.get("x-forwarded-for");

  if (forwarded) {
    // Take the first IP (client) from the comma-separated list
    return forwarded.split(",")[0].trim();
  }

  // X-Real-IP is a common alternative
  const realIp = request.headers.get("x-real-ip");

  if (realIp) {
    return realIp.trim();
  }

  // NextRequest does not expose a typed `ip` property.
  return undefined;
}
