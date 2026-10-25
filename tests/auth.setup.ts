// tests/auth.setup.ts

import { test as setup, expect } from "@playwright/test";
import path from "path";

const customerAuthFile = path.join(process.cwd(), ".auth/customer.json");
const adminAuthFile = path.join(process.cwd(), ".auth/admin.json");

setup("authenticate as customer", async ({ page }) => {
  await page.goto("/en/login");
  await page
    .locator('input[name="identifier"]')
    .fill(process.env.TEST_CUSTOMER_EMAIL!);
  await page
    .locator('input[name="password"]')
    .fill(process.env.TEST_CUSTOMER_PASSWORD!);
  await page.getByRole("button", { name: "Sign In" }).click();

  try {
    await page.waitForURL("**/en", { timeout: 15000 });
  } catch (error) {
    const errorText = await page
      .locator('[role="alert"], .text-red-500')
      .first()
      .textContent();
    console.error(
      "❌ Customer login failed. Error on screen:",
      errorText || "No error text found.",
    );
    throw error;
  }

  await page.context().storageState({ path: customerAuthFile });
});

setup("authenticate as admin", async ({ page }) => {
  await page.goto("/admin/login");
  await page.locator("#email").fill(process.env.TEST_ADMIN_EMAIL!);
  await page.locator("#password").fill(process.env.TEST_ADMIN_PASSWORD!);
  await page.getByRole("button", { name: "Sign in" }).click();

  try {
    await page.waitForURL("**/admin", { timeout: 15000 });
  } catch (error) {
    const errorText = await page
      .locator('[role="alert"], .text-destructive')
      .first()
      .textContent();
    console.error(
      "❌ Admin login failed. Error on screen:",
      errorText || "No error text found.",
    );
    throw error;
  }

  // ---------------------------------------------------------------
  // Warmup: pre-compile heavy admin routes so specs don't time out
  // on Turbopack's cold compile. Next.js 16.4's Turbopack compiles
  // admin pages on-demand; ProductForm in particular takes 15-20s
  // on first hit. Once compiled, subsequent navigations are instant.
  // ---------------------------------------------------------------
  setup.setTimeout(180_000); // give warmup plenty of time

  const warmupRoutes = [
    "/admin/products",
    "/admin/products/new",
    "/admin/pos",
    "/admin/orders",
    "/admin/settings",
    "/admin/categories",
    "/admin/brands",
    "/admin/brands/new",
    "/admin/colors",
    "/admin/colors/new",
  ];

  for (const route of warmupRoutes) {
    await page.goto(route, { waitUntil: "networkidle" });
    // Small delay so Turbopack can finish background compilation
    await page.waitForTimeout(200);
  }

  await page.context().storageState({ path: adminAuthFile });
});
