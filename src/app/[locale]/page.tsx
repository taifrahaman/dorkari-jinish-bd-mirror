// src/app/[locale]/page.tsx

import Hero from "@/components/hero/Hero";
import { ProductHero } from "@/components/product-hero";
import { DealsOfTheWeek } from "@/components/home/deals-of-the-week";
import CategoryRail from "@/components/home/category-rail/CategoryRail";
import {
  dummyKitchenProducts,
  dummyCoolingProducts,
} from "@/components/home/category-rail/dummyCategoryRailData";

type Locale = "en" | "bn";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale: Locale = raw === "bn" ? "bn" : "en";

  return (
    <main>
      <Hero />
      <ProductHero />
      <DealsOfTheWeek />

      {/* Kitchen Category Rail */}
      <CategoryRail
        locale={locale}
        palette="cream"
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
        palette="slate"
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
    </main>
  );
}
