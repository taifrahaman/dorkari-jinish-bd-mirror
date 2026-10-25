// tests/admin/order-status-panel-ui.spec.ts

import { test, expect } from "../fixtures/base-test";
import { OrderStatusPanelPage } from "../page-objects/admin/order-status-panel.page";

/**
 * Verifies the *UX* side of the Phase 0.5 state machine:
 * the admin dropdown only shows legal next statuses, and terminal
 * orders show a "no further transitions" note.
 *
 * Server-side enforcement is covered in order-state-machine.spec.ts.
 */
test.describe("Order status panel — UI", () => {
  test("pending order shows only legal next statuses", async ({
    page,
    request,
  }) => {
    const res = await request.get("/api/admin/orders?limit=20&status=pending");
    const data = await res.json();
    const items: Array<{ _id: string }> = data.data?.items ?? [];
    if (items.length === 0) {
      test.skip(true, "No pending orders available.");
      return;
    }

    await page.goto(`/admin/orders/${items[0]._id}`);
    const panel = new OrderStatusPanelPage(page);
    const options = await panel.visibleStatusOptions();

    // Server allows: pending → confirmed, cancelled (plus the
    // current value, which is always included as the selected item).
    expect(options).toEqual(
      expect.arrayContaining(["Pending", "Confirmed", "Cancelled"]),
    );
    // Illegal jumps are NOT in the dropdown.
    expect(options).not.toContain("Delivered");
    expect(options).not.toContain("Shipped");
    expect(options).not.toContain("Returned");
    expect(options).not.toContain("Processing");
  });

  test("cancelled order shows terminal note and no other options", async ({
    page,
    request,
  }) => {
    const res = await request.get(
      "/api/admin/orders?limit=20&status=cancelled",
    );
    const data = await res.json();
    const items: Array<{ _id: string }> = data.data?.items ?? [];
    if (items.length === 0) {
      test.skip(true, "No cancelled orders available.");
      return;
    }

    await page.goto(`/admin/orders/${items[0]._id}`);
    const panel = new OrderStatusPanelPage(page);

    await expect(panel.terminalNote).toBeVisible();

    const options = await panel.visibleStatusOptions();
    expect(options).toEqual(["Cancelled"]);
  });
});
