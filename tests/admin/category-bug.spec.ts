// tests/admin/category-bug.spec.ts

import { test, expect } from "../fixtures/base-test";

test.describe("Admin Category Bug Reproduction", () => {
  test("updating a category with a server error shows readable text, not [object Object]", async ({
    page,
    request,
  }) => {
    // 1. Fetch a real category ID from the API so we can go directly to the edit page
    const res = await request.get("/api/admin/categories/tree");
    const data = await res.json();
    const firstCategoryId = data.data?.[0]?._id || data[0]?._id;

    if (!firstCategoryId) {
      test.skip(true, "No categories found to test.");
      return;
    }

    // 2. Intercept the PATCH request to force a fake server error
    await page.route("**/api/admin/categories/*", async (route) => {
      if (route.request().method() === "PATCH") {
        await route.fulfill({
          status: 400,
          contentType: "application/json",
          body: JSON.stringify({
            success: false,
            message: {
              error: "This is a complex object error from the server",
            },
          }),
        });
      } else {
        await route.continue();
      }
    });

    // 3. Go directly to the edit page
    await page.goto(`/admin/categories/${firstCategoryId}/edit`);

    // 4. Wait for the form to load
    const nameEnInput = page.locator('input[name="name.en"]');
    await expect(nameEnInput).toBeVisible({ timeout: 15000 });

    // 5. Change the name to make the form dirty
    await nameEnInput.fill("Updated Name To Trigger Save");

    // 6. Click Save
    await page.getByRole("button", { name: "Save changes" }).click();

    // 7. Verify the toast appears
    const toast = page.locator("[data-sonner-toast]").first();
    await expect(toast).toBeVisible();

    // 8. Check the text
    const toastText = await toast.innerText();
    console.log("✅ Toast Output:", toastText);

    // THIS IS THE ONLY THING THAT MATTERS: It must not be [object Object]
    expect(toastText).not.toContain("[object Object]");

    // It should just be a normal, readable string
    expect(toastText.length).toBeGreaterThan(3);
  });
});
