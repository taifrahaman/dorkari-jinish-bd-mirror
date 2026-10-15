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
import type {
  LocalizedText,
  StorefrontProductDetail,
} from "@/lib/product/types";

const COPY = {
  description: { en: "Description", bn: "বিবরণ" },
  specs: { en: "Specifications", bn: "বিস্তারিত তথ্য" },
  additionalSpecs: { en: "More details", bn: "আরও তথ্য" },
  color: { en: "Color", bn: "রং" },
  brand: { en: "Brand", bn: "ব্র্যান্ড" },
  model: { en: "Model", bn: "মডেল" },
  weight: { en: "Weight", bn: "ওজন" },
  dimensions: { en: "Dimensions", bn: "মাত্রা" },
  warranty: { en: "Warranty", bn: "ওয়ারেন্টি" },
  boxContents: { en: "In the box", bn: "বক্সে যা আছে" },
  addToCart: { en: "Add to Cart", bn: "কার্টে যোগ করুন" },
  buyNow: { en: "Buy Now", bn: "এখনই কিনুন" },
  inStock: { en: "In stock", bn: "স্টকে আছে" },
  outOfStock: { en: "Out of stock", bn: "স্টকে নেই" },
  reviews: { en: "reviews", bn: "রিভিউ" },
  share: { en: "Share", bn: "শেয়ার" },
  genuine: { en: "100% genuine", bn: "১০০% আসল" },
  cod: { en: "Cash on delivery", bn: "ক্যাশ অন ডেলিভারি" },
  quantity: { en: "Quantity", bn: "পরিমাণ" },
};

/* ============================================================
 * Structured-spec extraction
 *
 * The admin enters specs as a free-form key/value list. A handful
 * of spec keys get promoted into the labelled grid; the rest render
 * below under "More details". Matching is case- and separator-
 * insensitive ("Product_Model", "product model", "productmodel").
 * ============================================================ */

const STRUCTURED_SPEC_ALIASES: Record<
  "model" | "weight" | "dimensions" | "warranty",
  string[]
> = {
  model: ["model", "productmodel", "modelnumber"],
  weight: ["weight", "netweight", "grossweight"],
  dimensions: ["dimensions", "size", "packingsize"],
  warranty: ["warranty", "warrantymonths"],
};

function normalizeSpecKey(key: string): string {
  return key.toLowerCase().replace(/[\s_\-.]/g, "");
}

function extractStructuredSpecs(specs: Array<{ key: string; value: string }>): {
  structured: Partial<Record<keyof typeof STRUCTURED_SPEC_ALIASES, string>>;
  rest: Array<{ key: string; value: string }>;
} {
  const used = new Set<string>();
  const structured: Record<string, string> = {};

  for (const [field, aliases] of Object.entries(STRUCTURED_SPEC_ALIASES)) {
    for (const spec of specs) {
      if (used.has(spec.key)) continue;
      if (aliases.includes(normalizeSpecKey(spec.key))) {
        structured[field] = spec.value;
        used.add(spec.key);
        break;
      }
    }
  }

  const rest = specs.filter((s) => !used.has(s.key));
  return {
    structured: structured as Partial<
      Record<keyof typeof STRUCTURED_SPEC_ALIASES, string>
    >,
    rest,
  };
}

const fmtPrice = (n: number, locale: Locale) =>
  new Intl.NumberFormat(locale === "bn" ? "bn-BD" : "en-US", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 0,
  }).format(n);

type ProductInfoProps = {
  product: StorefrontProductDetail;
  deliveryEstimate: LocalizedText | null;
  returnPolicy: LocalizedText | null;
  locale?: Locale;
  selectedColorHex: string | null;
  onSelectColor: (hex: string | null) => void;
  onAddToCart: (quantity: number) => void;
  onBuyNow: (quantity: number) => void;
};

