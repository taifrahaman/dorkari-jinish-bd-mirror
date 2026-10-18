import { Page, Locator } from "@playwright/test";

export class ColorsPage {
  readonly nameEnInput: Locator;
  readonly nameBnInput: Locator;
  readonly hexInput: Locator;
  readonly submitButton: Locator;

  constructor(private page: Page) {
    this.nameEnInput = page.locator('input[name="name.en"]');
    this.nameBnInput = page.locator('input[name="name.bn"]');
    this.hexInput = page.locator('input[name="hex"]');
    this.submitButton = page.getByRole("button", { name: "Create color" });
  }

  async gotoNew() {
    await this.page.goto("/admin/colors/new");
  }

  async fillAndCreate(nameEn: string, nameBn: string, hex: string) {
    await this.nameEnInput.fill(nameEn);
    await this.nameBnInput.fill(nameBn);
    await this.hexInput.fill(hex);
    await this.submitButton.click();
  }
}
