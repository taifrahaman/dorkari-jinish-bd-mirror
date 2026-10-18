// tests/storefront/navigation-and-search.spec.ts

import { test, expect } from "../fixtures/base-test";
import { Navbar } from "../page-objects/components/navbar";
import { ShopPage } from "../page-objects/storefront/shop.page";

test.describe("Navigation and Search", () => {
  test("desktop navbar links navigate properly", async ({ page }) => {
    const navbar = new Navbar(page);
    await page.goto("/en");

    await expect(navbar.desktopShopLink).toBeVisible();
    await navbar.desktopShopLink.click();
    await expect(page).toHaveURL(/.*\/shop/);
  });

  test("mobile top cart opens drawer, bottom nav links to cart page", async ({
    page,
  }) => {
    // Set viewport to mobile size
    await page.setViewportSize({ width: 390, height: 844 });
    const navbar = new Navbar(page);

    await page.goto("/en");

    // 1. Top Cart button opens the drawer
    await navbar.mobileTopCart.click();
    await expect(
      page.getByRole("dialog", { name: "Shopping Cart" }),
    ).toBeVisible();

    // Close the drawer by clicking the Close button
    await page.getByRole("button", { name: "Close cart" }).click();
    await expect(
      page.getByRole("dialog", { name: "Shopping Cart" }),
    ).not.toBeVisible();

    // 2. Bottom Nav Cart link navigates to /cart
    await navbar.mobileBottomCartLink.click();
    await expect(page).toHaveURL(/.*\/cart/);
  });

  test("search filters the results", async ({ page }) => {
    const shopPage = new ShopPage(page);
    await shopPage.goto();

    // Search for a known product from our seeded DB
    await shopPage.searchFor("Test");
    await expect(page).toHaveURL(/.*q=Test/);

    // Verify results appear
    await expect(page.locator("article").first()).toBeVisible();
  });
});
