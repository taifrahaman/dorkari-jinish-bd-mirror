// src/components/cart/index.tsx

"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import gsap from "gsap";

import type { Locale } from "@/lib/shop/types";
import type { DeliveryConfig } from "@/lib/product/types";
import type { StorefrontProduct } from "@/lib/storefront/product-mapper";
import { toShopProducts } from "@/lib/shop/adapter";
import ShopProductGrid from "@/components/shop/ProductGrid";
import { useCartStore } from "@/lib/stores/useCartStore";
import { parseCartKey } from "@/lib/cart/cart-key";
import { useHydration } from "@/lib/stores/useHydration";

import CartLineItem from "./CartLineItem";
import CartSummary from "./CartSummary";
import EmptyCart from "./EmptyCart";

type CartPageProps = {
  locale?: Locale;
  recommendedProducts: StorefrontProduct[];
  delivery: DeliveryConfig;
};

export default function CartPage({
  locale = "en",
  recommendedProducts,
  delivery,
}: CartPageProps) {
  const hydrated = useHydration();
  const items = useCartStore((s) => s.items);
  const totalItems = useCartStore((s) => s.totalItems);
  const listRef = useRef<HTMLDivElement>(null);
  const animated = useRef(false);

  // A one-time soft entrance for the row cards once the cart is known to be non-empty.
  useEffect(() => {
    if (!hydrated || items.length === 0 || animated.current) return;
    animated.current = true;
    const cards = listRef.current ? Array.from(listRef.current.children) : [];
    if (cards.length === 0) return;
    gsap.fromTo(
      cards,
      { opacity: 0, y: 16 },
      { opacity: 1, y: 0, duration: 0.45, ease: "power3.out", stagger: 0.06 },
    );
  }, [hydrated, items.length]);

  if (!hydrated) {
    return (
      <div className="mx-auto max-w-[1200px] px-4 pt-[calc(var(--shop-nav)+1rem)] [--shop-nav:4.5rem] sm:px-6 lg:px-8 lg:[--shop-nav:5.75rem]" />
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-[1200px] px-4 pt-[calc(var(--shop-nav)+1rem)] [--shop-nav:4.5rem] sm:px-6 lg:px-8 lg:[--shop-nav:5.75rem]">
        <EmptyCart locale={locale} />
      </div>
    );
  }

  // Filter out recommended products that are already in the cart
  const cartProductIds = new Set(
    items.map((i) => parseCartKey(i.productId).productId),
  );

  const filteredRecommended = recommendedProducts
    .filter((p) => !cartProductIds.has(p.id))
    .slice(0, 4);

  // Convert to the shape ShopProductGrid expects
  const recommendedShopProducts = toShopProducts(filteredRecommended, locale);

  return (
    <div className="mx-auto max-w-[1200px] px-4 pb-20 pt-[calc(var(--shop-nav)+1rem)] [--shop-nav:4.5rem] sm:px-6 lg:px-8 lg:[--shop-nav:5.75rem]">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-brand-primary">
            {locale === "bn" ? "কার্ট" : "Cart"}
          </p>
          <h1 className="flex items-center gap-2.5 font-heading text-2xl font-bold text-brand-text sm:text-3xl">
            {locale === "bn" ? "আপনার কার্ট" : "Your Cart"}
            <span className="grid h-7 min-w-7 place-items-center rounded-full bg-brand-accent px-2 text-sm font-bold text-brand-primary">
              {totalItems}
            </span>
          </h1>
        </div>
        <Link
          href={`/${locale}/shop`}
          className="flex items-center gap-1.5 text-sm font-medium text-brand-text-secondary transition-colors hover:text-brand-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          {locale === "bn" ? "শপিং চালিয়ে যান" : "Continue shopping"}
        </Link>
      </div>

      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[1fr_360px]">
        <div ref={listRef} className="flex flex-col gap-4">
          {items.map((item) => (
            <CartLineItem key={item.productId} item={item} locale={locale} />
          ))}
        </div>
        <CartSummary locale={locale} delivery={delivery} />
      </div>

      {recommendedShopProducts.length > 0 && (
        <div className="mt-14 border-t border-brand-border pt-10">
          <h2 className="mb-4 font-heading text-xl font-bold text-brand-text sm:text-2xl">
            {locale === "bn" ? "আপনার পছন্দ হতে পারে" : "You may also like"}
          </h2>
          <ShopProductGrid products={recommendedShopProducts} locale={locale} />
        </div>
      )}
    </div>
  );
}
