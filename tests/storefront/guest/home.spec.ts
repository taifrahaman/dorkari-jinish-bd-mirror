// tests/storefront/guest/home.spec.ts

import { test, expect } from "../../fixtures/base-test";

test.describe("Storefront Homepage (Guest)", () => {
  test("loads the hero section with the correct English headings", async ({
    homePage,
  }) => {
    await homePage.goto();

    // 1. Assert the dynamic H1 from HomeHero.tsx is visible
    await homePage.expectLoaded();

    // 2. Assert the brand name is present
    await expect(
      homePage.page.getByText("Dorkari Jinish", { exact: true }).first(),
    ).toBeVisible();
  });

  test("renders dynamic collection tabs and categories", async ({
    homePage,
  }) => {
    await homePage.goto();

    // Assert at least one collection tab is rendered
    await expect(homePage.collectionTabs.first()).toBeVisible();

    // Assert that the category tiles link to the shop properly
    const firstCategory = homePage.categoryLinks.first();
    await expect(firstCategory).toBeVisible();

    // Verify the href contains the shop and category query
    const href = await firstCategory.getAttribute("href");
    expect(href).toContain("/shop?category=");
  });
});
