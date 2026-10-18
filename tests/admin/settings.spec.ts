// tests/admin/settings.spec.ts

import { test, expect } from "../fixtures/base-test";
import { SettingsPage } from "../page-objects/admin/settings.page";

test.describe("Admin Settings", () => {
  test("can update store name and verify it persists", async ({
    page,
    request,
  }) => {
    const settingsPage = new SettingsPage(page);

    // 1. Read the current store name (for cleanup)
    const initialRes = await request.get("/api/admin/settings");
    const initialData = await initialRes.json();
    const originalName = initialData.data?.store?.name;

    if (!originalName) {
      test.skip(true, "Could not load current settings.");
      return;
    }

    const testName = `Test Store ${Date.now()}`;

    try {
      // 2. Update via UI
      await settingsPage.goto();
      await settingsPage.updateStoreName(testName);
      await settingsPage.save();

      // 3. Verify toast
      const toast = page
        .locator("[data-sonner-toast]")
        .filter({ hasText: /saved|updated/i })
        .first();
      await expect(toast).toBeVisible({ timeout: 10000 });

      // 4. Verify via API (source of truth)
      const res = await request.get("/api/admin/settings");
      const data = await res.json();
      expect(data.data.store.name).toBe(testName);
    } finally {
      // 5. Restore original name via UI (safest, uses same schema path)
      try {
        await settingsPage.goto();
        await settingsPage.updateStoreName(originalName);
        await settingsPage.save();
      } catch (e) {
        console.warn("Failed to restore original store name:", e);
      }
    }
  });
});
