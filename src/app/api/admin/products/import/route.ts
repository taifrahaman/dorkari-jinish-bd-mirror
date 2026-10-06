// src/app/api/admin/products/import/route.ts

import { NextRequest, NextResponse } from "next/server";
import { withDb } from "@/lib/api/api-handler";
import { handleApiError, BadRequestError } from "@/lib/errors";
import { verifyAuth, requireRole } from "@/middlewares/auth";
import { importPayloadSchema } from "@/lib/validations/import.schema";
import { importProducts } from "@/services/product.service";

export const POST = withDb(async (request: NextRequest) => {
  try {
    const payload = await verifyAuth(request);
    requireRole(payload, ["admin", "moderator"]);

    let json: unknown;
    try {
      json = await request.json();
    } catch {
      throw new BadRequestError("Invalid JSON body");
    }

    const input = importPayloadSchema.parse(json);
    const data = await importProducts(input);

    return NextResponse.json({ success: true, data });
  } catch (err) {
    return handleApiError(err);
  }
});
