import { Page, expect, Locator } from "@playwright/test";

export class SettingsPage {
  readonly storeNameInput: Locator;
  readonly saveButton: Locator;

  constructor(private page: Page) {
    this.storeNameInput = page.locator('input[name="store.name"]');
    this.saveButton = page.getByRole("button", { name: "Save changes" });
  }

  async goto() {
    await this.page.goto("/admin/settings");
    // Wait for the form to hydrate from the API
    await expect(this.storeNameInput).toBeVisible({ timeout: 15000 });
  }

  async updateStoreName(newName: string) {
    await this.storeNameInput.fill(newName);
  }

  async save() {
    await expect(this.saveButton).toBeEnabled();
    await this.saveButton.click();
  }
}
