// tests/admin/order-state-machine.spec.ts

import type { APIRequestContext } from "@playwright/test";
import { test, expect } from "../fixtures/base-test";

/**
 * API-driven tests for the Phase 0.5 order status state machine.
 *
 * Each test creates its own order via the admin API, attempts a
 * transition, and asserts on the response. Skips cleanly when no
 * product with stock is available.
 */

async function firstProductWithStock(
  request: APIRequestContext,
): Promise<{ _id: string; stock: number } | null> {
  const res = await request.get("/api/admin/products?limit=50&isActive=true");
  if (!res.ok()) return null;
  const data = await res.json();
  const items: Array<{ _id: string; stock: number }> = data?.data?.items ?? [];
  return items.find((p) => typeof p.stock === "number" && p.stock > 0) ?? null;
}

async function createTestOrder(
  request: APIRequestContext,
  productId: string,
): Promise<{ _id: string; status: string }> {
  const res = await request.post("/api/admin/orders", {
    data: {
      channel: "online",
      customer: { name: "State Machine Test", phone: "01700000000" },
      items: [{ product: productId, quantity: 1, priceAtTime: 100 }],
      shippingAddress: "Test address for state machine",
      paymentStatus: "pending",
      status: "pending",
    },
  });
  if (!res.ok()) {
    throw new Error(`Could not create order: ${await res.text()}`);
  }
  return (await res.json()).data;
}

test.describe("Order status state machine", () => {
  test("pending → delivered is rejected with the allowed list", async ({
    request,
  }) => {
    const product = await firstProductWithStock(request);
    if (!product) {
      test.skip(true, "No product with stock available.");
      return;
    }

    const order = await createTestOrder(request, product._id);

    const res = await request.patch(`/api/admin/orders/${order._id}`, {
      data: { status: "delivered" },
    });

    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error.message).toMatch(/Cannot change order status/);
    expect(body.error.message).toMatch(/confirmed/);
    expect(body.error.message).toMatch(/cancelled/);
  });

  test("pending → confirmed succeeds", async ({ request }) => {
    const product = await firstProductWithStock(request);
    if (!product) {
      test.skip(true, "No product with stock available.");
      return;
    }

    const order = await createTestOrder(request, product._id);

    const res = await request.patch(`/api/admin/orders/${order._id}`, {
      data: { status: "confirmed" },
    });

    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(body.data.status).toBe("confirmed");
  });

  test("cancelled is terminal", async ({ request }) => {
    const product = await firstProductWithStock(request);
    if (!product) {
      test.skip(true, "No product with stock available.");
      return;
    }

    const order = await createTestOrder(request, product._id);

    // Cancel is a legal transition from pending.
    const toCancelled = await request.patch(`/api/admin/orders/${order._id}`, {
      data: { status: "cancelled" },
    });
    expect(toCancelled.ok()).toBe(true);

    // Now nothing should be allowed out of cancelled.
    const res = await request.patch(`/api/admin/orders/${order._id}`, {
      data: { status: "confirmed" },
    });

    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error.message).toMatch(/terminal state/);
  });

  test("shipped → returned is allowed", async ({ request }) => {
    const product = await firstProductWithStock(request);
    if (!product) {
      test.skip(true, "No product with stock available.");
      return;
    }

    const order = await createTestOrder(request, product._id);

    for (const status of ["confirmed", "processing", "shipped", "returned"]) {
      const res = await request.patch(`/api/admin/orders/${order._id}`, {
        data: { status },
      });
      expect(res.ok(), `Transition to "${status}" should succeed`).toBe(true);
    }
  });
});
