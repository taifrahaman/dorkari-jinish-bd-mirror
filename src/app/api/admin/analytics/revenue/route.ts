// src/app/api/admin/analytics/revenue/route.ts

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withDb } from "@/lib/api/api-handler";
import { handleApiError } from "@/lib/errors";
import { verifyAuth, requireRole } from "@/middlewares/auth";
import { getRevenueSeries } from "@/services/analytics.service";

const querySchema = z.object({
  range: z.enum(["today", "7d", "30d", "90d", "1y", "all"]).default("30d"),
});

export const GET = withDb(async (request: NextRequest) => {
  try {
    const payload = await verifyAuth(request);
    requireRole(payload, ["admin", "moderator"]);

    const raw = Object.fromEntries(request.nextUrl.searchParams);
    const { range } = querySchema.parse(raw);

    const data = await getRevenueSeries(range);
    return NextResponse.json({ success: true, data });
  } catch (err) {
    return handleApiError(err);
  }
});