export default function ProductInfo({
  product,
  deliveryEstimate,
  returnPolicy,
  locale = "en",
  selectedColorHex,
  onSelectColor,
  onAddToCart,
  onBuyNow,
}: ProductInfoProps) {
  const [qty, setQty] = useState(1);

  const discount =
    product.compareAtPrice && product.compareAtPrice > product.price
      ? Math.round((1 - product.price / product.compareAtPrice) * 100)
      : null;

  const inStock = product.inStock;
  const stockLabel = inStock ? COPY.inStock[locale] : COPY.outOfStock[locale];
  const stockClass = inStock
    ? "bg-emerald-50 text-emerald-700"
    : "bg-red-50 text-red-600";

  const { structured, rest } = extractStructuredSpecs(product.specifications);

  const activeColor =
    product.colors.find((c) => c.hex === selectedColorHex) ??
    product.colors[0] ??
    null;

  const handleShare = async () => {
    if (navigator.share) {
      await navigator
        .share({ title: product.name[locale], url: window.location.href })
        .catch(() => {});
    } else {
      await navigator.clipboard.writeText(window.location.href);
    }
  };

  const structuredRows: Array<[string, string]> = [];
  if (product.brand) {
    structuredRows.push([COPY.brand[locale], product.brand.name[locale]]);
  }
  if (structured.model) {
    structuredRows.push([COPY.model[locale], structured.model]);
  }
  if (structured.weight) {
    structuredRows.push([COPY.weight[locale], structured.weight]);
  }
  if (structured.dimensions) {
    structuredRows.push([COPY.dimensions[locale], structured.dimensions]);
  }
  if (structured.warranty) {
    structuredRows.push([COPY.warranty[locale], structured.warranty]);
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Eyebrow + name + share */}
      <div>
        <div className="mb-2 flex items-center justify-between gap-3">
          <span className="text-xs font-semibold uppercase tracking-wide text-brand-primary">
            {product.brand?.name[locale] ?? ""}
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
            {product.averageRating.toFixed(1)}
          </span>
          <span className="underline-offset-2 hover:underline">
            (
            {product.totalReviews.toLocaleString(
              locale === "bn" ? "bn-BD" : "en-US",
            )}{" "}
            {COPY.reviews[locale]})
          </span>
        </a>
      </div>

      {/* Price, stock, quantity, purchase actions */}
      <div className="rounded-2xl border border-brand-border p-4">
        <div className="mb-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="font-heading text-2xl font-bold text-brand-text sm:text-3xl">
            {fmtPrice(product.price, locale)}
          </span>
          {product.compareAtPrice && (
            <>
              <span className="text-sm text-brand-text-secondary line-through">
                {fmtPrice(product.compareAtPrice, locale)}
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
              onClick={() => setQty((q) => Math.min(99, q + 1))}
              aria-label={locale === "bn" ? "বাড়ান" : "Increase quantity"}
              className="grid h-11 w-11 place-items-center text-brand-text disabled:opacity-40"
              disabled={!inStock}
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => onAddToCart(qty)}
            disabled={!inStock}
            className="flex h-11 items-center justify-center gap-1.5 whitespace-nowrap rounded-full border border-brand-primary px-2 text-xs font-semibold text-brand-primary transition-transform active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 sm:gap-2 sm:px-4 sm:text-sm"
          >
            <ShoppingBag className="h-4 w-4 flex-none" />
            {COPY.addToCart[locale]}
          </button>
          <button
            type="button"
            onClick={() => onBuyNow(qty)}
            disabled={!inStock}
            className="h-11 whitespace-nowrap rounded-full bg-brand-primary px-2 text-xs font-semibold text-white transition-transform active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 sm:px-4 sm:text-sm"
          >
            {COPY.buyNow[locale]}
          </button>
        </div>
      </div>

      {/* Delivery / return + trust row */}
      {(deliveryEstimate || returnPolicy) && (
        <div className="flex flex-col gap-2 text-sm text-brand-text-secondary">
          {deliveryEstimate && (
            <p className="flex items-center gap-2">
              <Truck
                className="h-4 w-4 flex-none text-brand-primary"
                aria-hidden
              />
              {deliveryEstimate[locale]}
            </p>
          )}
          {returnPolicy && (
            <p className="flex items-center gap-2">
              <Undo2
                className="h-4 w-4 flex-none text-brand-primary"
                aria-hidden
              />
              {returnPolicy[locale]}
            </p>
          )}
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
      )}

      {/* Description */}
      {product.description && (
        <div>
          <h2 className="mb-2 text-sm font-semibold text-brand-text">
            {COPY.description[locale]}
          </h2>
          <p className="text-[15px] leading-relaxed text-brand-text-secondary">
            {product.description[locale]}
          </p>
        </div>
      )}

      {/* Colors */}
      {product.colors.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-medium text-brand-text-secondary">
            {COPY.color[locale]}:{" "}
            <span className="text-brand-text">
              {activeColor?.name?.[locale] ?? activeColor?.hex ?? ""}
            </span>
          </p>
          <div className="flex gap-2.5">
            {product.colors.map((color) => {
              const active = color.hex === activeColor?.hex;
              return (
                <button
                  key={color.hex}
                  type="button"
                  aria-label={color.name?.[locale] ?? color.hex}
                  aria-pressed={active}
                  onClick={() => onSelectColor(color.hex)}
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
                    style={{ backgroundColor: color.hex }}
                  />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Specifications */}
      {structuredRows.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-semibold text-brand-text">
            {COPY.specs[locale]}
          </h2>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-2xl bg-brand-navbar/60 p-4 text-sm sm:grid-cols-3">
            {structuredRows.map(([label, value]) => (
              <div key={label}>
                <dt className="text-xs text-brand-text-secondary">{label}</dt>
                <dd className="font-medium text-brand-text">{value}</dd>
              </div>
            ))}
          </dl>

          {rest.length > 0 && (
            <div className="mt-4">
              <p className="mb-2 text-xs font-medium text-brand-text-secondary">
                {COPY.additionalSpecs[locale]}
              </p>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-3">
                {rest.map((spec) => (
                  <div key={spec.key}>
                    <dt className="text-xs text-brand-text-secondary">
                      {spec.key.replace(/[_-]/g, " ")}
                    </dt>
                    <dd className="font-medium text-brand-text">
                      {spec.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </div>
      )}

      {/* Box contents */}
      {product.boxContents.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-semibold text-brand-text">
            {COPY.boxContents[locale]}
          </h2>
          <ul className="grid grid-cols-1 gap-1.5 text-sm text-brand-text sm:grid-cols-2">
            {product.boxContents.map((item, i) => (
              <li key={i} className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 flex-none rounded-full bg-brand-primary" />
                {item[locale]}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
