// src/app/api/admin/categories/route.ts

import { NextRequest, NextResponse } from "next/server";
import { withDb } from "@/lib/api/api-handler";
import { handleApiError, BadRequestError } from "@/lib/errors";
import { verifyAuth, requireRole } from "@/middlewares/auth";
import {
  createCategorySchema,
  categoryListQuerySchema,
} from "@/lib/validations/category.schema";
import { createCategory, listCategories } from "@/services/category.service";

export const GET = withDb(async (request: NextRequest) => {
  try {
    const payload = await verifyAuth(request);
    requireRole(payload, ["admin", "moderator"]);

    const raw = Object.fromEntries(request.nextUrl.searchParams);
    const query = categoryListQuerySchema.parse(raw);

    const data = await listCategories(query);
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

    const input = createCategorySchema.parse(json);
    const data = await createCategory(input);

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
});
