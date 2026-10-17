// src/app/api/storefront/search/route.ts

import { NextResponse, type NextRequest } from "next/server";
import { withDb } from "@/lib/api/api-handler";
import { handleApiError } from "@/lib/errors";
import { searchStorefrontProducts } from "@/services/product.service";

export const GET = withDb(async (request: NextRequest) => {
  try {
    const searchParams = request.nextUrl.searchParams;
    const q = searchParams.get("q") || "";

    // For the dropdown, we only need 4 results. The search page will request more.
    const limit = Number(searchParams.get("limit")) || 4;

    const data = await searchStorefrontProducts(q, limit);

    return NextResponse.json({ success: true, data });
  } catch (err) {
    return handleApiError(err);
  }
});
