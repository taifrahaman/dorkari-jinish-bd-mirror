// src/app/[locale]/shop/page.tsx

import type { Metadata } from "next";

import ShopPage from "@/components/shop";

type Locale = "en" | "bn";

type ShopRouteProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({
  params,
}: Pick<ShopRouteProps, "params">): Promise<Metadata> {
  const { locale: raw } = await params;
  const locale: Locale = raw === "bn" ? "bn" : "en";

  return {
    title: locale === "bn" ? "সকল পণ্য" : "Shop All Appliances",
    description:
      locale === "bn"
        ? "আপনার বাড়ির জন্য সেরা যন্ত্রপাতি খুঁজে নিন।"
        : "Everything for your home, in one place.",
  };
}

export default async function ShopRoute({
  params,
  searchParams,
}: ShopRouteProps) {
  const { locale: raw } = await params;
  const locale: Locale = raw === "bn" ? "bn" : "en";

  // Read (but don't yet use) search params so the route opts into dynamic
  // rendering correctly. Wire these into ShopPage when you're ready to
  // hydrate filters from the URL (e.g. ?category=kitchen&sale=kitchen-week).
  await searchParams;

  return (
    <main>
      <ShopPage locale={locale} />
    </main>
  );
}
