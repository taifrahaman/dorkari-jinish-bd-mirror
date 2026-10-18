// tests/storefront/wishlist.spec.ts

import { test, expect } from "../fixtures/base-test";
import { ShopPage } from "../page-objects/storefront/shop.page";

test.describe("Wishlist Functionality", () => {
  test.describe("Guest User", () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test("guest is prompted to login when clicking wishlist", async ({
      page,
    }) => {
      const shopPage = new ShopPage(page);
      await shopPage.goto();
      await shopPage.addToWishlistButton.click();

      const toast = page
        .locator("[data-sonner-toast]")
        .filter({ hasText: /login/i })
        .first();
      await expect(toast).toBeVisible();
      await page.waitForURL(/.*\/login/);
    });
  });

  test.describe("Logged-in Customer", () => {
    // Clear the wishlist via API before running the test to ensure a clean state
    test.beforeEach(async ({ request }) => {
      const meRes = await request.get("/api/auth/me");
      const meData = await meRes.json();
      if (meData.success && meData.user?.wishlist) {
        for (const id of meData.user.wishlist) {
          // Toggling the wishlist removes it
          await request.post("/api/auth/wishlist", { data: { productId: id } });
        }
      }
    });

    test("customer can add to wishlist and see it on the wishlist page", async ({
      page,
    }) => {
      const shopPage = new ShopPage(page);

      await shopPage.goto();
      await shopPage.addToWishlistButton.click();

      const toast = page
        .locator("[data-sonner-toast]")
        .filter({ hasText: /added to wishlist/i })
        .first();
      await expect(toast).toBeVisible();

      // Navigate to wishlist and verify item is there
      await page.goto("/en/wishlist");
      await expect(
        page.getByRole("heading", { name: "My Wishlist" }),
      ).toBeVisible();

      const productCards = page.locator("article");
      await expect(productCards.first()).toBeVisible();
    });
  });
});
