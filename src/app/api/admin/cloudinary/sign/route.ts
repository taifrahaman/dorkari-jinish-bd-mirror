// src/app/api/admin/cloudinary/sign/route.ts

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyAuth, requireRole } from "@/middlewares/auth";
import { handleApiError } from "@/lib/errors";
import { createSignedUploadParams } from "@/lib/cloudinary/sign";

/* ============================================================
 * Request body
 * ============================================================ */

const signRequestSchema = z.object({
  entity: z.enum(["products", "categories", "tmp"]),
  owner: z.string().trim().min(1).max(200),
  publicId: z.string().trim().min(1).max(200).optional(),
});

/* ============================================================
 * POST /api/admin/cloudinary/sign
 *
 * Called by the client before uploading a file to Cloudinary.
 * Returns short-lived signed params. The browser then POSTs the
 * file directly to Cloudinary using these params — the API
 * secret never touches the client.
 * ============================================================ */

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // 1. Auth — admin or moderator only
    const payload = await verifyAuth(request);
    requireRole(payload, ["admin", "moderator"]);

    // 2. Parse + validate body
    const json = await request.json();
    const input = signRequestSchema.parse(json);

    // 3. Sign
    const params = createSignedUploadParams({
      entity: input.entity,
      owner: input.owner,
      publicId: input.publicId,
    });

    // 4. Return
    return NextResponse.json({ success: true, data: params });
  } catch (err) {
    return handleApiError(err);
  }
}
