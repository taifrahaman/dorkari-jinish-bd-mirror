// tests/admin/taxonomy.spec.ts

import { test, expect } from "../fixtures/base-test";
import { BrandsPage } from "../page-objects/admin/brands.page";
import { ColorsPage } from "../page-objects/admin/colors.page";

test.describe("Admin Taxonomy", () => {
  test("can create a brand and verify it in the API", async ({
    page,
    request,
  }) => {
    const brandsPage = new BrandsPage(page);
    const uniqueId = Date.now();
    const brandNameEn = `Test Brand ${uniqueId}`;
    const brandNameBn = `টেস্ট ব্র্যান্ড ${uniqueId}`;

    await brandsPage.gotoNew();
    await brandsPage.fillAndCreate(brandNameEn, brandNameBn);

    await page.waitForURL("**/admin/brands", { timeout: 15000 });

    // Verify via API (bulletproof, no DOM assumptions)
    const res = await request.get(
      `/api/admin/brands?q=${encodeURIComponent(brandNameEn)}`,
    );
    const data = await res.json();
    expect(data.data.items.length).toBeGreaterThan(0);
    expect(data.data.items[0].name.en).toBe(brandNameEn);
  });

  test("can create a color and verify it in the API", async ({
    page,
    request,
  }) => {
    const colorsPage = new ColorsPage(page);
    const uniqueId = Date.now();
    const colorNameEn = `Test Color ${uniqueId}`;
    const colorNameBn = `টেস্ট কালার ${uniqueId}`;

    await colorsPage.gotoNew();
    await colorsPage.fillAndCreate(colorNameEn, colorNameBn, "#ff00ff");

    await page.waitForURL("**/admin/colors", { timeout: 15000 });

    const res = await request.get(
      `/api/admin/colors?q=${encodeURIComponent(colorNameEn)}`,
    );
    const data = await res.json();
    expect(data.data.items.length).toBeGreaterThan(0);
    expect(data.data.items[0].hex.toLowerCase()).toBe("#ff00ff");
  });

  test("category tree loads existing categories", async ({ page, request }) => {
    // Verify categories exist via API first
    const res = await request.get("/api/admin/categories/tree");
    const data = await res.json();
    const tree = data.data || data;

    if (!Array.isArray(tree) || tree.length === 0) {
      test.skip(true, "No categories in the database.");
      return;
    }

    // Navigate and verify the page loads
    await page.goto("/admin/categories");
    await expect(
      page.getByRole("heading", { name: "Categories" }),
    ).toBeVisible();

    // Verify the search input from CategoryTree renders (proves tree loaded)
    await expect(page.getByPlaceholder("Search categories…")).toBeVisible();

    // Verify at least one real category name appears on the page
    const firstName = tree[0]?.name?.en;
    if (firstName) {
      await expect(page.getByText(firstName).first()).toBeVisible();
    }
  });
});
