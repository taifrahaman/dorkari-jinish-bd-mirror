// src/components/product/index.tsx

"use client";

import { useRef, useState } from "react";
import Link from "next/link";

import { useProductDetail } from "@/hooks/use-product-detail";
import { DUMMY_PRODUCTS } from "@/lib/shop/dummy-products";
import type { Locale } from "@/lib/shop/types";

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
  const { product, isLoading, notFound } = useProductDetail(slug);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    null,
  );
  const infoTopRef = useRef<HTMLDivElement>(null!);

  if (isLoading) return <ProductDetailSkeleton />;

  if (notFound || !product) {
    return (
      <div className="mx-auto max-w-[600px] px-4 py-24 text-center">
        <h1 className="mb-2 font-heading text-2xl font-bold text-brand-text">
          {locale === "bn" ? "পণ্যটি পাওয়া যায়নি" : "Product not found"}
        </h1>
        <Link
          href="/shop"
          className="text-sm font-medium text-brand-primary hover:underline"
        >
          {locale === "bn" ? "শপে ফিরে যান" : "Back to shop"}
        </Link>
      </div>
    );
  }

  const activeVariant =
    product.variants.find((v) => v.id === selectedVariantId) ??
    product.variants[0];

  const related = DUMMY_PRODUCTS.filter((p) => p.id !== product.id).slice(0, 4);

  // Stub handlers — wire these up to real cart/checkout state when it exists.
  const handleAddToCart = (quantity: number) => {
    console.log("add to cart", {
      productId: product.id,
      variant: activeVariant.id,
      quantity,
    });
  };
  const handleBuyNow = (quantity: number) => {
    console.log("buy now", {
      productId: product.id,
      variant: activeVariant.id,
      quantity,
    });
  };

  return (
    <div className="mx-auto max-w-[1200px] px-4 pb-20 pt-[calc(var(--shop-nav)+1rem)] [--shop-nav:4.5rem] sm:px-6 lg:px-8 lg:[--shop-nav:5.75rem]">
      <Breadcrumb
        locale={locale}
        items={[
          { label: locale === "bn" ? "হোম" : "Home", href: "/" },
          {
            label: product.categoryLabel[locale],
            href: `/shop?category=${product.categoryValue}`,
          },
          { label: product.name[locale] },
        ]}
      />

      <div
        ref={infoTopRef}
        className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12"
      >
        <ProductGallery
          images={activeVariant.images}
          productName={product.name}
          locale={locale}
        />
        <ProductInfo
          product={product}
          locale={locale}
          selectedVariantId={activeVariant.id}
          onSelectVariant={setSelectedVariantId}
          onAddToCart={handleAddToCart}
          onBuyNow={handleBuyNow}
        />
      </div>

      <div className="mt-14 border-t border-brand-border pt-10">
        <ProductFaq faqs={product.faqs} locale={locale} />
      </div>

      <div className="mt-14 border-t border-brand-border pt-10">
        <ProductReviews
          rating={product.rating}
          reviewCount={product.reviewCount}
          reviews={product.reviews}
          locale={locale}
        />
      </div>

      {related.length > 0 && (
        <div className="mt-14 border-t border-brand-border pt-10">
          <h2 className="mb-4 font-heading text-xl font-bold text-brand-text sm:text-2xl">
            {locale === "bn" ? "আপনার পছন্দ হতে পারে" : "You may also like"}
          </h2>
          <ShopProductGrid products={related} locale={locale} />
        </div>
      )}

      <StickyBuyBar
        price={product.price}
        disabled={product.stock === "out-of-stock"}
        watchRef={infoTopRef}
        onAddToCart={() => handleAddToCart(1)}
        locale={locale}
      />
    </div>
  );
}
