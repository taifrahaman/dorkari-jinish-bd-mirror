// src/app/api/admin/settings/route.ts

import { NextRequest, NextResponse } from "next/server";
import { withDb } from "@/lib/api/api-handler";
import { handleApiError, BadRequestError } from "@/lib/errors";
import { verifyAuth, requireRole } from "@/middlewares/auth";
import { updateSettingsSchema } from "@/lib/validations/setting.schema";
import { getSettings, updateSettings } from "@/services/setting.service";

/* ============================================================
 * GET /api/admin/settings
 * ============================================================ */

export const GET = withDb(async (request: NextRequest) => {
  try {
    const payload = await verifyAuth(request);
    requireRole(payload, ["admin", "moderator"]);

    const data = await getSettings();
    return NextResponse.json({ success: true, data });
  } catch (err) {
    return handleApiError(err);
  }
});

/* ============================================================
 * PATCH /api/admin/settings
 * ============================================================ */

export const PATCH = withDb(async (request: NextRequest) => {
  try {
    const payload = await verifyAuth(request);
    requireRole(payload, ["admin", "moderator"]);

    let json: unknown;
    try {
      json = await request.json();
    } catch {
      throw new BadRequestError("Invalid JSON body");
    }

    const input = updateSettingsSchema.parse(json);
    const data = await updateSettings(input);

    return NextResponse.json({ success: true, data });
  } catch (err) {
    return handleApiError(err);
  }
});
