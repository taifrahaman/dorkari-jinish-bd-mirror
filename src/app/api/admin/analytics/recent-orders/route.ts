// src/app/api/admin/analytics/recent-orders/route.ts

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withDb } from "@/lib/api/api-handler";
import { handleApiError } from "@/lib/errors";
import { verifyAuth, requireRole } from "@/middlewares/auth";
import { getRecentOrders } from "@/services/analytics.service";

const querySchema = z.object({
  limit: z.coerce.number().int().min(1).max(20).default(8),
});

export const GET = withDb(async (request: NextRequest) => {
  try {
    const payload = await verifyAuth(request);
    requireRole(payload, ["admin", "moderator"]);

    const raw = Object.fromEntries(request.nextUrl.searchParams);
    const { limit } = querySchema.parse(raw);

    const data = await getRecentOrders(limit);
    return NextResponse.json({ success: true, data });
  } catch (err) {
    return handleApiError(err);
  }
});
