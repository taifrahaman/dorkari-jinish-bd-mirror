// src/app/[locale]/hero-review/page.tsx
// Review page: the new "bazaar" hero on top of the same page body as the
// live home page. The live page (/[locale]) keeps the current hero.
// Delete this folder once the hero is approved and swapped into page.tsx.

import type { Metadata } from "next";
import type { Locale } from "@/i18n/routing";
import { getHomePageData } from "@/lib/storefront/home-page-data";

import HomeHeroBazaar from "@/components/home-hero-bazaar/HomeHeroBazaar";
import HomeSections from "@/components/home/HomeSections";

export const metadata: Metadata = {
  title: "Hero review",
  robots: { index: false, follow: false },
};

export default async function HeroReviewPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale: Locale = raw === "bn" ? "bn" : "en";

  const data = await getHomePageData(locale);

  return (
    <main>
      <HomeHeroBazaar
        categories={data.categories}
        collections={data.heroCollections}
      />
      <HomeSections locale={locale} data={data} />
    </main>
  );
}
