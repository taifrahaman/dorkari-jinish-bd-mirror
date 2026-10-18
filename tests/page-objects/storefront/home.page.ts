// tests/page-objects/storefront/home.page.ts

import { Page, expect, Locator } from "@playwright/test";

export class HomePage {
  readonly h1Heading: Locator;
  readonly collectionTabs: Locator;
  readonly categoryLinks: Locator;

  // Changed 'private page' to 'public page'
  constructor(public page: Page) {
    this.h1Heading = page.getByRole("heading", {
      level: 1,
      name: "Everything you need, one switch away",
    });
    this.collectionTabs = page
      .getByRole("group", { name: "Collections" })
      .getByRole("button");
    this.categoryLinks = page.locator('a[href*="/shop?category="]');
  }

  async goto() {
    await this.page.goto("/en");
  }

  async expectLoaded() {
    await expect(this.h1Heading).toBeVisible();
    await expect(this.collectionTabs.first()).toBeVisible();
  }
}
