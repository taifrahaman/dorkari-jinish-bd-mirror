// src/lib/storefront/home-page-data.ts
// Everything the home page needs, in one place, so the live page and any
// review/preview page (e.g. one with a second hero) load identical data.

import type { Locale } from "@/i18n/routing";
import {
  getStorefrontCategoryTree,
  toCategoryNav,
} from "@/lib/storefront/category-nav";
import { getCachedStorefrontProducts } from "@/lib/storefront/products-cache";
import { buildHomeRails } from "@/lib/storefront/home-rails";
import { buildHeroCollections } from "@/lib/storefront/hero-collections";
import type { DealProduct } from "@/components/home/deals-of-the-week/dealsOfTheWeek.types";

/** Bangladesh is UTC+6 all year. */
const DHAKA_OFFSET_MS = 6 * 60 * 60 * 1000;

/** End of the coming Friday (23:59:59 Dhaka time). The weekly deal timer runs to here. */
function endOfWeeklyDeals(now = new Date()): Date {
  const dhaka = new Date(now.getTime() + DHAKA_OFFSET_MS);
  const daysToFriday = (5 - dhaka.getUTCDay() + 7) % 7;
  const endDhaka = Date.UTC(
    dhaka.getUTCFullYear(),
    dhaka.getUTCMonth(),
    dhaka.getUTCDate() + daysToFriday,
    23,
    59,
    59,
    999,
  );
  return new Date(endDhaka - DHAKA_OFFSET_MS);
}

export async function getHomePageData(locale: Locale) {
  const [tree, products] = await Promise.all([
    getStorefrontCategoryTree(),
    getCachedStorefrontProducts(),
  ]);

  const categories = toCategoryNav(tree, locale);
  const heroCollections = buildHeroCollections(tree, products, locale);

  // Top 2 weekly deals: biggest taka saving first, then biggest percentage.
  const topDeals: DealProduct[] = products
    .filter(
      (p) =>
        p.price >= 1000 &&
        p.compareAtPrice &&
        p.compareAtPrice > p.price &&
        p.inStock,
    )
    .sort((a, b) => {
      const savingsA = a.compareAtPrice! - a.price;
      const savingsB = b.compareAtPrice! - b.price;
      if (savingsA !== savingsB) return savingsB - savingsA;
      return savingsB / b.compareAtPrice! - savingsA / a.compareAtPrice!;
    })
    .slice(0, 2)
    .map((p) => {
      const details = [];
      if (p.brand) {
        details.push({
          label: { en: "Brand", bn: "ব্র্যান্ড" },
          value: {
            en: p.brand.name.en,
            bn: p.brand.name.bn ?? p.brand.name.en,
          },
        });
      }
      details.push({
        label: { en: "Category", bn: "ক্যাটাগরি" },
        value: {
          en: p.category.name.en,
          bn: p.category.name.bn ?? p.category.name.en,
        },
      });

      return {
        id: p.id,
        slug: p.slug,
        name: p.name,
        category: p.category.name,
        description: p.description ?? {
          en: "Incredible value deal.",
          bn: "অবিশ্বাস্য মূল্যের অফার।",
        },
        price: p.price,
        originalPrice: p.compareAtPrice!,
        image: p.images[0]?.url ?? "/placeholder-product.svg",
        details,
      };
    });

  // Rails never repeat a product that is already shown as a top deal.
  const rails = buildHomeRails(
    tree,
    products,
    locale,
    topDeals.map((d) => d.id),
  );

  return {
    categories,
    heroCollections,
    topDeals,
    rails,
    dealsEndAt: endOfWeeklyDeals().toISOString(),
  };
}

export type HomePageData = Awaited<ReturnType<typeof getHomePageData>>;
