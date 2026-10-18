// tests/admin/products-crud.spec.ts

import { test, expect } from "../fixtures/base-test";
import { ProductListPage } from "../page-objects/admin/products-list.page";
import { ProductFormPage } from "../page-objects/admin/product-form.page";

type ApiProduct = { name?: { en?: string }; deletedAt?: string | null };

test.describe("Admin Product CRUD", () => {
  const uniqueId = Date.now();
  const testProductName = `Test Product ${uniqueId}`;
  const testProductNameBn = `টেস্ট প্রোডাক্ট ${uniqueId}`;

  test("should create, edit, and archive a product", async ({ page }) => {
    const listPage = new ProductListPage(page);
    const formPage = new ProductFormPage(page);

    // 1. Go to Products list
    await listPage.goto();

    // 2. Create a new product
    await listPage.clickNewProduct();
    await formPage.fillProductInfo(
      testProductName,
      testProductNameBn,
      "1500",
      "10",
    );

    // Select category if the combobox is visible
    if (await formPage.categoryCombobox.isVisible()) {
      await formPage.selectFirstCategory();
    }

    await formPage.submit();
    await page.waitForURL("**/admin/products");

    // 3. Search for the newly created product
    await listPage.search(testProductName);
    const row = listPage.getProductRow(testProductName);
    await expect(row).toBeVisible();

    // 4. Edit the product
    await listPage.editProduct(testProductName);
    const editedName = `${testProductName} - Edited`;
    await formPage.nameEnInput.fill(editedName);
    await formPage.save();

    // 5. Verify update
    await listPage.goto();
    await listPage.search(editedName);
    await expect(listPage.getProductRow(editedName)).toBeVisible();

    // 6. Archive the product
    await listPage.archiveProduct(editedName);

    // 7. Click the Confirm button in the Archive dialog
    const confirmBtn = page.getByRole("button", {
      name: "Archive",
      exact: true,
    });
    await expect(confirmBtn).toBeVisible();
    await confirmBtn.click();

    // 8. Wait for the dialog to close
    await expect(confirmBtn).not.toBeVisible();

    // 9. BULLETPROOF VERIFICATION: Check the API directly
    const apiRes = await page.request.get(
      `/api/admin/products?q=${editedName}&includeDeleted=true`,
    );
    const apiData = await apiRes.json();

    // Safely extract the items array regardless of the nested structure
    const items = apiData.data?.items || apiData.items || [];

    // Assert the product exists in the API response
    expect(items.length).toBeGreaterThan(0);

    // Find our specific product and verify it is archived (deletedAt is set)
    const archivedProduct = (items as ApiProduct[]).find(
      (p) => p.name?.en === editedName,
    );
    expect(archivedProduct).toBeDefined();
    expect(archivedProduct?.deletedAt).not.toBeNull();
  });
});
