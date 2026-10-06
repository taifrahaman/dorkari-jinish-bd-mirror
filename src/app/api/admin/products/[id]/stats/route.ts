// src/app/api/admin/products/[id]/stats/route.ts

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withDb } from "@/lib/api/api-handler";
import { handleApiError } from "@/lib/errors";
import { verifyAuth, requireRole } from "@/middlewares/auth";
import { getProductStats } from "@/services/product-stats.service";

/* ============================================================
 * Query
 * ============================================================ */

const querySchema = z.object({
  range: z.enum(["7d", "30d", "90d", "1y", "all"]).default("30d"),
});

type Context = { params: Promise<{ id: string }> };

/* ============================================================
 * GET /api/admin/products/[id]/stats
 * ============================================================ */

export const GET = withDb(async (request: NextRequest, context: Context) => {
  try {
    const payload = await verifyAuth(request);
    requireRole(payload, ["admin", "moderator"]);

    const { id } = await context.params;

    const raw = Object.fromEntries(request.nextUrl.searchParams);
    const { range } = querySchema.parse(raw);

    const data = await getProductStats(id, range);

    return NextResponse.json({ success: true, data });
  } catch (err) {
    return handleApiError(err);
  }
});
