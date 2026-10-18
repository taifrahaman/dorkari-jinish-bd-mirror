// tests/api/auth-guards.spec.ts

import { test, expect } from "@playwright/test";

test.describe("API Auth Guards", () => {
  // We don't use the pre-logged-in storageState here because we want to test a GUEST.
  test("guest cannot access admin endpoints (401 Unauthorized)", async ({
    request,
  }) => {
    const res = await request.get("/api/admin/products");
    expect(res.status()).toBe(401);
  });

  test("guest cannot create a product (401 Unauthorized)", async ({
    request,
  }) => {
    const res = await request.post("/api/admin/products", {
      data: { name: { en: "Hacker Product", bn: "হ্যাকার" } },
    });
    expect(res.status()).toBe(401);
  });

  test("guest cannot access customer profile (401 Unauthorized)", async ({
    request,
  }) => {
    const res = await request.get("/api/auth/me");
    expect(res.status()).toBe(401);
  });

  test("public can fetch storefront products (200 OK)", async ({ request }) => {
    const res = await request.get("/api/storefront/products");
    expect(res.status()).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);

    // The storefront API might return the array directly in `data`
    // or nested in `data.items`. We handle both.
    const products = Array.isArray(json.data) ? json.data : json.data?.items;
    expect(Array.isArray(products)).toBe(true);
  });
});
