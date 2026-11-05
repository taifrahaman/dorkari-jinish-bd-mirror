// src/app/[locale]/category/[slug]/page.tsx

import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getCachedProductsByCategorySlug } from "@/lib/storefront/products-cache";
import { toShopProducts } from "@/lib/shop/adapter";
import type { Locale } from "@/lib/shop/types";

import Breadcrumb from "@/components/product/Breadcrumb";
import ProductGrid from "@/components/shop/ProductGrid";

type PageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

function resolveLocale(raw: string): Locale {
  return raw === "bn" ? "bn" : "en";
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale: rawLocale, slug } = await params;
  const locale = resolveLocale(rawLocale);
  const { category } = await getCachedProductsByCategorySlug(slug);

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://dorkarijinish.bd";

  if (!category) {
    return {
      title: locale === "bn" ? "ক্যাটাগরি পাওয়া যায়নি" : "Category not found",
    };
  }

  const name = category.name[locale];
  const title =
    locale === "bn"
      ? `${name} — দাম ও ব্র্যান্ড | দরকারি জিনিশ`
      : `${name} — Prices & Brands in Bangladesh | Dorkari Jinish`;
  const description =
    locale === "bn"
      ? `${name} কিনুন সেরা দামে। সারা বাংলাদেশে দ্রুত ডেলিভারি।`
      : `Shop ${name} at the best prices in Bangladesh. Fast nationwide delivery.`;
  const path = `/category/${slug}`;

  return {
    title: { absolute: title }, // Prevent double-branding
    description,
    alternates: {
      canonical: `${siteUrl}/${locale}${path}`,
      languages: {
        en: `${siteUrl}/en${path}`,
        bn: `${siteUrl}/bn${path}`,
        "x-default": `${siteUrl}/en${path}`,
      },
    },
    openGraph: {
      title,
      description,
      url: `${siteUrl}/${locale}${path}`,
      type: "website",
    },
  };
}

export default async function CategoryPage({ params }: PageProps) {
  const { locale: rawLocale, slug } = await params;
  const locale = resolveLocale(rawLocale);
  const { category, products } = await getCachedProductsByCategorySlug(slug);

  if (!category) notFound();

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://dorkarijinish.bd";
  const categoryUrl = `${siteUrl}/${locale}/category/${slug}`;
  const name = category.name[locale];
  const shopProducts = toShopProducts(products, locale);

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: locale === "bn" ? "হোম" : "Home",
        item: `${siteUrl}/${locale}`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name,
        item: categoryUrl,
      },
    ],
  };

  // This intro copy is what ranks for head terms like "rice cooker".
  const introCopy =
    locale === "bn"
      ? `${name} বাংলাদেশে কিনুন সেরা দামে। আমাদের সংগ্রহে রয়েছে শীর্ষ ব্র্যান্ডের ${name}, প্রতিযোগিতামূলক দামে এবং সারা দেশে দ্রুত ডেলিভারি সহ। প্রতিটি পণ্য যাচাই করা এবং অথেনটিক। ক্যাশ অন ডেলিভারি উপলব্ধ।`
      : `Shop ${name} in Bangladesh at the best prices. Our collection features top brands of ${name}, all authentic and verified, with fast nationwide delivery. Cash on delivery is available on every order.`;

  return (
    <main className="mx-auto max-w-[1400px] px-4 pb-16 pt-[calc(var(--shop-nav)+1rem)] [--shop-nav:4.5rem] sm:px-6 lg:px-8 lg:[--shop-nav:5.75rem]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <Breadcrumb
        locale={locale}
        items={[
          { label: locale === "bn" ? "হোম" : "Home", href: `/${locale}` },
          { label: name },
        ]}
      />

      <header className="mb-8 max-w-3xl">
        <h1 className="font-heading text-3xl font-bold text-brand-text sm:text-4xl lg:text-5xl">
          {locale === "bn" ? `${name} — বাংলাদেশে` : `${name} in Bangladesh`}
        </h1>
        <p className="mt-4 text-base leading-relaxed text-brand-text-secondary">
          {introCopy}
        </p>
      </header>

      <ProductGrid products={shopProducts} locale={locale} />
    </main>
  );
}
