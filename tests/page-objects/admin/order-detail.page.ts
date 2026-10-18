// tests/page-objects/admin/order-detail.page.ts

import { Page, expect, Locator } from "@playwright/test";

export class OrderDetailPage {
  readonly orderStatusTrigger: Locator;
  readonly saveButton: Locator;

  constructor(private page: Page) {
    this.orderStatusTrigger = page.locator('button[role="combobox"]').first();
    this.saveButton = page.getByRole("button", { name: "Save changes" });
  }

  async changeOrderStatus(newStatus: string) {
    await this.orderStatusTrigger.click();

    await this.page
      .getByRole("option", { name: newStatus, exact: true })
      .click();
  }

  async saveChanges() {
    await expect(this.saveButton).toBeEnabled();
    await this.saveButton.click();
  }
}
