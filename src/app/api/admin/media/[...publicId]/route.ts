// src/app/api/admin/media/[...publicId]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { withDb } from "@/lib/api/api-handler";
import { handleApiError, BadRequestError } from "@/lib/errors";
import { verifyAuth, requireRole } from "@/middlewares/auth";
import { deleteMedia } from "@/services/media.service";

type Context = { params: Promise<{ publicId: string[] }> };

export const DELETE = withDb(async (request: NextRequest, context: Context) => {
  try {
    const payload = await verifyAuth(request);
    requireRole(payload, ["admin", "moderator"]);

    const { publicId: parts } = await context.params;
    if (!parts || parts.length === 0) {
      throw new BadRequestError("publicId is required");
    }

    // Rebuild the full public_id from URL segments.
    const publicId = parts.map((s) => decodeURIComponent(s)).join("/");

    const force = request.nextUrl.searchParams.get("force") === "true";
    const data = await deleteMedia(publicId, force);

    return NextResponse.json({ success: true, data });
  } catch (err) {
    return handleApiError(err);
  }
});
