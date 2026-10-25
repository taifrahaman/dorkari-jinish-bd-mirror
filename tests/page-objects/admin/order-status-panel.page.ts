// tests/page-objects/admin/order-status-panel.page.ts

import { Page, expect, Locator } from "@playwright/test";

/**
 * The status-update card inside /admin/orders/[id].
 * The dropdown is the first combobox on the page.
 */
export class OrderStatusPanelPage {
  readonly statusTrigger: Locator;
  readonly saveButton: Locator;
  readonly terminalNote: Locator;

  constructor(private page: Page) {
    this.statusTrigger = page.locator('button[role="combobox"]').first();
    this.saveButton = page.getByRole("button", { name: "Save changes" });
    this.terminalNote = page.getByText(/This status is final/i);
  }

  /** Read the visible option labels without committing a change. */
  async visibleStatusOptions(): Promise<string[]> {
    await this.statusTrigger.click();
    const options = this.page.getByRole("option");
    const count = await options.count();
    const labels: string[] = [];
    for (let i = 0; i < count; i++) {
      const text = await options.nth(i).textContent();
      if (text) labels.push(text.trim());
    }
    // Close dropdown without selecting anything.
    await this.page.keyboard.press("Escape");
    return labels;
  }
}
