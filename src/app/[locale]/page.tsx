// src/app/[locale]/page.tsx

import type { Locale } from "@/i18n/routing";
import {
  getStorefrontCategoryTree,
  toCategoryNav,
} from "@/lib/storefront/category-nav";

import Hero from "@/components/hero/Hero";
import { ProductHero } from "@/components/home/product-hero";
import { DealsOfTheWeek } from "@/components/home/deals-of-the-week";
import CategoryRail from "@/components/home/category-rail/CategoryRail";
import {
  dummyKitchenProducts,
  dummyCoolingProducts,
  dummyDiscountProducts,
} from "@/components/home/category-rail/dummyCategoryRailData";
import CountdownBanner from "@/components/home/countdown/Countdownbanner";
import Testimonials from "@/components/home/testimonials/Testimonials";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale: Locale = raw === "bn" ? "bn" : "en";

  const tree = await getStorefrontCategoryTree();
  const categories = toCategoryNav(tree, locale);

  return (
    <main>
      <Hero categories={categories} />
      <ProductHero />
      <DealsOfTheWeek />

      {/* Kitchen Category Rail */}
      <CategoryRail
        locale={locale}
        palette="sage"
        title={{
          en: "Kitchen Essentials",
          bn: "কিচেন এসেনশিয়ালস",
        }}
        description={{
          en: "Everyday tools that make cooking faster and easier.",
          bn: "প্রতিদিনের রান্না দ্রুত ও সহজ করে তোলার সরঞ্জাম।",
        }}
        shopHref={`/${locale}/shop?category=kitchen`}
        products={dummyKitchenProducts}
      />

      {/* Cooling & Comfort Category Rail */}
      <CategoryRail
        locale={locale}
        palette="cream"
        title={{
          en: "Cooling & Comfort",
          bn: "কুলিং ও কমফোর্ট",
        }}
        description={{
          en: "Smart climate appliances to keep your home fresh and relaxed.",
          bn: "আপনার ঘরকে সতেজ এবং আরামদায়ক রাখতে স্মার্ট এয়ার অ্যাপ্লায়েন্স।",
        }}
        shopHref={`/${locale}/shop?category=cooling`}
        products={dummyCoolingProducts}
      />
      <CountdownBanner
        locale={locale}
        title={{ en: "Kitchen Week is on", bn: "কিচেন উইক চলছে" }}
        description={{
          en: "Up to 30% off cookware and small appliances.",
          bn: "কুকওয়্যার ও ছোট যন্ত্রপাতিতে ৩০% পর্যন্ত ছাড়।",
        }}
        ctaLabel={{ en: "Shop the sale", bn: "অফার দেখুন" }}
        ctaHref={`/${locale}/shop?sale=kitchen-week`}
        endsAt="2026-10-15T23:59:59+06:00"
      />
      <CategoryRail
        locale={locale}
        palette="neutral"
        title={{
          en: "Special Discounted Products",
          bn: "বিশেষ ডিসকাউন্টেড পণ্য",
        }}
        description={{
          en: "Grab your favorite home appliances at amazing promotional prices.",
          bn: "দারুণ সব প্রমোশনাল মূল্যে আপনার পছন্দের হোম অ্যাপ্লায়েন্স লুফে নিন।",
        }}
        shopHref={`/${locale}/shop?category=discounted-products`}
        products={dummyDiscountProducts}
      />

      <Testimonials locale={locale} />
    </main>
  );
}
