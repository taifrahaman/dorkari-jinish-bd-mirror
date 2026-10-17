// src/app/[locale]/checkout/page.tsx

import CheckoutPage from "@/components/checkout";
import type { Locale } from "@/lib/shop/types";

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale: Locale = raw === "bn" ? "bn" : "en";

  return <CheckoutPage locale={locale} />;
}
