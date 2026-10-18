// tests/storefront/guest/checkout-journey.spec.ts

import { test, expect } from "../../fixtures/base-test";

test.describe("Storefront Checkout Journey", () => {
  test("guest can browse, add to cart, and checkout", async ({
    page,
    checkoutPage,
    successPage,
    toast,
  }) => {
    // 1. Go to the shop page
    await page.goto("/en/shop");

    // 2. Find the first "Add to cart" button and click it.
    // We rely on the 5 products we seeded earlier into the database.
    const addToCartBtn = page
      .getByRole("button", { name: "Add to cart" })
      .first();

    // Wait for the shop page to load products
    await expect(addToCartBtn).toBeVisible({ timeout: 10000 });
    await addToCartBtn.click();

    // 3. Verify the toast appears
    await toast.expectSuccess("Added to cart");

    // 4. Navigate to the checkout page
    // (Zustand saves the cart to localStorage, so navigating directly works!)
    await checkoutPage.goto();

    // 5. Fill out the shipping form
    await checkoutPage.fillForm(
      "Test Customer",
      "01712345678",
      "123 Test Street, Dhanmondi, Dhaka",
    );

    // 6. Place the order!
    await checkoutPage.placeOrder();

    // 7. Verify we are redirected to the success page
    await page.waitForURL("**/checkout/success?orderId=*", { timeout: 15000 });
    await successPage.expectSuccess();
  });
});
