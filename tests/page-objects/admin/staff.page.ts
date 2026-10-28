// tests/page-objects/admin/staff.page.ts

import { Page, expect, Locator } from "@playwright/test";

export class StaffPage {
  readonly addModeratorBtn: Locator;
  readonly nameInput: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly canCreateSwitch: Locator;
  readonly submitBtn: Locator;
  readonly copyCredsBtn: Locator;

  constructor(private page: Page) {
    this.addModeratorBtn = page.getByRole("button", { name: "Add Moderator" });
    this.nameInput = page.getByLabel("Full Name");
    this.emailInput = page.getByLabel("Email Address");
    this.passwordInput = page.getByLabel("Temporary Password");
    this.canCreateSwitch = page.getByRole("switch", {
      name: "Product Creation",
    });
    this.submitBtn = page.getByRole("button", { name: "Create Account" });
    this.copyCredsBtn = page.getByRole("button", { name: "Copy Credentials" });
  }

  async goto() {
    await this.page.goto("/admin/staff");
  }

  async createModerator(
    name: string,
    email: string,
    canCreateProduct: boolean,
  ) {
    await this.addModeratorBtn.click();
    await expect(this.nameInput).toBeVisible();

    await this.nameInput.fill(name);
    await this.emailInput.fill(email);

    // Type a known password instead of clicking the magic wand
    const password = "TestPassword123!";
    await this.passwordInput.fill(password);

    if (canCreateProduct) {
      await this.canCreateSwitch.click();
    }

    await this.submitBtn.click();
    await expect(this.copyCredsBtn).toBeVisible();

    return { email, password };
  }

  async closeDialog() {
    // exact: true ignores the "Close toast" button.
    // .last() grabs the text "Close" button instead of the "X" icon in the header.
    await this.page
      .getByRole("button", { name: "Close", exact: true })
      .last()
      .click();
  }

  getStaffRow(email: string): Locator {
    return this.page.getByRole("row").filter({ hasText: email });
  }

  async switchToDeactivatedTab() {
    await this.page
      .getByRole("button", { name: /Deactivated \(\d+\)/ })
      .click();
  }

  async deactivateAndDelete(email: string) {
    const activeRow = this.getStaffRow(email);
    this.page.once("dialog", (d) => d.accept());
    await activeRow.getByRole("button", { name: "Deactivate" }).click();
    await expect(activeRow).toBeHidden();

    await this.switchToDeactivatedTab();
    const deactivatedRow = this.getStaffRow(email);
    await expect(deactivatedRow).toBeVisible();

    this.page.once("dialog", (d) => d.accept());
    await deactivatedRow
      .getByRole("button", { name: "Delete Forever" })
      .click();
    await expect(deactivatedRow).toBeHidden();
  }
}
