// tests/page-objects/storefront/shop.page.ts

import { Page, expect, Locator } from "@playwright/test";

export class ShopPage {
  readonly searchInput: Locator;
  readonly filterButton: Locator;
  readonly filterPanel: Locator;
  readonly applyFiltersButton: Locator;
  readonly addToWishlistButton: Locator;

  constructor(private page: Page) {
    this.searchInput = page.getByPlaceholder(/Search rice cookers/i).first();
    this.filterButton = page.getByRole("button", { name: "Filters" });
    this.filterPanel = page.getByRole("dialog", { name: "Filters" });
    this.applyFiltersButton = page.getByRole("button", {
      name: /Show \d+ results/i,
    });
    // The heart icon on the first product card
    this.addToWishlistButton = page
      .getByRole("button", { name: "Add to wishlist" })
      .first();
  }

  async goto() {
    await this.page.goto("/en/shop");
  }

  async searchFor(term: string) {
    await this.searchInput.fill(term);
    await this.searchInput.press("Enter");
  }

  async openFilters() {
    await this.filterButton.click();
    await expect(this.filterPanel).toBeVisible();
  }
}
