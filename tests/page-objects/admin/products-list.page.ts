// tests/page-objects/admin/products-list.page.ts

import { Page, expect, Locator } from "@playwright/test";

export class ProductListPage {
  readonly newProductLink: Locator;
  readonly searchInput: Locator;

  constructor(private page: Page) {
    this.newProductLink = page.getByRole("link", { name: "New product" });
    this.searchInput = page.locator('input[placeholder*="Search products"]');
  }

  async goto() {
    await this.page.goto("/admin/products");
  }

  async clickNewProduct() {
    await this.newProductLink.click();
    await this.page.waitForURL("**/admin/products/new");
  }

  async search(query: string) {
    await this.searchInput.fill(query);
    await this.page.waitForTimeout(1000);
  }

  getProductRow(name: string): Locator {
    return this.page.getByRole("row").filter({ hasText: name });
  }

  async editProduct(name: string) {
    const row = this.getProductRow(name);
    await row.getByLabel("Row actions").click();
    await this.page.getByRole("menuitem", { name: "Edit" }).click();
    await this.page.waitForURL("**/admin/products/*/edit");
  }

  async archiveProduct(name: string) {
    const row = this.getProductRow(name);
    await row.getByLabel("Row actions").click();
    await this.page.getByRole("menuitem", { name: "Archive" }).click();
  }
}
