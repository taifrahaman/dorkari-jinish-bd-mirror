// tests/page-objects/admin/product-form.page.ts

import { Page, expect, Locator } from "@playwright/test";

export class ProductFormPage {
  readonly nameEnInput: Locator;
  readonly nameBnInput: Locator;
  readonly priceInput: Locator;
  readonly stockInput: Locator;
  readonly categoryCombobox: Locator;
  readonly submitButton: Locator;
  readonly saveButton: Locator;

  constructor(private page: Page) {
    this.nameEnInput = page.locator('input[name="name.en"]');
    this.nameBnInput = page.locator('input[name="name.bn"]');
    this.priceInput = page.locator('input[name="price"]');
    this.stockInput = page.locator('input[name="stock"]');
    // Target the first combobox in the form
    this.categoryCombobox = page.getByRole("combobox").first();
    this.submitButton = page.getByRole("button", { name: "Create product" });
    this.saveButton = page.getByRole("button", { name: "Save changes" });
  }

  async fillProductInfo(
    nameEn: string,
    nameBn: string,
    price: string,
    stock: string,
  ) {
    await this.nameEnInput.fill(nameEn);
    await this.nameBnInput.fill(nameBn);
    await this.priceInput.fill(price);
    await this.stockInput.fill(stock);
  }

  async selectFirstCategory() {
    await this.categoryCombobox.click();

    // Wait for the dropdown options to actually appear on screen
    const firstOption = this.page.getByRole("option").first();
    await expect(firstOption).toBeVisible({ timeout: 5000 });
    await firstOption.click();
  }

  async submit() {
    await this.submitButton.click();
  }

  async save() {
    await this.saveButton.click();
  }
}
