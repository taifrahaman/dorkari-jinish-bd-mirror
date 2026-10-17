// src/app/[locale]/cart/page.tsx

import CartPage from "@/components/cart";
import type { Locale } from "@/lib/shop/types";
import { getCachedStorefrontProducts } from "@/lib/storefront/products-cache";

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale: Locale = raw === "bn" ? "bn" : "en";

  // Fetch real products for the "You may also like" section
  const allProducts = await getCachedStorefrontProducts();

  // Take the top 8 products to pass to the cart recommendation grid
  const recommended = allProducts.slice(0, 8);

  return <CartPage locale={locale} recommendedProducts={recommended} />;
}
