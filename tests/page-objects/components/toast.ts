// tests/page-objects/components/toast.ts

import { Page, expect } from "@playwright/test";

export class Toast {
  constructor(private page: Page) {}

  async expectSuccess(message: string) {
    // Sonner toasts render with data-sonner-toast.
    // We use .first() in case multiple toasts pop up quickly.
    const toastLocator = this.page
      .locator("[data-sonner-toast]")
      .filter({ hasText: message })
      .first();
    await expect(toastLocator).toBeVisible({ timeout: 5000 });
  }
}
