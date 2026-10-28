// tests/admin/roles-permissions.spec.ts

import { test, expect } from "../fixtures/base-test";
import { StaffPage } from "../page-objects/admin/staff.page";

test.describe("Admin Roles & Permissions Flow", () => {
  const uniqueId = Date.now();
  const modNoPermEmail = `mod_no_perm_${uniqueId}@dorkari.test`;
  const modWithPermEmail = `mod_with_perm_${uniqueId}@dorkari.test`;

  test("Admin creates staff, moderators test permissions, admin cleans up", async ({
    page,
    browser,
  }) => {
    const staffPage = new StaffPage(page);

    // 1. Admin: Create BOTH Moderators via UI
    await staffPage.goto();

    const credsNoPerm = await staffPage.createModerator(
      "Mod No Perm",
      modNoPermEmail,
      false,
    );
    await staffPage.closeDialog();
    await expect(staffPage.getStaffRow(modNoPermEmail)).toBeVisible();

    const credsWithPerm = await staffPage.createModerator(
      "Mod With Perm",
      modWithPermEmail,
      true,
    );
    await staffPage.closeDialog();
    await expect(staffPage.getStaffRow(modWithPermEmail)).toBeVisible();

    // ---------------------------------------------------------
    // 2. Test Moderator WITH permission (Create a product for us to test with)
    // ---------------------------------------------------------
    const contextWithPerm = await browser.newContext();
    const pageWithPerm = await contextWithPerm.newPage();

    await pageWithPerm.goto("/admin/login");
    await pageWithPerm.getByLabel("Email").fill(credsWithPerm.email);
    await pageWithPerm.getByLabel("Password").fill(credsWithPerm.password);
    await pageWithPerm.getByRole("button", { name: "Sign in" }).click();
    await pageWithPerm.waitForURL("/admin");

    // Verify Sidebar (No Reports/Staff)
    const sidebarWithPerm = pageWithPerm.locator("aside").first();
    await expect(
      sidebarWithPerm.getByRole("link", { name: "Reports" }),
    ).toHaveCount(0);
    await expect(
      sidebarWithPerm.getByRole("link", { name: "Staff" }),
    ).toHaveCount(0);

    // Verify Product List (Create/Import buttons VISIBLE)
    await pageWithPerm.goto("/admin/products");
    await expect(
      pageWithPerm.getByRole("main").getByRole("link", { name: "New product" }),
    ).toBeVisible();
    await expect(
      pageWithPerm.getByRole("main").getByRole("link", { name: "Import" }),
    ).toBeVisible();

    // Moderator creates a product
    await pageWithPerm
      .getByRole("main")
      .getByRole("link", { name: "New product" })
      .click();
    await pageWithPerm.waitForURL("**/admin/products/new");

    const testProductName = `Test Product by Mod ${uniqueId}`;
    await pageWithPerm.getByLabel("Name (English)").fill(testProductName);
    await pageWithPerm.getByLabel("Name (বাংলা)").fill(`মড টেস্ট ${uniqueId}`);
    await pageWithPerm.getByLabel("Selling price (BDT)").fill("500");
    await pageWithPerm.getByLabel("Stock quantity").fill("10");

    // Need to select a category for the product to save
    await pageWithPerm
      .getByRole("button", { name: "Select category…" })
      .click();
    await pageWithPerm.getByRole("option").first().click();

    await pageWithPerm.getByRole("button", { name: "Create product" }).click();
    await pageWithPerm.waitForURL("**/admin/products");

    // Extract the Product ID from the API so we can navigate to it later
    const productApiRes = await pageWithPerm.request.get(
      `/api/admin/products?q=${encodeURIComponent(testProductName)}`,
    );
    const productApiData = await productApiRes.json();
    const testProductId = productApiData.data.items[0]._id;

    await contextWithPerm.close();

    // ---------------------------------------------------------
    // 3. Test Moderator WITHOUT permission
    // ---------------------------------------------------------
    const contextNoPerm = await browser.newContext();
    const pageNoPerm = await contextNoPerm.newPage();

    await pageNoPerm.goto("/admin/login");
    await pageNoPerm.getByLabel("Email").fill(credsNoPerm.email);
    await pageNoPerm.getByLabel("Password").fill(credsNoPerm.password);
    await pageNoPerm.getByRole("button", { name: "Sign in" }).click();
    await pageNoPerm.waitForURL("/admin");

    // Verify Sidebar Restrictions
    const sidebarNoPerm = pageNoPerm.locator("aside").first();
    await expect(
      sidebarNoPerm.getByRole("link", { name: "Reports" }),
    ).toHaveCount(0);
    await expect(
      sidebarNoPerm.getByRole("link", { name: "Staff" }),
    ).toHaveCount(0);

    // Verify Product List (No Create/Import buttons)
    await pageNoPerm.goto("/admin/products");
    await expect(
      pageNoPerm.getByRole("link", { name: "New product" }),
    ).toHaveCount(0);
    await expect(pageNoPerm.getByRole("link", { name: "Import" })).toHaveCount(
      0,
    );

    // Navigate directly to the product we created earlier
    await pageNoPerm.goto(`/admin/products/${testProductId}`);

    // Verify Product Details (No Profit/Economics)
    await expect(pageNoPerm.getByText("Economics")).toHaveCount(0);
    await expect(pageNoPerm.getByText("Profit", { exact: true })).toHaveCount(
      0,
    );

    // Verify API Redaction
    const apiProductRes = await pageNoPerm.request.get(
      `/api/admin/products/${testProductId}`,
    );
    const apiProductData = await apiProductRes.json();
    expect(apiProductData.data).not.toHaveProperty("costPrice");
    expect(apiProductData.data).not.toHaveProperty("costHistory");

    await contextNoPerm.close();

    // ---------------------------------------------------------
    // 4. Admin Cleanup: Deactivate and Delete both
    // ---------------------------------------------------------
    await staffPage.goto();
    await staffPage.deactivateAndDelete(modNoPermEmail);
    await staffPage.deactivateAndDelete(modWithPermEmail);
  });
});
