// tests/admin/checkout-shipping.spec.ts

import type { APIRequestContext } from "@playwright/test";
import { test, expect } from "../fixtures/base-test";

/**
 * Verifies the storefront checkout endpoint reads shipping config
 * from the Setting singleton (Phase 0.3b).
 *
 * ⚠️ These hit /api/storefront/orders, which is rate-limited to
 * 5 req/min per IP. Three tests in this file stay under the limit
 * on their own. If the full suite ever starts getting 429s here,
 * set DISABLE_RATE_LIMIT=true in .env.test.
 */
test.describe.configure({ mode: "serial" });

async function firstProductWithStock(
  request: APIRequestContext,
): Promise<{ _id: string; price: number; stock: number } | null> {
  const res = await request.get("/api/admin/products?limit=50&isActive=true");
  if (!res.ok()) return null;
  const data = await res.json();
  const items: Array<{ _id: string; price: number; stock: number }> =
    data?.data?.items ?? [];
  return (
    items.find(
      (p) =>
        typeof p.stock === "number" &&
        p.stock > 0 &&
        typeof p.price === "number" &&
        p.price > 0,
    ) ?? null
  );
}

test.describe("Storefront checkout — shipping from settings", () => {
  test("order below threshold is charged the configured fee", async ({
    request,
  }) => {
    const settingsRes = await request.get("/api/admin/settings");
    const settings = (await settingsRes.json()).data;

    if (!settings.delivery.freeShippingEnabled) {
      test.skip(true, "Free-shipping is disabled in settings.");
      return;
    }

    const product = await firstProductWithStock(request);
    if (!product) {
      test.skip(true, "No product with stock.");
      return;
    }
    if (product.price >= settings.delivery.freeShippingThreshold) {
      test.skip(true, "Product price alone exceeds the free threshold.");
      return;
    }

    const orderRes = await request.post("/api/storefront/orders", {
      data: {
        customer: {
          name: "Shipping Test",
          phone: "01700000004",
          email: "",
        },
        shippingAddress: "Test address for shipping",
        paymentMethod: "cod",
        items: [{ productId: product._id, quantity: 1 }],
      },
    });

    expect(orderRes.ok()).toBe(true);
    const order = (await orderRes.json()).data;
    expect(order.shippingFee).toBe(settings.delivery.fee);
  });

  test("order above threshold gets free shipping", async ({ request }) => {
    const settingsRes = await request.get("/api/admin/settings");
    const settings = (await settingsRes.json()).data;

    if (!settings.delivery.freeShippingEnabled) {
      test.skip(true, "Free-shipping is disabled in settings.");
      return;
    }

    const product = await firstProductWithStock(request);
    if (!product) {
      test.skip(true, "No product with stock.");
      return;
    }

    const unitsNeeded = Math.ceil(
      settings.delivery.freeShippingThreshold / product.price,
    );
    if (unitsNeeded < 1) {
      test.skip(true, "Product price alone exceeds the threshold.");
      return;
    }
    if (product.stock < unitsNeeded) {
      test.skip(true, "Not enough stock to reach threshold.");
      return;
    }

    const orderRes = await request.post("/api/storefront/orders", {
      data: {
        customer: {
          name: "Shipping Test",
          phone: "01700000005",
          email: "",
        },
        shippingAddress: "Test address for shipping",
        paymentMethod: "cod",
        items: [{ productId: product._id, quantity: unitsNeeded }],
      },
    });

    expect(orderRes.ok()).toBe(true);
    const order = (await orderRes.json()).data;
    expect(order.shippingFee).toBe(0);
  });

  test("mobile_payment is rejected by the storefront API", async ({
    request,
  }) => {
    const product = await firstProductWithStock(request);
    if (!product) {
      test.skip(true, "No product with stock.");
      return;
    }

    const res = await request.post("/api/storefront/orders", {
      data: {
        customer: { name: "Test", phone: "01700000006", email: "" },
        shippingAddress: "Test address for mobile payment",
        paymentMethod: "mobile_payment",
        items: [{ productId: product._id, quantity: 1 }],
      },
    });

    expect(res.status()).toBe(422);
    const body = await res.json();
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });
});
