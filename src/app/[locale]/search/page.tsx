// src/app/[locale]/search/page.tsx

import type { Metadata } from "next";
import { searchStorefrontProducts } from "@/services/product.service";
import { toShopProducts } from "@/lib/shop/adapter";
import ProductGrid from "@/components/shop/ProductGrid";
import type { Locale } from "@/lib/shop/types";
import Link from "next/link";
import { Search, ArrowRight } from "lucide-react";

type PageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string }>;
};

export async function generateMetadata({
  searchParams,
}: PageProps): Promise<Metadata> {
  const { q } = await searchParams;
  return { title: q ? `Search: ${q}` : "Search" };
}

export default async function SearchPage({ params, searchParams }: PageProps) {
  const { locale: raw } = await params;
  const { q = "" } = await searchParams;
  const locale: Locale = raw === "bn" ? "bn" : "en";

  const results = await searchStorefrontProducts(q, 50);
  const shopProducts = toShopProducts(results, locale);

  return (
    <div className="mx-auto max-w-[1400px] px-4 pb-20 pt-[calc(var(--shop-nav)+1rem)] [--shop-nav:4.5rem] sm:px-6 lg:px-8 lg:[--shop-nav:5.75rem]">
      {/* Header Section with "See All Products" button */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-brand-text sm:text-3xl">
            {locale === "bn" ? "সার্চ ফলাফল" : "Search Results"}
          </h1>
          <p className="mt-2 text-brand-text-secondary">
            {q ? (
              <>
                {locale === "bn"
                  ? `"${q}" এর জন্য ${results.length}টি পণ্য পাওয়া গেছে`
                  : `Found ${results.length} products for "${q}"`}
              </>
            ) : locale === "bn" ? (
              "অনুগ্রহ করে কিছু লিখে সার্চ করুন।"
            ) : (
              "Please enter a search term."
            )}
          </p>
        </div>

        {/* See All Products Button */}
        <Link
          href={`/${locale}/shop`}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full border border-brand-border bg-brand-surface px-5 py-2.5 text-sm font-semibold text-brand-text transition-colors hover:border-brand-primary hover:bg-brand-primary hover:text-white"
        >
          {locale === "bn" ? "সব পণ্য দেখুন" : "See All Products"}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {q && results.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-4 grid h-20 w-20 place-items-center rounded-full bg-brand-navbar text-brand-text-secondary">
            <Search className="h-8 w-8" />
          </div>
          <h2 className="text-lg font-semibold text-brand-text">
            {locale === "bn" ? "কোনো পণ্য পাওয়া যায়নি" : "No products found"}
          </h2>
          <p className="mt-1 text-sm text-brand-text-secondary">
            {locale === "bn"
              ? "অন্য কিছু দিয়ে সার্চ করার চেষ্টা করুন।"
              : "Try searching with different keywords."}
          </p>
          <Link
            href={`/${locale}/shop`}
            className="mt-6 rounded-full bg-brand-primary px-6 py-2.5 text-sm font-semibold text-white"
          >
            {locale === "bn" ? "সব পণ্য দেখুন" : "Browse all products"}
          </Link>
        </div>
      ) : (
        <ProductGrid products={shopProducts} locale={locale} />
      )}
    </div>
  );
}
