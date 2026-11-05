// src/app/[locale]/product/[slug]/page.tsx

import type { Metadata } from "next";

import ProductPage from "@/components/product";
import { getCachedStorefrontProductBySlug } from "@/lib/storefront/products-cache";
import type { Locale } from "@/lib/shop/types";

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

  const product = await getCachedStorefrontProductBySlug(slug);

  if (!product) {
    return {
      title: locale === "bn" ? "পণ্য পাওয়া যায়নি" : "Product not found",
    };
  }

  const title = product.name[locale];
  const rawDescription = product.description?.[locale] ?? "";
  const description = rawDescription.trim()
    ? rawDescription.slice(0, 155)
    : locale === "bn"
      ? `${title} — বাংলাদেশে সেরা দামে কিনুন। সারা দেশে ডেলিভারি।`
      : `Buy ${title} in Bangladesh at the best price. Delivery nationwide.`;
  const image = product.images[0]?.url;

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://dorkarijinish.bd";
  const path = `/product/${slug}`;

  return {
    title,
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
      images: image
        ? [{ url: image, width: 900, height: 900, alt: title }]
        : undefined,
    },
  };
}

export default async function Page({ params }: PageProps) {
  const { locale: rawLocale, slug } = await params;
  const locale = resolveLocale(rawLocale);

  return <ProductPage slug={slug} locale={locale} />;
}
