// src/app/api/storefront/products/route.ts

import { NextResponse } from "next/server";

import { withDb } from "@/lib/api/api-handler";
import { handleApiError } from "@/lib/errors";
import { getCachedStorefrontProducts } from "@/lib/storefront/products-cache";

export const GET = withDb(async () => {
  try {
    const data = await getCachedStorefrontProducts();
    return NextResponse.json({ success: true, data });
  } catch (err) {
    return handleApiError(err);
  }
});
