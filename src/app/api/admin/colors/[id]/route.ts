// src/app/api/admin/colors/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { withDb } from "@/lib/api/api-handler";
import { handleApiError, BadRequestError } from "@/lib/errors";
import { verifyAuth, requireRole } from "@/middlewares/auth";
import { updateColorSchema } from "@/lib/validations/color.schema";
import {
  getColorById,
  updateColor,
  deleteColor,
} from "@/services/color.service";

type Context = { params: Promise<{ id: string }> };

export const GET = withDb(async (request: NextRequest, context: Context) => {
  try {
    const payload = await verifyAuth(request);
    requireRole(payload, ["admin", "moderator"]);

    const { id } = await context.params;
    const data = await getColorById(id);

    return NextResponse.json({ success: true, data });
  } catch (err) {
    return handleApiError(err);
  }
});

export const PATCH = withDb(async (request: NextRequest, context: Context) => {
  try {
    const payload = await verifyAuth(request);
    requireRole(payload, ["admin", "moderator"]);

    const { id } = await context.params;

    let json: unknown;
    try {
      json = await request.json();
    } catch {
      throw new BadRequestError("Invalid JSON body");
    }

    const input = updateColorSchema.parse(json);
    const data = await updateColor(id, input);

    return NextResponse.json({ success: true, data });
  } catch (err) {
    return handleApiError(err);
  }
});

export const DELETE = withDb(async (request: NextRequest, context: Context) => {
  try {
    const payload = await verifyAuth(request);
    requireRole(payload, ["admin", "moderator"]);

    const { id } = await context.params;
    const data = await deleteColor(id);

    return NextResponse.json({ success: true, data });
  } catch (err) {
    return handleApiError(err);
  }
});
