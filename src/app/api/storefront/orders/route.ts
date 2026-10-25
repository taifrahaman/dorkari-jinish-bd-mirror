// src/app/api/storefront/orders/route.ts

import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import mongoose from "mongoose";

import { withDb } from "@/lib/api/api-handler";
import { getClientIp } from "@/lib/api/request";
import { rateLimit } from "@/lib/auth/rate-limit";
import { handleApiError, BadRequestError } from "@/lib/errors";
import { createOrder } from "@/services/order.service";
import { getStorefrontSettings } from "@/services/setting.service";
import Product from "@/models/Product.model";

/* ============================================================
 * Rate limit
 *
 * 5 order attempts per minute per IP. Real customers place one
 * order at a time; bots try many. In-memory counter — fine for
 * single-process deploys (the droplet, Vercel functions).
 * ============================================================ */

const ORDER_RATE_LIMIT = { max: 5, windowMs: 60 * 1000 };

/* ============================================================
 * Checkout schema
 * ============================================================ */

const checkoutSchema = z.object({
  customer: z.object({
    name: z.string().min(2),
    phone: z.string().min(10),
    email: z.string().email().optional().or(z.literal("")),
  }),
  shippingAddress: z.string().min(10),
  notes: z.string().optional(),
  paymentMethod: z.enum(["cod", "mobile_payment"]),
  items: z.array(
    z.object({
      productId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid product ID"),
      quantity: z.number().int().min(1),
      colorHex: z
        .string()
        .trim()
        .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "Invalid color hex")
        .optional(),
    }),
  ),
});

export const POST = withDb(async (request: NextRequest) => {
  try {
    /* ----- 1. Rate limit ----- */

    const ip = getClientIp(request) ?? "unknown";
    const limitKey = `storefront-order:${ip}`;
    const { allowed, retryAfterMs } = rateLimit(limitKey, ORDER_RATE_LIMIT);

    if (!allowed) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "Too many order attempts. Please try again shortly.",
            code: "RATE_LIMITED",
          },
        },
        {
          status: 429,
          headers: { "Retry-After": String(Math.ceil(retryAfterMs / 1000)) },
        },
      );
    }

    /* ----- 2. Parse body ----- */

    const json = await request.json();
    const input = checkoutSchema.parse(json);

    /* ----- 3. Verify products — real prices from DB ----- */

    const productIds = input.items.map(
      (i) => new mongoose.Types.ObjectId(i.productId),
    );
    const dbProducts = await Product.find({ _id: { $in: productIds } }).lean();
    const productMap = new Map(dbProducts.map((p) => [String(p._id), p]));

    const verifiedItems = input.items.map((item) => {
      const dbProduct = productMap.get(item.productId);
      if (!dbProduct)
        throw new BadRequestError(`Product ${item.productId} not found`);

      return {
        product: item.productId,
        quantity: item.quantity,
        priceAtTime: dbProduct.price,
        costPriceAtTime: 0,
        discount: 0,
        colorHex: item.colorHex,
      };
    });

    /* ----- 4. Compute shipping from settings ----- */

    const subtotal = verifiedItems.reduce(
      (sum, i) => sum + i.priceAtTime * i.quantity,
      0,
    );

    const settings = await getStorefrontSettings();
    const shippingFee =
      settings.delivery.freeShippingEnabled &&
      subtotal >= settings.delivery.freeShippingThreshold
        ? 0
        : settings.delivery.fee;

    /* ----- 5. Create order ----- */

    const order = await createOrder({
      channel: "online",
      customer: input.customer,
      items: verifiedItems,
      shippingAddress: input.shippingAddress,
      notes: input.notes,
      paymentMethod: input.paymentMethod,
      paymentStatus: "pending",
      status: "pending",
      shippingFee,
    });

    return NextResponse.json({ success: true, data: order });
  } catch (err) {
    return handleApiError(err);
  }
});
