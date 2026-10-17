// src/app/[locale]/page.tsx

import type { Locale } from "@/i18n/routing";
import {
  getStorefrontCategoryTree,
  toCategoryNav,
} from "@/lib/storefront/category-nav";
import { getCachedStorefrontProducts } from "@/lib/storefront/products-cache";
import { buildHomeRails } from "@/lib/storefront/home-rails";
import type { DealProduct } from "@/components/home/deals-of-the-week/dealsOfTheWeek.types";

import HomeHero from "@/components/home-hero/HomeHero";
import { DealsOfTheWeek } from "@/components/home/deals-of-the-week";
import CategoryRail from "@/components/home/category-rail/CategoryRail";
import CountdownBanner from "@/components/home/countdown/Countdownbanner";
import Testimonials from "@/components/home/testimonials/Testimonials";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale: Locale = raw === "bn" ? "bn" : "en";

  const [tree, products] = await Promise.all([
    getStorefrontCategoryTree(),
    getCachedStorefrontProducts(),
  ]);

  const categories = toCategoryNav(tree, locale);

  // --- 1. Calculate the Top 2 Weekly Deals (SMART ALGORITHM) ---
  const topDeals: DealProduct[] = products
    .filter(
      (p) =>
        p.price >= 1000 && // Ensure it's a substantial product (1000+ BDT)
        p.compareAtPrice &&
        p.compareAtPrice > p.price &&
        p.inStock, // Must be in stock
    )
    .sort((a, b) => {
      const savingsA = a.compareAtPrice! - a.price;
      const savingsB = b.compareAtPrice! - b.price;

      // Primary sort: Highest absolute money saved (e.g., 15,000 BDT off > 45 BDT off)
      if (savingsA !== savingsB) return savingsB - savingsA;

      // Secondary sort: Highest percentage discount
      const discA = savingsA / a.compareAtPrice!;
      const discB = savingsB / b.compareAtPrice!;
      return discB - discA;
    })
    .slice(0, 2)
    .map((p) => {
      // Build details: Show Brand (if exists) and Category
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
        // Uses placeholder if no image exists
        image: p.images[0]?.url ?? "/placeholder-product.svg",
        details,
      };
    });

  // --- 2. Build Rails (Excluding the Top Deals) ---
  // We pass topDeals IDs so they don't appear again in the rails below
  const excludeIds = topDeals.map((d) => d.id);
  const rails = buildHomeRails(tree, products, locale, excludeIds);

  // --- 3. Countdown Date ---
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  nextWeek.setHours(23, 59, 59, 999);

  return (
    <main>
      <HomeHero categories={categories} />

      {rails.trending && (
        <CategoryRail
          locale={locale}
          palette={rails.trending.palette}
          title={rails.trending.title}
          shopHref={rails.trending.shopHref}
          products={rails.trending.products}
        />
      )}

      <DealsOfTheWeek locale={locale} deals={topDeals} />

      {rails.newArrivals && (
        <CategoryRail
          locale={locale}
          palette={rails.newArrivals.palette}
          title={rails.newArrivals.title}
          shopHref={rails.newArrivals.shopHref}
          products={rails.newArrivals.products}
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
        endsAt={nextWeek.toISOString()}
      />

      {rails.discounted && (
        <CategoryRail
          locale={locale}
          palette={rails.discounted.palette}
          title={rails.discounted.title}
          shopHref={rails.discounted.shopHref}
          products={rails.discounted.products}
        />
      )}

      {/* Render ALL the top categories here */}
      {rails.topCategories.map((rail) => (
        <CategoryRail
          key={rail.id}
          locale={locale}
          palette={rail.palette}
          title={rail.title}
          shopHref={rail.shopHref}
          products={rail.products}
        />
      ))}

      <Testimonials locale={locale} />
    </main>
  );
}
