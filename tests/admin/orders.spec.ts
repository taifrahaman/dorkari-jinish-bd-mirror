// tests/admin/orders.spec.ts

import { test, expect } from "../fixtures/base-test";
import { OrdersListPage } from "../page-objects/admin/orders-list.page";
import { OrderDetailPage } from "../page-objects/admin/order-detail.page";

test.describe("Admin Orders", () => {
  test("can view order list and update order status", async ({
    page,
    request,
  }) => {
    const listPage = new OrdersListPage(page);
    const detailPage = new OrderDetailPage(page);

    // 1. Find an existing order to work with
    const res = await request.get("/api/admin/orders?limit=1");
    const data = await res.json();

    if (!data.data?.items || data.data.items.length === 0) {
      test.skip(true, "No orders found in the database.");
      return;
    }

    const orderId = data.data.items[0]._id;
    const originalStatus = data.data.items[0].status;

    // 2. Go to Orders List and open the order
    await listPage.goto();
    await expect(listPage.tableRows.first()).toBeVisible();
    await listPage.clickFirstOrder();

    // 3. Change status to a different one (avoid 'Shipped' if it's already Shipped)
    const newStatus = originalStatus === "shipped" ? "Delivered" : "Shipped";
    await detailPage.changeOrderStatus(newStatus);
    await detailPage.saveChanges();

    // 4. Verify the success toast appeared
    const toast = page
      .locator("[data-sonner-toast]")
      .filter({ hasText: /updated/i })
      .first();
    await expect(toast).toBeVisible({ timeout: 10000 });

    // 5. BULLETPROOF VERIFICATION: Query the API directly.
    //    This proves the database was actually updated, regardless of how the UI renders the badge.
    const verifyRes = await request.get(`/api/admin/orders/${orderId}`);
    const verifyData = await verifyRes.json();

    expect(verifyData.data.status).toBe(newStatus.toLowerCase());
  });
});
