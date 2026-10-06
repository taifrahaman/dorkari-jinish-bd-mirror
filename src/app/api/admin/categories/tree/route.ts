// src/app/api/admin/categories/tree/route.ts

import { NextRequest, NextResponse } from "next/server";
import { withDb } from "@/lib/api/api-handler";
import { handleApiError } from "@/lib/errors";
import { verifyAuth, requireRole } from "@/middlewares/auth";
import { getCategoryTree } from "@/services/category.service";

export const GET = withDb(async (request: NextRequest) => {
  try {
    const payload = await verifyAuth(request);
    requireRole(payload, ["admin", "moderator"]);

    const params = request.nextUrl.searchParams;
    const includeDeleted = params.get("includeDeleted") === "true";
    const includeInactive = params.get("includeInactive") === "true";

    const data = await getCategoryTree({
      includeDeleted,
      includeInactive,
    });

    return NextResponse.json({ success: true, data });
  } catch (err) {
    return handleApiError(err);
  }
});
