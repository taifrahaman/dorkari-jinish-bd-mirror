// src/app/api/admin/categories/[id]/restore/route.ts

import { NextRequest, NextResponse } from "next/server";
import { withDb } from "@/lib/api/api-handler";
import { handleApiError } from "@/lib/errors";
import { verifyAuth, requireRole } from "@/middlewares/auth";
import { restoreCategory } from "@/services/category.service";

type Context = { params: Promise<{ id: string }> };

export const POST = withDb(async (request: NextRequest, context: Context) => {
  try {
    const payload = await verifyAuth(request);
    requireRole(payload, ["admin", "moderator"]);

    const { id } = await context.params;
    const data = await restoreCategory(id);

    return NextResponse.json({ success: true, data });
  } catch (err) {
    return handleApiError(err);
  }
});
