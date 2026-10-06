// src/app/api/admin/products/export/route.ts

import { NextRequest, NextResponse } from "next/server";
import { stringify } from "csv-stringify/sync";
import { withDb } from "@/lib/api/api-handler";
import { handleApiError } from "@/lib/errors";
import { verifyAuth, requireRole } from "@/middlewares/auth";
import { exportQuerySchema } from "@/lib/validations/import.schema";
import { fetchProductsForExport } from "@/services/product.service";

export const GET = withDb(async (request: NextRequest) => {
  try {
    const payload = await verifyAuth(request);
    requireRole(payload, ["admin", "moderator"]);

    const raw = Object.fromEntries(request.nextUrl.searchParams);
    const query = exportQuerySchema.parse(raw);

    const rows = await fetchProductsForExport({
      category: query.category,
      isActive: query.isActive,
      includeDeleted: query.includeDeleted,
      ids: query.ids,
    });

    const stamp = new Date().toISOString().slice(0, 10);

    if (query.format === "json") {
      return new NextResponse(JSON.stringify(rows, null, 2), {
        status: 200,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Content-Disposition": `attachment; filename="products-${stamp}.json"`,
          "Cache-Control": "no-store",
        },
      });
    }

    // CSV
    const csv = stringify(rows, { header: true });

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="products-${stamp}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
});
