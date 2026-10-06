// src/app/api/admin/categories/suggest/route.ts

import { NextRequest, NextResponse } from "next/server";
import { withDb } from "@/lib/api/api-handler";
import { handleApiError } from "@/lib/errors";
import { verifyAuth, requireRole } from "@/middlewares/auth";
import { categorySuggestQuerySchema } from "@/lib/validations/category.schema";
import { suggestCategories } from "@/services/category.service";

export const GET = withDb(async (request: NextRequest) => {
  try {
    const payload = await verifyAuth(request);
    requireRole(payload, ["admin", "moderator"]);

    const raw = Object.fromEntries(request.nextUrl.searchParams);
    const query = categorySuggestQuerySchema.parse(raw);

    const data = await suggestCategories(query);
    return NextResponse.json({ success: true, data });
  } catch (err) {
    return handleApiError(err);
  }
});
