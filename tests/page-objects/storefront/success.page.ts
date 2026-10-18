// tests/page-objects/storefront/success.page.ts

import { Page, expect } from "@playwright/test";

export class SuccessPage {
  constructor(private page: Page) {}

  async expectSuccess() {
    await expect(
      this.page.getByRole("heading", { name: "Order Confirmed!" }),
    ).toBeVisible();
    await expect(this.page.getByText("Order ID")).toBeVisible();
  }
}
