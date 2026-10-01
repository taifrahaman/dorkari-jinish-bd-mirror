// src/middlewares/admin.ts

import { NextRequest, NextResponse } from "next/server";
import { verifyAuth, requireRole, checkIp } from "./auth";

/**
 * Paths under /admin that must remain reachable without a session.
 */
const PUBLIC_ADMIN_PATHS = ["/admin/login"] as const;

function isPublicAdminPath(pathname: string): boolean {
  return PUBLIC_ADMIN_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

/**
 * Guard for the /admin namespace.
 *
 */
export async function adminMiddleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (!pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  if (isPublicAdminPath(pathname)) {
    return NextResponse.next();
  }

  try {
    const payload = await verifyAuth(request);
    requireRole(payload, ["admin", "moderator"]);
    checkIp(request);
    return NextResponse.next();
  } catch {
    const url = request.nextUrl.clone();
    const attempted = `${pathname}${search || ""}`;

    url.pathname = "/admin/login";
    url.search = `?next=${encodeURIComponent(attempted)}`;

    return NextResponse.redirect(url);
  }
}
