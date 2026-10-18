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
    title: locale === "bn" ? "দোকান | সকল পণ্য" : "Shop all products",
    description:
      locale === "bn"
        ? "রান্নাঘর, আলো, উপহার, খেলনা ও আরও অনেক কিছু, সব এক জায়গায়।"
        : "Kitchen, lights, gifts, toys and more, all in one place.",
  };
}

export default async function ShopRoute({
  params,
  searchParams,
}: ShopRouteProps) {
  const { locale: raw } = await params;
  const locale: Locale = raw === "bn" ? "bn" : "en";
  const sp = await searchParams;

  const first = (key: string) => {
    const v = sp[key];
    return Array.isArray(v) ? v[0] : v;
  };

  const initialCategories = (first("category") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 6);
  const initialQuery = (first("q") ?? "").slice(0, 80);

  return (
    <main>
      {/* key: a real navigation (e.g. from a home tile) remounts with fresh state */}
      <ShopPage
        key={`${initialCategories.join(",")}|${initialQuery}`}
        locale={locale}
        initialCategories={initialCategories}
        initialQuery={initialQuery}
      />
    </main>
  );
}
