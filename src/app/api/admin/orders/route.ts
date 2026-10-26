// src/app/api/admin/orders/route.ts

import { NextRequest, NextResponse } from "next/server";
import { withDb } from "@/lib/api/api-handler";
import { handleApiError, BadRequestError } from "@/lib/errors";
import { verifyAuth, requireRole } from "@/middlewares/auth";
import {
  createOrderSchema,
  orderListQuerySchema,
} from "@/lib/validations/order.schema";
import { createOrder, listOrders } from "@/services/order.service";
import { redactOrdersForModerator } from "@/lib/auth/redact";
export const GET = withDb(async (request: NextRequest) => {
  try {
    const payload = await verifyAuth(request);
    requireRole(payload, ["admin", "moderator"]);

    const raw = Object.fromEntries(request.nextUrl.searchParams);
    const query = orderListQuerySchema.parse(raw);

    let data = await listOrders(query);

    // Redact financial data for moderators
    if (payload.role === "moderator") {
      data = {
        ...data,
        items: redactOrdersForModerator(data.items),
      };
    }

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

    const input = createOrderSchema.parse(json);
    const data = await createOrder(input, payload.userId);

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
});
