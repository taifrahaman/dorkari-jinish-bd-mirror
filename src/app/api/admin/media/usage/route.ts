// src/app/api/admin/media/usage/route.ts

import { NextRequest, NextResponse } from "next/server";
import { withDb } from "@/lib/api/api-handler";
import { handleApiError } from "@/lib/errors";
import { verifyAuth, requireRole } from "@/middlewares/auth";
import { mediaUsageQuerySchema } from "@/lib/validations/media.schema";
import { getUsageMap } from "@/services/media.service";

export const GET = withDb(async (request: NextRequest) => {
  try {
    const payload = await verifyAuth(request);
    requireRole(payload, ["admin", "moderator"]);

    const raw = Object.fromEntries(request.nextUrl.searchParams);
    const { publicIds } = mediaUsageQuerySchema.parse(raw);

    const data = await getUsageMap(publicIds);
    return NextResponse.json({ success: true, data });
  } catch (err) {
    return handleApiError(err);
  }
});
