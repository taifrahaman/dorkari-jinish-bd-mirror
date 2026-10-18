// tests/page-objects/storefront/checkout.page.ts

import { Page, expect, Locator } from "@playwright/test";

export class CheckoutPage {
  readonly nameInput: Locator;
  readonly phoneInput: Locator;
  readonly addressInput: Locator;
  readonly placeOrderButton: Locator;

  constructor(private page: Page) {
    // Using the 'name' attribute injected by react-hook-form
    this.nameInput = page.locator('input[name="name"]');
    this.phoneInput = page.locator('input[name="phone"]');
    this.addressInput = page.locator('textarea[name="address"]');
    this.placeOrderButton = page.getByRole("button", { name: "Place Order" });
  }

  async goto() {
    await this.page.goto("/en/checkout");
  }

  async fillForm(name: string, phone: string, address: string) {
    await this.nameInput.fill(name);
    await this.phoneInput.fill(phone);
    await this.addressInput.fill(address);
  }

  async placeOrder() {
    await this.placeOrderButton.click();
  }
}
