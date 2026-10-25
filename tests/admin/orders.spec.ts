// tests/admin/orders.spec.ts

import { test, expect } from "../fixtures/base-test";
import { OrderDetailPage } from "../page-objects/admin/order-detail.page";

/**
 * Maps an order's current status to a valid next status per the
 * Phase 0.5 state machine. Capitalized because the dropdown shows
 * labels, not enum values.
 */
const NEXT_STATUS: Record<string, string | undefined> = {
  pending: "Confirmed",
  confirmed: "Processing",
  processing: "Shipped",
  shipped: "Delivered",
  delivered: "Returned",
};

test.describe("Admin Orders", () => {
  test("can view order detail and update order status", async ({
    page,
    request,
  }) => {
    const detailPage = new OrderDetailPage(page);

    // 1. Find an order that still has a valid transition.
    const res = await request.get("/api/admin/orders?limit=20");
    const data = await res.json();

    const items: Array<{ _id: string; status: string; orderNumber: string }> =
      data.data?.items ?? [];

    if (items.length === 0) {
      test.skip(true, "No orders found in the database.");
      return;
    }

    const order = items.find((o) => NEXT_STATUS[o.status]);
    if (!order) {
      test.skip(
        true,
        "All existing orders are in terminal states — no valid transition available.",
      );
      return;
    }

    const orderId = order._id;
    const originalStatus = order.status;
    const newStatus = NEXT_STATUS[originalStatus]!;

    // 2. Navigate straight to this order — do NOT rely on the list
    //    page showing it as row 1 (list sort may differ from API sort).
    await page.goto(`/admin/orders/${orderId}`);
    await expect(page.getByText(order.orderNumber)).toBeVisible({
      timeout: 10000,
    });

    // 3. Change to the valid next status
    await detailPage.changeOrderStatus(newStatus);
    await detailPage.saveChanges();

    // 4. Verify the success toast appeared
    const toast = page
      .locator("[data-sonner-toast]")
      .filter({ hasText: /updated/i })
      .first();
    await expect(toast).toBeVisible({ timeout: 10000 });

    // 5. BULLETPROOF VERIFICATION: Query the API directly.
    const verifyRes = await request.get(`/api/admin/orders/${orderId}`);
    const verifyData = await verifyRes.json();

    expect(verifyData.data.status).toBe(newStatus.toLowerCase());
  });
});
