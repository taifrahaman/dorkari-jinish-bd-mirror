// src/components/home/HomeSections.tsx
// Everything on the home page BELOW the hero. The hero is passed in by the
// page, so the live page and a review page can use different heroes with the
// exact same body.

import type { Locale } from "@/i18n/routing";
import type { HomePageData } from "@/lib/storefront/home-page-data";
import CountdownBanner from "@/components/home/countdown/Countdownbanner";
import Testimonials from "@/components/home/testimonials/Testimonials";

import AnnouncementTicker from "./bazaar/AnnouncementTicker";
import ShopfrontLane from "./bazaar/ShopfrontLane";
import HotDeals from "./bazaar/HotDeals";
import StallBand from "./bazaar/StallBand";
import PromoRow from "./bazaar/PromoRow";
import TrustStrip from "./bazaar/TrustStrip";

/** The homepage shows at most this many "Top in <category>" stalls. */
const MAX_CATEGORY_STALLS = 3;

/** palette index per category stall: peacock, tomato, leaf, then repeat */
const CATEGORY_SWATCHES = [4, 0, 2];

type Props = { locale: Locale; data: HomePageData };

export default function HomeSections({ locale, data }: Props) {
  const { categories, heroCollections, topDeals, rails, dealsEndAt } = data;

  return (
    <>
      <AnnouncementTicker locale={locale} />

      <ShopfrontLane categories={categories} locale={locale} />

      <HotDeals deals={topDeals} locale={locale} />

      {rails.trending && (
        <StallBand
          rail={rails.trending}
          locale={locale}
          swatch={1}
          sign={{ en: "Where the crowd is", bn: "ভিড় এখানেই" }}
        />
      )}

      <PromoRow collections={heroCollections} locale={locale} />

      {rails.newArrivals && (
        <StallBand
          rail={rails.newArrivals}
          locale={locale}
          swatch={2}
          sign={{ en: "Just landed", bn: "এইমাত্র এসেছে" }}
        />
      )}

      <CountdownBanner
        locale={locale}
        title={{
          en: "Hurry! Deals end soon",
          bn: "তাড়াহুড়ো করুন! অফার শেষ হচ্ছে",
        }}
        description={{
          en: "Grab the best discounts before the timer runs out.",
          bn: "টাইমার শেষ হওয়ার আগেই সেরা ছাড় লুফে নিন।",
        }}
        ctaLabel={{ en: "Shop all deals", bn: "সব অফার দেখুন" }}
        ctaHref={`/${locale}/shop`}
        endsAt={dealsEndAt}
      />

      {rails.discounted && (
        <StallBand
          rail={rails.discounted}
          locale={locale}
          swatch={3}
          sign={{ en: "Prices just dropped", bn: "দাম কমেছে" }}
        />
      )}

      {rails.topCategories.slice(0, MAX_CATEGORY_STALLS).map((rail, i) => (
        <StallBand
          key={rail.id}
          rail={rail}
          locale={locale}
          swatch={CATEGORY_SWATCHES[i % CATEGORY_SWATCHES.length]}
          sign={{ en: "Best in this lane", bn: "এই গলির সেরা" }}
        />
      ))}

      <Testimonials locale={locale} />

      <TrustStrip locale={locale} />
    </>
  );
}
