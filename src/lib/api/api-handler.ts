// src/lib/api/api-handler.ts

import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";

export type ApiHandler = (
  request: NextRequest,
  context: {
    params: Promise<Record<string, string | string[]>>;
  },
) => Promise<NextResponse>;

/**
 * Higher-order function that connects to MongoDB before calling the handler.
 * Usage: export const POST = withDb(async (req) => { ... });
 */
export function withDb(handler: ApiHandler): ApiHandler {
  return async (request: NextRequest, context) => {
    await connectToDatabase();

    return handler(request, context);
  };
}
