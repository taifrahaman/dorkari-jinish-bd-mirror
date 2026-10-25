// src/components/product/index.tsx

"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { useProductDetail } from "@/hooks/use-product-detail";
import { toShopProducts } from "@/lib/shop/adapter";
import type { Locale } from "@/lib/shop/types";
import { useCartStore } from "@/lib/stores/useCartStore";
import { makeCartKey } from "@/lib/cart/cart-key";

import Breadcrumb from "./Breadcrumb";
import ProductGallery from "./ProductGallery";
import ProductInfo from "./ProductInfo";
import ProductFaq from "./ProductFaq";
import ProductReviews from "./ProductReviews";
import StickyBuyBar from "./StickyBuyBar";
import ProductDetailSkeleton from "./ProductDetailSkeleton";
import ShopProductGrid from "@/components/shop/ProductGrid";

type ProductPageProps = {
  slug: string;
  locale?: Locale;
};

export default function ProductPage({ slug, locale = "en" }: ProductPageProps) {
  const { product, faqs, reviews, settings, related, isLoading, notFound } =
    useProductDetail(slug);
  const [selectedColorHex, setSelectedColorHex] = useState<string | null>(null);
  const infoTopRef = useRef<HTMLDivElement>(null!);
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);

  if (isLoading) return <ProductDetailSkeleton />;

  if (notFound || !product) {
    return (
      <div className="mx-auto max-w-[600px] px-4 py-24 text-center">
        <h1 className="mb-2 font-heading text-2xl font-bold text-brand-text">
          {locale === "bn" ? "পণ্যটি পাওয়া যায়নি" : "Product not found"}
        </h1>
        <Link
          href={`/${locale}/shop`}
          className="text-sm font-medium text-brand-primary hover:underline"
        >
          {locale === "bn" ? "শপে ফিরে যান" : "Back to shop"}
        </Link>
      </div>
    );
  }

  const activeColor =
    product.colors.find((c) => c.hex === selectedColorHex) ??
    product.colors[0] ??
    null;

  const categoryLabel = product.category.name;
  const categorySlug = product.category.slug;

  const handleAddToCart = (quantity: number) => {
    const colorKey = activeColor?.hex ?? "default";
    addItem({
      productId: makeCartKey(product.id, colorKey),
      name: product.name[locale],
      price: product.price,
      image: product.images[0]?.url,
      slug: product.slug,
      colorName: activeColor?.name?.[locale],
      colorHex: activeColor?.hex,
      originalPrice: product.compareAtPrice ?? undefined,
      stock: product.inStock ? "in-stock" : "out-of-stock",
      quantity,
    });
  };

  const handleBuyNow = (quantity: number) => {
    handleAddToCart(quantity);
    // Buy Now jumps straight to checkout — cart page is skipped
    // intentionally so the buyer never has to re-confirm intent.
    router.push(`/${locale}/checkout`);
  };

  const relatedShopProducts = toShopProducts(related, locale);

  return (
    <div className="mx-auto max-w-[1200px] px-4 pb-20 pt-[calc(var(--shop-nav)+1rem)] [--shop-nav:4.5rem] sm:px-6 lg:px-8 lg:[--shop-nav:5.75rem]">
      <Breadcrumb
        locale={locale}
        items={[
          { label: locale === "bn" ? "হোম" : "Home", href: "/" },
          {
            label: categoryLabel[locale],
            href: `/shop?category=${categorySlug}`,
          },
          { label: product.name[locale] },
        ]}
      />

      <div
        ref={infoTopRef}
        className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12"
      >
        <ProductGallery
          images={product.images}
          productName={product.name}
          locale={locale}
        />
        <ProductInfo
          product={product}
          deliveryEstimate={settings?.deliveryEstimate ?? null}
          returnPolicy={settings?.returnPolicy ?? null}
          locale={locale}
          selectedColorHex={activeColor?.hex ?? null}
          onSelectColor={setSelectedColorHex}
          onAddToCart={handleAddToCart}
          onBuyNow={handleBuyNow}
        />
      </div>

      {faqs.length > 0 && (
        <div className="mt-14 border-t border-brand-border pt-10">
          <ProductFaq faqs={faqs} locale={locale} />
        </div>
      )}

      <div className="mt-14 border-t border-brand-border pt-10">
        <ProductReviews
          rating={product.averageRating}
          reviewCount={product.totalReviews}
          reviews={reviews}
          locale={locale}
        />
      </div>

      {relatedShopProducts.length > 0 && (
        <div className="mt-14 border-t border-brand-border pt-10">
          <h2 className="mb-4 font-heading text-xl font-bold text-brand-text sm:text-2xl">
            {locale === "bn" ? "আপনার পছন্দ হতে পারে" : "You may also like"}
          </h2>
          <ShopProductGrid products={relatedShopProducts} locale={locale} />
        </div>
      )}

      <StickyBuyBar
        price={product.price}
        disabled={!product.inStock}
        watchRef={infoTopRef}
        onAddToCart={() => handleAddToCart(1)}
        locale={locale}
      />
    </div>
  );
}
