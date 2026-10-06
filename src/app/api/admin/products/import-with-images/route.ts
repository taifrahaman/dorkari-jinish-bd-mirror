// src/app/api/admin/products/import-with-images/route.ts

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withDb } from "@/lib/api/api-handler";
import { handleApiError, BadRequestError } from "@/lib/errors";
import { verifyAuth, requireRole } from "@/middlewares/auth";
import {
  csvRowSchema,
  importOptionsSchema,
} from "@/lib/validations/import.schema";
import { importProductsWithImages } from "@/services/product.service";

/* ============================================================
 * Request schema
 *
 * The client sends raw CSV rows (already validated once in the
 * browser) plus the tmp Cloudinary public_ids assigned to each.
 * The server resolves category_slug/brand_slug → ObjectIds,
 * reserves SKUs, promotes images, then inserts.
 * ============================================================ */

const rowSchema = z.object({
  rowIndex: z.number().int().min(0),
  csvRow: csvRowSchema,
  /** Cloudinary `tmp/<session>/...` public_ids assigned to this row. */
  tmpPublicIds: z.array(z.string()).default([]),
});

const payloadSchema = z.object({
  rows: z
    .array(rowSchema)
    .min(1, "At least one row is required")
    .max(500, "At most 500 rows per import"),
  options: importOptionsSchema,
});

/* ============================================================
 * POST /api/admin/products/import-with-images
 * ============================================================ */

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

    const input = payloadSchema.parse(json);
    const result = await importProductsWithImages(input);

    return NextResponse.json({ success: true, data: result });
  } catch (err) {
    return handleApiError(err);
  }
});
