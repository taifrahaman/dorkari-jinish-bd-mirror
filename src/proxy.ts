// src/proxy.ts

import { NextRequest } from "next/server";

import { adminMiddleware } from "./middlewares/admin";
import intlMiddleware from "./middlewares/intl";

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Admin routes: our own guard, no i18n
  if (pathname.startsWith("/admin")) {
    return adminMiddleware(request);
  }

  // Everything else: locale routing
  return intlMiddleware(request);
}

export const config = {
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
