// tests/page-objects/admin/pos.page.ts

import { Page, expect, Locator } from "@playwright/test";

export class POSPage {
  readonly searchInput: Locator;
  readonly checkoutButton: Locator;
  readonly tenderInput: Locator;
  readonly completeSaleButton: Locator;
  readonly newSaleButton: Locator;
  readonly successMessage: Locator;

  constructor(private page: Page) {
    this.searchInput = page.getByPlaceholder(
      "Search products or scan barcode…",
    );
    this.checkoutButton = page.getByRole("button", { name: /Checkout ·/i });
    this.tenderInput = page.locator("#pos-tender");
    this.completeSaleButton = page.getByRole("button", {
      name: "Complete sale",
    });

    // From POSReceipt.tsx
    this.newSaleButton = page.getByRole("button", { name: /New sale/i });
    this.successMessage = page.getByText("Sale complete", { exact: true });
  }

  async goto() {
    await this.page.goto("/admin/pos");
  }

  async searchAndAddProduct(productName: string) {
    await this.searchInput.fill(productName);
    // Wait for the debounce
    await this.page.waitForTimeout(500);

    // Use the exact aria-label from POSProductCard.tsx
    const productCard = this.page.getByRole("button", {
      name: `Add ${productName} to cart`,
    });
    await productCard.click();
  }

  async openCheckout() {
    await expect(this.checkoutButton).toBeEnabled();
    await this.checkoutButton.click();
  }

  async completeCashSale(tenderAmount: number) {
    await expect(
      this.page.getByRole("heading", { name: "Complete sale" }),
    ).toBeVisible();
    await this.tenderInput.fill(tenderAmount.toString());
    await this.completeSaleButton.click();
  }
}
