// tests/fixtures/base-test.ts

/* eslint-disable react-hooks/rules-of-hooks */
// The `use` parameter below is Playwright's fixture teardown function,
// not React's `use()` hook. ESLint cannot tell the difference.

import { test as base } from "@playwright/test";
import { HomePage } from "../page-objects/storefront/home.page";
import { CheckoutPage } from "../page-objects/storefront/checkout.page";
import { SuccessPage } from "../page-objects/storefront/success.page";
import { Toast } from "../page-objects/components/toast";

type MyFixtures = {
  homePage: HomePage;
  checkoutPage: CheckoutPage;
  successPage: SuccessPage;
  toast: Toast;
};

export const test = base.extend<MyFixtures>({
  homePage: async ({ page }, use) => {
    await use(new HomePage(page));
  },
  checkoutPage: async ({ page }, use) => {
    await use(new CheckoutPage(page));
  },
  successPage: async ({ page }, use) => {
    await use(new SuccessPage(page));
  },
  toast: async ({ page }, use) => {
    await use(new Toast(page));
  },
});

export { expect } from "@playwright/test";
