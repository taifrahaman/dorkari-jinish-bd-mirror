// tests/admin/order-stock.spec.ts

import type { APIRequestContext } from "@playwright/test";
import { test, expect } from "../fixtures/base-test";
/**
 * Verifies stock moves correctly through the order lifecycle.
 *
 * Serial because these tests mutate a shared product's stock and
 * check deltas — parallel runs would race.
 */
test.describe.configure({ mode: "serial" });

async function firstProductWithStock(
  request: APIRequestContext,
  minStock = 5,
): Promise<{ _id: string; stock: number } | null> {
  const res = await request.get("/api/admin/products?limit=50&isActive=true");
  if (!res.ok()) return null;
  const data = await res.json();
  const items: Array<{ _id: string; stock: number }> = data?.data?.items ?? [];
  return (
    items.find((p) => typeof p.stock === "number" && p.stock >= minStock) ??
    null
  );
}

async function fetchStock(
  request: APIRequestContext,
  productId: string,
): Promise<number> {
  const res = await request.get(`/api/admin/products/${productId}`);
  const data = await res.json();
  return data.data.stock;
}

test.describe("Order stock movement", () => {
  test("creating an order decrements stock", async ({ request }) => {
    const product = await firstProductWithStock(request);
    if (!product) {
      test.skip(true, "No product with enough stock.");
      return;
    }

    const before = await fetchStock(request, product._id);

    const orderRes = await request.post("/api/admin/orders", {
      data: {
        channel: "online",
        customer: { name: "Stock Test", phone: "01700000001" },
        items: [{ product: product._id, quantity: 2, priceAtTime: 100 }],
        shippingAddress: "Test address for stock",
        paymentStatus: "pending",
      },
    });
    expect(orderRes.ok()).toBe(true);

    const after = await fetchStock(request, product._id);
    expect(after).toBe(before - 2);
  });

  test("cancelling an order restores stock", async ({ request }) => {
    const product = await firstProductWithStock(request);
    if (!product) {
      test.skip(true, "No product with enough stock.");
      return;
    }

    const before = await fetchStock(request, product._id);

    const orderRes = await request.post("/api/admin/orders", {
      data: {
        channel: "online",
        customer: { name: "Stock Test", phone: "01700000002" },
        items: [{ product: product._id, quantity: 2, priceAtTime: 100 }],
        shippingAddress: "Test address for stock",
        paymentStatus: "pending",
      },
    });
    const order = (await orderRes.json()).data;

    const cancelRes = await request.patch(`/api/admin/orders/${order._id}`, {
      data: { status: "cancelled" },
    });
    expect(cancelRes.ok()).toBe(true);

    const after = await fetchStock(request, product._id);
    expect(after).toBe(before);
  });

  test("order with quantity above stock is rejected", async ({ request }) => {
    const product = await firstProductWithStock(request, 1);
    if (!product) {
      test.skip(true, "No product with stock.");
      return;
    }

    const before = await fetchStock(request, product._id);

    const orderRes = await request.post("/api/admin/orders", {
      data: {
        channel: "online",
        customer: { name: "Stock Test", phone: "01700000003" },
        items: [
          { product: product._id, quantity: before + 100, priceAtTime: 100 },
        ],
        shippingAddress: "Test address for stock",
        paymentStatus: "pending",
      },
    });

    expect(orderRes.status()).toBe(400);
    const body = await orderRes.json();
    expect(body.error.message).toMatch(/in stock/);

    const after = await fetchStock(request, product._id);
    expect(after).toBe(before);
  });
});
