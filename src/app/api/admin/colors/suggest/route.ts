// src/app/api/admin/colors/suggest/route.ts

import { NextRequest, NextResponse } from "next/server";
import { withDb } from "@/lib/api/api-handler";
import { handleApiError } from "@/lib/errors";
import { verifyAuth, requireRole } from "@/middlewares/auth";
import { colorSuggestQuerySchema } from "@/lib/validations/color.schema";
import { suggestColors } from "@/services/color.service";

export const GET = withDb(async (request: NextRequest) => {
  try {
    const payload = await verifyAuth(request);
    requireRole(payload, ["admin", "moderator"]);

    const raw = Object.fromEntries(request.nextUrl.searchParams);
    const query = colorSuggestQuerySchema.parse(raw);

    const data = await suggestColors(query);
    return NextResponse.json({ success: true, data });
  } catch (err) {
    return handleApiError(err);
  }
});
