// src/app/api/admin/reports/inventory/route.ts

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withDb } from "@/lib/api/api-handler";
import { handleApiError } from "@/lib/errors";
import { verifyAuth, requireRole } from "@/middlewares/auth";
import { getInventoryReport } from "@/services/report.service";

const querySchema = z.object({
  status: z.enum(["all", "in", "low", "out"]).default("all"),
});

export const GET = withDb(async (request: NextRequest) => {
  try {
    const payload = await verifyAuth(request);
    requireRole(payload, ["admin", "moderator"]);

    const raw = Object.fromEntries(request.nextUrl.searchParams);
    const { status } = querySchema.parse(raw);

    const data = await getInventoryReport(status);
    return NextResponse.json({ success: true, data });
  } catch (err) {
    return handleApiError(err);
  }
});
