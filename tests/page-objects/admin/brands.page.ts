import { Page, Locator } from "@playwright/test";

export class BrandsPage {
  readonly nameEnInput: Locator;
  readonly nameBnInput: Locator;
  readonly submitButton: Locator;

  constructor(private page: Page) {
    this.nameEnInput = page.locator('input[name="name.en"]');
    this.nameBnInput = page.locator('input[name="name.bn"]');
    this.submitButton = page.getByRole("button", { name: "Create brand" });
  }

  async gotoNew() {
    await this.page.goto("/admin/brands/new");
  }

  async fillAndCreate(nameEn: string, nameBn: string) {
    await this.nameEnInput.fill(nameEn);
    await this.nameBnInput.fill(nameBn);
    await this.submitButton.click();
  }
}
