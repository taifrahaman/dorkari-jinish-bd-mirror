// src/app/[locale]/page.tsx
// Live homepage. Uses the new "bazaar" hero + bazaar section body.
// The old review route (src/app/[locale]/hero-review/) has been removed —
// its content now lives here.

import type { Locale } from "@/i18n/routing";
import { getHomePageData } from "@/lib/storefront/home-page-data";

import HomeHeroBazaar from "@/components/home-hero-bazaar/HomeHeroBazaar";
import HomeSections from "@/components/home/HomeSections";

export default async function HomePage({
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
