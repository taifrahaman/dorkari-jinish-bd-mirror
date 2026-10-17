// src/app/api/storefront/orders/my-orders/route.ts

import { NextResponse, type NextRequest } from "next/server";
import { withDb } from "@/lib/api/api-handler";
import { handleApiError } from "@/lib/errors";
import { withAuth } from "@/middlewares/auth";
import { listOrders } from "@/services/order.service";

export const GET = withDb(async (request: NextRequest) => {
  try {
    // Verify user is logged in
    const { payload } = await withAuth(request, { checkIp: false });

    // Fetch orders where the user field matches the JWT userId
    const data = await listOrders({
      user: payload.userId,
      page: 1,
      limit: 50,
      includeDeleted: false,
      sortBy: "createdAt",
      sortOrder: "desc",
    });

    return NextResponse.json({ success: true, data });
  } catch (err) {
    return handleApiError(err);
  }
});
