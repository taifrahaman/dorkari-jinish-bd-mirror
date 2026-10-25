// src/app/[locale]/checkout/page.tsx

import CheckoutPage from "@/components/checkout";
import type { Locale } from "@/lib/shop/types";
import { getCachedStorefrontSettings } from "@/lib/storefront/products-cache";

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale: Locale = raw === "bn" ? "bn" : "en";

  const settings = await getCachedStorefrontSettings();

  return <CheckoutPage locale={locale} delivery={settings.delivery} />;
}
