// src/app/[locale]/product/[slug]/page.tsx

import type { Metadata } from "next";

import ProductPage from "@/components/product";
import { fetchProductDetail } from "@/lib/product/mock-api";
import type { Locale } from "@/lib/shop/types";

type PageProps = {
  params: { slug: string };
  searchParams?: { lang?: string };
};

function resolveLocale(searchParams?: { lang?: string }): Locale {
  return searchParams?.lang === "bn" ? "bn" : "en";
}

export async function generateMetadata({
  params,
  searchParams,
}: PageProps): Promise<Metadata> {
  const locale = resolveLocale(searchParams);
  const product = await fetchProductDetail(params.slug);

  if (!product) {
    return {
      title: locale === "bn" ? "পণ্য পাওয়া যায়নি" : "Product not found",
    };
  }

  const title = product.name[locale];
  const description = product.description[locale];
  const image = product.variants[0]?.images[0]?.src;

  return {
    title: `${title} | Shop All Appliances`,
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

export default function Page({ params, searchParams }: PageProps) {
  const locale = resolveLocale(searchParams);
  return <ProductPage slug={params.slug} locale={locale} />;
}
