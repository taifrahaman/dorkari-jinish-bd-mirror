// tests/page-objects/admin/orders-list.page.ts

import { Page, expect, Locator } from "@playwright/test";

export class OrdersListPage {
  readonly searchInput: Locator;
  readonly tableRows: Locator;

  constructor(private page: Page) {
    this.searchInput = page.locator('input[placeholder*="Search by order"]');
    this.tableRows = page.locator("tbody tr");
  }

  async goto() {
    await this.page.goto("/admin/orders");
  }

  async searchFor(term: string) {
    await this.searchInput.fill(term);
    await this.page.waitForTimeout(1000);
  }

  async clickFirstOrder() {
    // FIX: Click the actual link inside the row, not the checkbox or empty space
    await this.page
      .locator("tbody tr")
      .first()
      .getByRole("link")
      .first()
      .click();
    await this.page.waitForURL(/.*\/admin\/orders\/[a-zA-Z0-9]+/);
  }
}
