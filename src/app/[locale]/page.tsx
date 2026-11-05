// src/app/[locale]/page.tsx

import type { Metadata } from "next";
import type { Locale } from "@/i18n/routing";
import { getHomePageData } from "@/lib/storefront/home-page-data";

import HomeHeroBazaar from "@/components/home-hero-bazaar/HomeHeroBazaar";
import HomeSections from "@/components/home/HomeSections";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: raw } = await params;
  const locale: Locale = raw === "bn" ? "bn" : "en";
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://dorkarijinish.bd";

  const title =
    locale === "bn"
      ? "দরকারি জিনিশ — বাংলাদেশের অনলাইন শপ"
      : "Dorkari Jinish — Online Shopping in Bangladesh";
  const description =
    locale === "bn"
      ? "রান্নাঘর, আলো, উপহার, খেলনা ও আরও অনেক কিছু কিনুন সেরা দামে। সারা বাংলাদেশে ডেলিভারি।"
      : "Shop kitchen, lights, gifts, toys and more at the best prices. Delivery across Bangladesh.";

  return {
    title: { absolute: title },
    description,
    alternates: {
      canonical: `${siteUrl}/${locale}`,
      languages: {
        en: `${siteUrl}/en`,
        bn: `${siteUrl}/bn`,
        "x-default": `${siteUrl}/en`,
      },
    },
    openGraph: {
      title,
      description,
      url: `${siteUrl}/${locale}`,
      type: "website",
    },
  };
}

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
