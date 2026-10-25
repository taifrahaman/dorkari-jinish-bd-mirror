// src/app/[locale]/cart/page.tsx

import CartPage from "@/components/cart";
import type { Locale } from "@/lib/shop/types";
import { getCachedStorefrontProducts } from "@/lib/storefront/products-cache";
import { getCachedStorefrontSettings } from "@/lib/storefront/products-cache";

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale: Locale = raw === "bn" ? "bn" : "en";

  const [allProducts, settings] = await Promise.all([
    getCachedStorefrontProducts(),
    getCachedStorefrontSettings(),
  ]);

  const recommended = allProducts.slice(0, 8);

  return (
    <CartPage
      locale={locale}
      recommendedProducts={recommended}
      delivery={settings.delivery}
    />
  );
}
