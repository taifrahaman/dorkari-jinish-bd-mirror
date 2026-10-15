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
  const description = product.description?.[locale] ?? "";
  const image = product.images[0]?.url;

  return {
    title: `${title} | Dorkari Jinish BD`,
    description,
    openGraph: {
      title,
      description,
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
