// src/app/[locale]/deals/page.tsx

import type { Metadata } from "next";
import DealsPage from "@/components/deals/DealsPage";

type Locale = "en" | "bn";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({
  params,
}: Pick<Props, "params">): Promise<Metadata> {
  const { locale: raw } = await params;
  const locale: Locale = raw === "bn" ? "bn" : "en";

  return {
    title:
      locale === "bn"
        ? "সেরা ডিল | দরকারি জিনিশ"
        : "Hot Deals | Dorkari Jinish",
    description:
      locale === "bn"
        ? "সর্বোচ্চ ছাড়ের পণ্যগুলো কিনুন।"
        : "Shop the best discounts and offers.",
  };
}

export default async function DealsRoute({ params, searchParams }: Props) {
  const { locale: raw } = await params;
  const locale: Locale = raw === "bn" ? "bn" : "en";
  const sp = await searchParams;

  const first = (key: string) => {
    const v = sp[key];
    return Array.isArray(v) ? v[0] : v;
  };

  const initialCategory =
    (first("category") ?? "").split(",")[0]?.trim() || null;
  const initialQuery = (first("q") ?? "").slice(0, 80);

  return (
    <main>
      {/* key: a real navigation (e.g. from a home tile) remounts with fresh state */}
      <DealsPage
        key={`${initialCategory ?? ""}|${initialQuery}`}
        locale={locale}
        initialCategory={initialCategory}
        initialQuery={initialQuery}
      />
    </main>
  );
}
