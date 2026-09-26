// src/components/product/ProductInfo.tsx

"use client";

import { useState } from "react";
import {
  Minus,
  Plus,
  Share2,
  ShieldCheck,
  ShoppingBag,
  Star,
  Truck,
  Undo2,
} from "lucide-react";

import type { Locale } from "@/lib/shop/types";
import type { ProductDetail } from "@/lib/product/types";

const COPY = {
  description: { en: "Description", bn: "বিবরণ" },
  specs: { en: "Specifications", bn: "বিস্তারিত তথ্য" },
  color: { en: "Color", bn: "রং" },
  brand: { en: "Brand", bn: "ব্র্যান্ড" },
  model: { en: "Model", bn: "মডেল" },
  weight: { en: "Weight", bn: "ওজন" },
  dimensions: { en: "Dimensions", bn: "মাত্রা" },
  warranty: { en: "Warranty", bn: "ওয়ারেন্টি" },
  boxContents: { en: "In the box", bn: "বক্সে যা আছে" },
  months: { en: "months", bn: "মাস" },
  addToCart: { en: "Add to Cart", bn: "কার্টে যোগ করুন" },
  buyNow: { en: "Buy Now", bn: "এখনই কিনুন" },
  inStock: { en: "In stock", bn: "স্টকে আছে" },
  lowStock: { en: "Only {n} left", bn: "মাত্র {n}টি বাকি" },
  outOfStock: { en: "Out of stock", bn: "স্টকে নেই" },
  reviews: { en: "reviews", bn: "রিভিউ" },
  share: { en: "Share", bn: "শেয়ার" },
  genuine: { en: "100% genuine", bn: "১০০% আসল" },
  cod: { en: "Cash on delivery", bn: "ক্যাশ অন ডেলিভারি" },
  quantity: { en: "Quantity", bn: "পরিমাণ" },
};

const fmtPrice = (n: number, locale: Locale) =>
  new Intl.NumberFormat(locale === "bn" ? "bn-BD" : "en-US", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 0,
  }).format(n);

type ProductInfoProps = {
  product: ProductDetail;
  locale?: Locale;
  selectedVariantId: string;
  onSelectVariant: (id: string) => void;
  onAddToCart: (quantity: number) => void;
  onBuyNow: (quantity: number) => void;
};

