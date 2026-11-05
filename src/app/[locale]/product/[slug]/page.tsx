// src/app/[locale]/product/[slug]/page.tsx

import type { Metadata } from "next";

import ProductPage from "@/components/product";
import {
  getCachedStorefrontFaqs,
  getCachedStorefrontProductBySlug,
} from "@/lib/storefront/products-cache";
import type { Locale } from "@/lib/shop/types";

type PageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

function resolveLocale(raw: string): Locale {
  return raw === "bn" ? "bn" : "en";
}

/**
 * JSON.stringify output is not safe inside an inline <script> tag —
 * a product name or FAQ answer containing "</script>" would break
 * out of the tag. Escaping "<" as "\u003c" is the standard mitigation
 * and keeps the JSON valid.
 */
function jsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

function fallbackDescription(name: string, locale: Locale): string {
  return locale === "bn"
    ? `${name} — বাংলাদেশে সেরা দামে কিনুন। সারা দেশে ডেলিভারি।`
    : `Buy ${name} in Bangladesh at the best price. Delivery nationwide.`;
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
    : fallbackDescription(title, locale);
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

  const product = await getCachedStorefrontProductBySlug(slug);

  if (!product) {
    return <ProductPage slug={slug} locale={locale} />;
  }

  const faqs = await getCachedStorefrontFaqs(product.id);

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://dorkarijinish.bd";
  const productUrl = `${siteUrl}/${locale}/product/${product.slug}`;

  // NOTE: this points at /shop?category=... which matches the visible
  // breadcrumb today. Patch 6 will switch both to /category/[slug].
  const categoryUrl = product.category.slug
    ? `${siteUrl}/${locale}/shop?category=${product.category.slug}`
    : `${siteUrl}/${locale}/shop`;

  const description =
    product.description?.[locale]?.trim() ||
    fallbackDescription(product.name[locale], locale);

  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name[locale],
    description,
    inLanguage: locale,
    url: productUrl,
    category: product.category.name[locale],
    ...(product.images.length > 0
      ? { image: product.images.map((img) => img.url) }
      : {}),
    ...(product.brand
      ? { brand: { "@type": "Brand", name: product.brand.name[locale] } }
      : {}),
    offers: {
      "@type": "Offer",
      url: productUrl,
      priceCurrency: "BDT",
      price: product.price,
      availability: product.inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
    },
    ...(product.averageRating > 0 && product.totalReviews > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: product.averageRating,
            reviewCount: product.totalReviews,
            bestRating: 5,
            worstRating: 1,
          },
        }
      : {}),
  };

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
        name: product.category.name[locale],
        item: categoryUrl,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: product.name[locale],
        item: productUrl,
      },
    ],
  };

  const faqSchema =
    faqs.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqs.map((faq) => ({
            "@type": "Question",
            name: faq.question[locale],
            acceptedAnswer: {
              "@type": "Answer",
              text: faq.answer[locale],
            },
          })),
        }
      : null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(productSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbSchema) }}
      />
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd(faqSchema) }}
        />
      )}
      <ProductPage slug={slug} locale={locale} />
    </>
  );
}
