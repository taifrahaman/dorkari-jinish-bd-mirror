// src/app/api/storefront/orders/route.ts

import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import mongoose from "mongoose";

import { withDb } from "@/lib/api/api-handler";
import { handleApiError, BadRequestError } from "@/lib/errors";
import { createOrder } from "@/services/order.service";
import Product from "@/models/Product.model";

// Define a specific schema for the public checkout
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
      productId: z.string(),
      quantity: z.number().int().min(1),
    }),
  ),
});

export const POST = withDb(async (request: NextRequest) => {
  try {
    const json = await request.json();
    const input = checkoutSchema.parse(json);

    // 1. Fetch real prices from DB to prevent client-side price tampering
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
        priceAtTime: dbProduct.price, // Use the DB price!
        costPriceAtTime: 0, // Added this line. Service will auto-fill from DB costPrice.
        discount: 0,
      };
    });

    // 2. Create the order using your existing service
    const order = await createOrder({
      channel: "online",
      customer: input.customer,
      items: verifiedItems,
      shippingAddress: input.shippingAddress,
      notes: input.notes,
      paymentMethod: input.paymentMethod,
      paymentStatus: "pending",
      status: "pending",
      shippingFee: 60, // Or pull from your settings
    });

    return NextResponse.json({ success: true, data: order });
  } catch (err) {
    return handleApiError(err);
  }
});
