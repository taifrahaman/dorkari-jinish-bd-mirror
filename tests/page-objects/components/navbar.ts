// tests/page-objects/components/navbar.ts

import { Page, expect, Locator } from "@playwright/test";

export class Navbar {
  readonly desktopShopLink: Locator;
  readonly mobileMenuButton: Locator;
  readonly mobileTopCart: Locator;
  readonly mobileBottomCartLink: Locator;
  readonly searchButton: Locator;

  constructor(private page: Page) {
    this.desktopShopLink = page
      .getByRole("navigation", { name: "Primary" })
      .first()
      .getByRole("link", { name: "Shop All" });
    this.mobileMenuButton = page.getByRole("button", { name: "Open menu" });

    // The icon button that opens the drawer
    this.mobileTopCart = page.getByRole("button", { name: "Cart" }).first();

    // The bottom nav link that navigates to /cart
    this.mobileBottomCartLink = page.getByRole("link", { name: "Cart" }).last();

    this.searchButton = page.getByRole("button", { name: "Search" }).first();
  }
}
