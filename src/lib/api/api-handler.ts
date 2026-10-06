// src/lib/api/api-handler.ts

import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";

/* ============================================================
 * Default context — matches Next.js's built-in route handler
 * context shape (used by catch-all and dynamic segments).
 * ============================================================ */

export type ApiContext = {
  params: Promise<Record<string, string | string[]>>;
};

/* ============================================================
 * Generic handler type
 *
 * `C` is the concrete context shape for a given route. Dynamic
 * routes like `[id]` narrow it to `{ params: Promise<{ id: string }> }`
 * without forcing every other route to carry the same shape.
 * ============================================================ */

export type ApiHandler<C = ApiContext> = (
  request: NextRequest,
  context: C,
) => Promise<NextResponse>;

/* ============================================================
 * withDb — wraps a handler to ensure MongoDB is connected
 *
 * Usage:
 *   export const GET = withDb(async (req, context) => { ... });
 *   export const PATCH = withDb<Context>(async (req, context) => { ... });
 *
 * The generic `C` is inferred from the handler's second parameter,
 * so you usually don't need to pass it explicitly — just type the
 * parameter and TypeScript does the rest.
 * ============================================================ */

export function withDb<C = ApiContext>(handler: ApiHandler<C>): ApiHandler<C> {
  return async (request: NextRequest, context: C) => {
    await connectToDatabase();
    return handler(request, context);
  };
}
