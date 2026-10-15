// src/app/api/storefront/products/route.ts

import { NextResponse } from "next/server";

import { withDb } from "@/lib/api/api-handler";
import { handleApiError } from "@/lib/errors";
import { listStorefrontProducts } from "@/services/product.service";

export const GET = withDb(async () => {
  try {
    const data = await listStorefrontProducts();
    return NextResponse.json({ success: true, data });
  } catch (err) {
    return handleApiError(err);
  }
});
