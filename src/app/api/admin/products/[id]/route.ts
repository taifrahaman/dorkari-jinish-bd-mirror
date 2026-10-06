// src/app/api/admin/products/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { withDb } from "@/lib/api/api-handler";
import { handleApiError, BadRequestError } from "@/lib/errors";
import { verifyAuth, requireRole } from "@/middlewares/auth";
import { updateProductSchema } from "@/lib/validations/product.schema";
import {
  getProductById,
  updateProduct,
  archiveProduct,
} from "@/services/product.service";

type Context = { params: Promise<{ id: string }> };

export const GET = withDb(async (request: NextRequest, context: Context) => {
  try {
    const payload = await verifyAuth(request);
    requireRole(payload, ["admin", "moderator"]);

    const { id } = await context.params;
    const data = await getProductById(id);

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

    const input = updateProductSchema.parse(json);
    const data = await updateProduct(id, input);

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
    const data = await archiveProduct(id);

    return NextResponse.json({ success: true, data });
  } catch (err) {
    return handleApiError(err);
  }
});
