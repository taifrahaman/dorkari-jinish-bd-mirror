// src/app/api/admin/brands/[id]/restore/route.ts

import { NextRequest, NextResponse } from "next/server";
import { withDb } from "@/lib/api/api-handler";
import { handleApiError } from "@/lib/errors";
import { verifyAuth, requireRole } from "@/middlewares/auth";
import { restoreBrand } from "@/services/brand.service";

type Params = { params: Promise<{ id: string }> };

export const POST = withDb(async (request: NextRequest, ctx: Params) => {
  try {
    const payload = await verifyAuth(request);
    requireRole(payload, ["admin", "moderator"]);

    const { id } = await ctx.params;
    const data = await restoreBrand(id);

    return NextResponse.json({ success: true, data });
  } catch (err) {
    return handleApiError(err);
  }
});
