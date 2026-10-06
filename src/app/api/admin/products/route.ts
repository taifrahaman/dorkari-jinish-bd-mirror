// src/app/api/admin/products/route.ts

import { NextRequest, NextResponse } from "next/server";
import { withDb } from "@/lib/api/api-handler";
import { handleApiError, BadRequestError } from "@/lib/errors";
import { verifyAuth, requireRole } from "@/middlewares/auth";
import {
  createProductSchema,
  productListQuerySchema,
} from "@/lib/validations/product.schema";
import { createProduct, listProducts } from "@/services/product.service";

export const GET = withDb(async (request: NextRequest) => {
  try {
    const payload = await verifyAuth(request);
    requireRole(payload, ["admin", "moderator"]);

    const raw = Object.fromEntries(request.nextUrl.searchParams);
    const query = productListQuerySchema.parse(raw);

    const data = await listProducts(query);
    return NextResponse.json({ success: true, data });
  } catch (err) {
    return handleApiError(err);
  }
});

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

    const input = createProductSchema.parse(json);
    const data = await createProduct(input);

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
});
