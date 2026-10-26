// src/app/api/admin/staff/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { withDb } from "@/lib/api/api-handler";
import { handleApiError, BadRequestError } from "@/lib/errors";
import { verifyAuth, requireRole } from "@/middlewares/auth";
import { updateStaffSchema } from "@/lib/validations/staff.schema";
import {
  updateStaff,
  deactivateStaff,
  reactivateStaff,
  permanentDeleteStaff,
} from "@/services/staff.service";

type Context = { params: Promise<{ id: string }> };

export const PATCH = withDb(async (request: NextRequest, context: Context) => {
  try {
    const payload = await verifyAuth(request);
    requireRole(payload, ["admin"]);

    const { id } = await context.params;

    let json: unknown;
    try {
      json = await request.json();
    } catch {
      throw new BadRequestError("Invalid JSON body");
    }

    // Check if it's an update or reactivation request
    if (typeof json === "object" && json !== null && "reactivate" in json) {
      const data = await reactivateStaff(id);
      return NextResponse.json({ success: true, data });
    }

    const input = updateStaffSchema.parse(json);
    const data = await updateStaff(id, input);

    return NextResponse.json({ success: true, data });
  } catch (err) {
    return handleApiError(err);
  }
});

export const DELETE = withDb(async (request: NextRequest, context: Context) => {
  try {
    const payload = await verifyAuth(request);
    requireRole(payload, ["admin"]);

    const { id } = await context.params;

    // Check if we should permanently delete
    const isPermanent =
      request.nextUrl.searchParams.get("permanent") === "true";

    const data = isPermanent
      ? await permanentDeleteStaff(id)
      : await deactivateStaff(id);

    return NextResponse.json({ success: true, data });
  } catch (err) {
    return handleApiError(err);
  }
});
