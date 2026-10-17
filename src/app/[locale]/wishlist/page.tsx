// src/app/[locale]/wishlist/page.tsx

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuthStore } from "@/lib/stores/useAuthStore";
import { Loader2, Heart } from "lucide-react";
import type { Locale } from "@/lib/shop/types";
import type { StorefrontProduct } from "@/lib/storefront/product-mapper";
import { toShopProducts } from "@/lib/shop/adapter";
import ProductGrid from "@/components/shop/ProductGrid";

export default function WishlistPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const [locale, setLocale] = useState<Locale>("en");
  params.then((p) => setLocale(p.locale as Locale));

  const { user, isLoading: authLoading } = useAuthStore();
  const [products, setProducts] = useState<StorefrontProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    if (!user || !user.wishlist || user.wishlist.length === 0) {
      setIsLoading(false);
      return;
    }

    // Fetch all products, then filter by the IDs in the wishlist
    // (In a large app, you'd create a specific API endpoint to fetch by IDs)
    fetch("/api/storefront/products")
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          const wishlistedProducts = json.data.filter((p: StorefrontProduct) =>
            user.wishlist?.includes(p.id),
          );
          setProducts(wishlistedProducts);
        }
      })
      .finally(() => setIsLoading(false));
  }, [user, authLoading]);

  if (authLoading || isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
        <Heart className="mb-4 h-12 w-12 text-brand-text-secondary/50" />
        <h1 className="mb-2 text-2xl font-bold text-brand-text">
          {locale === "bn"
            ? "আপনার উইশলিস্ট দেখতে লগইন করুন"
            : "Login to view your wishlist"}
        </h1>
        <Link
          href={`/${locale}/login`}
          className="mt-4 rounded-full bg-brand-primary px-6 py-2.5 text-sm font-semibold text-white"
        >
          {locale === "bn" ? "লগইন করুন" : "Log In"}
        </Link>
      </div>
    );
  }

  const shopProducts = toShopProducts(products, locale);

  return (
    <div className="mx-auto max-w-[1400px] px-4 pb-20 pt-[calc(var(--shop-nav)+1rem)] [--shop-nav:4.5rem] sm:px-6 lg:px-8 lg:[--shop-nav:5.75rem]">
      <div className="mb-8">
        <h1 className="font-heading text-2xl font-bold text-brand-text sm:text-3xl">
          {locale === "bn" ? "আমার উইশলিস্ট" : "My Wishlist"}
        </h1>
        <p className="mt-2 text-brand-text-secondary">
          {products.length}{" "}
          {locale === "bn" ? "টি পণ্য সেভ করা আছে" : "products saved"}
        </p>
      </div>

      {products.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-brand-border bg-brand-surface py-20 text-center">
          <Heart className="mb-4 h-12 w-12 text-brand-text-secondary/50" />
          <h2 className="text-lg font-semibold text-brand-text">
            {locale === "bn" ? "আপনার উইশলিস্ট খালি" : "Your wishlist is empty"}
          </h2>
          <p className="mt-1 text-sm text-brand-text-secondary">
            {locale === "bn"
              ? "পছন্দের পণ্যে হার্ট আইকনে ক্লিক করে সেভ করুন।"
              : "Click the heart icon on any product to save it here."}
          </p>
          <Link
            href={`/${locale}/shop`}
            className="mt-6 rounded-full bg-brand-primary px-6 py-2.5 text-sm font-semibold text-white"
          >
            {locale === "bn" ? "কেনাকাটা শুরু করুন" : "Start Shopping"}
          </Link>
        </div>
      ) : (
        <ProductGrid products={shopProducts} locale={locale} />
      )}
    </div>
  );
}
