// src/app/api/admin/brands/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { withDb } from "@/lib/api/api-handler";
import { handleApiError, BadRequestError } from "@/lib/errors";
import { verifyAuth, requireRole } from "@/middlewares/auth";
import { updateBrandSchema } from "@/lib/validations/brand.schema";
import {
  archiveBrand,
  getBrandById,
  updateBrand,
} from "@/services/brand.service";

type Params = { params: Promise<{ id: string }> };

export const GET = withDb(async (request: NextRequest, ctx: Params) => {
  try {
    const payload = await verifyAuth(request);
    requireRole(payload, ["admin", "moderator"]);

    const { id } = await ctx.params;
    const data = await getBrandById(id);

    return NextResponse.json({ success: true, data });
  } catch (err) {
    return handleApiError(err);
  }
});

export const PATCH = withDb(async (request: NextRequest, ctx: Params) => {
  try {
    const payload = await verifyAuth(request);
    requireRole(payload, ["admin", "moderator"]);

    let json: unknown;
    try {
      json = await request.json();
    } catch {
      throw new BadRequestError("Invalid JSON body");
    }

    const { id } = await ctx.params;
    const input = updateBrandSchema.parse(json);
    const data = await updateBrand(id, input);

    return NextResponse.json({ success: true, data });
  } catch (err) {
    return handleApiError(err);
  }
});

export const DELETE = withDb(async (request: NextRequest, ctx: Params) => {
  try {
    const payload = await verifyAuth(request);
    requireRole(payload, ["admin", "moderator"]);

    const { id } = await ctx.params;
    const data = await archiveBrand(id);

    return NextResponse.json({ success: true, data });
  } catch (err) {
    return handleApiError(err);
  }
});
