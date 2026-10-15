// src/app/api/admin/reports/inventory/route.ts

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withDb } from "@/lib/api/api-handler";
import { handleApiError } from "@/lib/errors";
import { verifyAuth, requireRole } from "@/middlewares/auth";
import { getInventoryReport } from "@/services/report.service";

const querySchema = z.object({
  status: z.enum(["all", "in", "low", "out"]).default("all"),
  sort: z
    .enum([
      "stock-asc",
      "stock-desc",
      "retail-desc",
      "retail-asc",
      "profit-desc",
      "name-asc",
    ])
    .default("stock-asc"),
});

export const GET = withDb(async (request: NextRequest) => {
  try {
    const payload = await verifyAuth(request);
    requireRole(payload, ["admin", "moderator"]);
    const raw = Object.fromEntries(request.nextUrl.searchParams);
    const { status, sort } = querySchema.parse(raw);

    const data = await getInventoryReport(status, sort);
    return NextResponse.json({ success: true, data });
  } catch (err) {
    return handleApiError(err);
  }
});
