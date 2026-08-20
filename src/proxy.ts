// src/proxy.ts

import { NextRequest } from "next/server";

import { adminMiddleware } from "./middlewares/admin";
import intlMiddleware from "./middlewares/intl";

export default async function proxy(request: NextRequest) {
  // Run admin middleware first – protects /admin/* routes
  const adminResponse = await adminMiddleware(request);

  if (adminResponse.status !== 200) {
    return adminResponse;
  }

  // Then run internationalization middleware
  return intlMiddleware(request);
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