export default function ProductInfo({
  product,
  locale = "en",
  selectedVariantId,
  onSelectVariant,
  onAddToCart,
  onBuyNow,
}: ProductInfoProps) {
  const [qty, setQty] = useState(1);
  const selectedVariant =
    product.variants.find((v) => v.id === selectedVariantId) ??
    product.variants[0];
  const discount = product.originalPrice
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : null;

  const stockLabel =
    product.stock === "out-of-stock"
      ? COPY.outOfStock[locale]
      : product.stock === "low-stock"
        ? COPY.lowStock[locale].replace("{n}", String(product.stockCount ?? ""))
        : COPY.inStock[locale];

  const stockClass =
    product.stock === "out-of-stock"
      ? "bg-red-50 text-red-600"
      : product.stock === "low-stock"
        ? "bg-amber-50 text-amber-700"
        : "bg-emerald-50 text-emerald-700";

  const handleShare = async () => {
    if (navigator.share) {
      await navigator
        .share({ title: product.name[locale], url: window.location.href })
        .catch(() => {});
    } else {
      await navigator.clipboard.writeText(window.location.href);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Eyebrow + name + share */}
      <div>
        <div className="mb-2 flex items-center justify-between gap-3">
          <span className="text-xs font-semibold uppercase tracking-wide text-brand-primary">
            {product.brand}
          </span>
          <button
            type="button"
            onClick={handleShare}
            className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium text-brand-text-secondary transition-colors hover:bg-brand-navbar"
          >
            <Share2 className="h-3.5 w-3.5" aria-hidden />
            {COPY.share[locale]}
          </button>
        </div>

        <h1 className="font-heading text-3xl font-bold leading-tight text-brand-text sm:text-4xl">
          {product.name[locale]}
        </h1>

        <a
          href="#reviews"
          className="mt-3 inline-flex items-center gap-1.5 text-sm text-brand-text-secondary hover:text-brand-primary"
        >
          <Star
            className="h-4 w-4 fill-brand-accent text-brand-accent"
            aria-hidden
          />
          <span className="font-semibold text-brand-text">
            {product.rating.toFixed(1)}
          </span>
          <span className="underline-offset-2 hover:underline">
            (
            {product.reviewCount.toLocaleString(
              locale === "bn" ? "bn-BD" : "en-US",
            )}{" "}
            {COPY.reviews[locale]})
          </span>
        </a>
      </div>

      {/* Price, stock, quantity, purchase actions — right under the name so it's never below the fold */}
      <div className="rounded-2xl border border-brand-border p-4">
        <div className="mb-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="font-heading text-2xl font-bold text-brand-text sm:text-3xl">
            {fmtPrice(product.price, locale)}
          </span>
          {product.originalPrice && (
            <>
              <span className="text-sm text-brand-text-secondary line-through">
                {fmtPrice(product.originalPrice, locale)}
              </span>
              <span className="rounded-full bg-brand-accent px-2 py-0.5 text-xs font-bold text-brand-primary">
                -{discount}%
              </span>
            </>
          )}
          <span
            className={`ml-auto rounded-full px-2.5 py-1 text-xs font-semibold ${stockClass}`}
          >
            {stockLabel}
          </span>
        </div>

        {/* Quantity: its own row, so its width never squeezes the CTA row below */}
        <div className="mb-3 flex items-center gap-3">
          <span className="text-xs font-medium text-brand-text-secondary">
            {COPY.quantity[locale]}
          </span>
          <div className="flex items-center rounded-full border border-brand-border">
            <button
              type="button"
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              aria-label={locale === "bn" ? "কমান" : "Decrease quantity"}
              className="grid h-11 w-11 place-items-center text-brand-text disabled:opacity-40"
              disabled={qty <= 1}
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="w-8 text-center text-sm font-semibold tabular-nums">
              {qty}
            </span>
            <button
              type="button"
              onClick={() =>
                setQty((q) => Math.min(product.stockCount ?? 99, q + 1))
              }
              aria-label={locale === "bn" ? "বাড়ান" : "Increase quantity"}
              className="grid h-11 w-11 place-items-center text-brand-text disabled:opacity-40"
              disabled={product.stock === "out-of-stock"}
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* CTA row: fixed 2-column grid, so button width never depends on the stepper above */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => onAddToCart(qty)}
            disabled={product.stock === "out-of-stock"}
            className="flex h-11 items-center justify-center gap-1.5 whitespace-nowrap rounded-full border border-brand-primary px-2 text-xs font-semibold text-brand-primary transition-transform active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 sm:gap-2 sm:px-4 sm:text-sm"
          >
            <ShoppingBag className="h-4 w-4 flex-none" />
            {COPY.addToCart[locale]}
          </button>
          <button
            type="button"
            onClick={() => onBuyNow(qty)}
            disabled={product.stock === "out-of-stock"}
            className="h-11 whitespace-nowrap rounded-full bg-brand-primary px-2 text-xs font-semibold text-white transition-transform active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 sm:px-4 sm:text-sm"
          >
            {COPY.buyNow[locale]}
          </button>
        </div>
      </div>

      {/* Delivery / return + trust row */}
      <div className="flex flex-col gap-2 text-sm text-brand-text-secondary">
        <p className="flex items-center gap-2">
          <Truck className="h-4 w-4 flex-none text-brand-primary" aria-hidden />
          {product.deliveryEstimate[locale]}
        </p>
        <p className="flex items-center gap-2">
          <Undo2 className="h-4 w-4 flex-none text-brand-primary" aria-hidden />
          {product.returnPolicy[locale]}
        </p>
        <div className="mt-1 flex flex-wrap gap-2">
          <span className="flex items-center gap-1.5 rounded-full bg-brand-navbar px-3 py-1.5 text-xs font-medium text-brand-text">
            <ShieldCheck className="h-3.5 w-3.5 text-brand-primary" />{" "}
            {COPY.genuine[locale]}
          </span>
          <span className="flex items-center gap-1.5 rounded-full bg-brand-navbar px-3 py-1.5 text-xs font-medium text-brand-text">
            <Truck className="h-3.5 w-3.5 text-brand-primary" />{" "}
            {COPY.cod[locale]}
          </span>
        </div>
      </div>

      {/* Description */}
      <div>
        <h2 className="mb-2 text-sm font-semibold text-brand-text">
          {COPY.description[locale]}
        </h2>
        <p className="text-[15px] leading-relaxed text-brand-text-secondary">
          {product.description[locale]}
        </p>
      </div>

      {/* Specs: color, brand, weight, dimensions, warranty, box contents */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-brand-text">
          {COPY.specs[locale]}
        </h2>

        <div className="mb-4">
          <p className="mb-2 text-xs font-medium text-brand-text-secondary">
            {COPY.color[locale]}:{" "}
            <span className="text-brand-text">
              {selectedVariant.name[locale]}
            </span>
          </p>
          <div className="flex gap-2.5">
            {product.variants.map((variant) => {
              const active = variant.id === selectedVariantId;
              return (
                <button
                  key={variant.id}
                  type="button"
                  aria-label={variant.name[locale]}
                  aria-pressed={active}
                  onClick={() => onSelectVariant(variant.id)}
                  className="grid h-10 w-10 place-items-center rounded-full transition-transform active:scale-95"
                  style={{
                    outline: active
                      ? "2px solid var(--color-brand-primary)"
                      : "none",
                    outlineOffset: 2,
                  }}
                >
                  <span
                    className="h-8 w-8 rounded-full shadow-[inset_0_0_0_1px_rgba(0,0,0,0.14)]"
                    style={{ backgroundColor: variant.hex }}
                  />
                </button>
              );
            })}
          </div>
        </div>

        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-2xl bg-brand-navbar/60 p-4 text-sm sm:grid-cols-3">
          {[
            [COPY.brand[locale], product.brand],
            [COPY.model[locale], product.model],
            [COPY.weight[locale], product.weight[locale]],
            [COPY.dimensions[locale], product.dimensions[locale]],
            [
              COPY.warranty[locale],
              `${product.warrantyMonths} ${COPY.months[locale]}`,
            ],
          ].map(([label, value]) => (
            <div key={label}>
              <dt className="text-xs text-brand-text-secondary">{label}</dt>
              <dd className="font-medium text-brand-text">{value}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-4">
          <p className="mb-1.5 text-xs font-medium text-brand-text-secondary">
            {COPY.boxContents[locale]}
          </p>
          <ul className="grid grid-cols-1 gap-1.5 text-sm text-brand-text sm:grid-cols-2">
            {product.boxContents.map((item) => (
              <li key={item[locale]} className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 flex-none rounded-full bg-brand-primary" />
                {item[locale]}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
