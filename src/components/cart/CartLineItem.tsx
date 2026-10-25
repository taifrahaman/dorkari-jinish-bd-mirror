// src/components/cart/CartLineItem.tsx

"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import gsap from "gsap";

import type { CartItem } from "@/lib/stores/useCartStore";
import { useCartStore } from "@/lib/stores/useCartStore";
import type { Locale } from "@/lib/shop/types";

const fmtPrice = (n: number, locale: Locale) =>
  new Intl.NumberFormat(locale === "bn" ? "bn-BD" : "en-US", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 0,
  }).format(n);

export default function CartLineItem({
  item,
  locale = "en",
}: {
  item: CartItem;
  locale?: Locale;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const [busy, setBusy] = useState(false);

  const maxQty = item.stockCount ?? 99;
  const lineTotal = item.price * item.quantity;
  const discount = item.originalPrice
    ? Math.round((1 - item.price / item.originalPrice) * 100)
    : null;

  const handleRemove = () => {
    const el = rootRef.current;
    if (!el || busy) return;
    setBusy(true);
    gsap.to(el, {
      opacity: 0,
      height: 0,
      marginBottom: 0,
      scale: 0.97,
      duration: 0.3,
      ease: "power2.in",
      onComplete: () => removeItem(item.productId),
    });
  };

  return (
    <div
      ref={rootRef}
      className="group relative overflow-hidden rounded-3xl border border-brand-border bg-brand-surface p-4 transition-shadow duration-300 hover:shadow-[0_16px_32px_-20px_rgba(23,38,66,0.28)] sm:p-5"
    >
      <button
        type="button"
        onClick={handleRemove}
        disabled={busy}
        aria-label={locale === "bn" ? "সরান" : "Remove"}
        className="absolute right-3 top-3 z-[1] grid h-8 w-8 place-items-center rounded-full bg-brand-surface/90 text-brand-text-secondary opacity-0 shadow-sm transition-all duration-200 hover:bg-red-50 hover:text-red-600 group-hover:opacity-100 sm:opacity-100"
      >
        <Trash2 className="h-4 w-4" />
      </button>

      <div className="flex gap-4 pr-8">
        <Link
          href={item.slug ? `/${locale}/product/${item.slug}` : "#"}
          className="relative h-24 w-24 flex-none overflow-hidden rounded-2xl bg-brand-navbar sm:h-28 sm:w-28"
        >
          {item.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.image}
              alt=""
              className="h-full w-full object-cover"
            />
          )}
          {discount !== null && (
            <span className="absolute left-1.5 top-1.5 rounded-full bg-brand-accent px-1.5 py-0.5 text-[10px] font-bold text-brand-primary">
              -{discount}%
            </span>
          )}
        </Link>

        <div className="flex flex-1 flex-col gap-1.5">
          <div>
            <Link
              href={item.slug ? `/${locale}/product/${item.slug}` : "#"}
              className="text-sm font-semibold text-brand-text hover:text-brand-primary sm:text-base"
            >
              {item.name}
            </Link>
            {item.colorName && (
              <p className="mt-0.5 flex items-center gap-1.5 text-xs text-brand-text-secondary">
                {item.colorHex && (
                  <span
                    className="h-3 w-3 rounded-full ring-1 ring-inset ring-black/10"
                    style={{ backgroundColor: item.colorHex }}
                  />
                )}
                {item.colorName}
              </p>
            )}
          </div>

          {item.stock === "out-of-stock" && (
            <p className="text-xs font-semibold text-red-600">
              {locale === "bn" ? "স্টকে নেই" : "Out of stock"}
            </p>
          )}
          {item.stock === "low-stock" && (
            <p className="text-xs font-semibold text-amber-700">
              {locale === "bn"
                ? `মাত্র ${item.stockCount ?? ""}টি বাকি`
                : `Only ${item.stockCount ?? ""} left`}
            </p>
          )}

          <div className="mt-auto flex flex-wrap items-end justify-between gap-3 pt-1">
            <div className="flex items-center rounded-full border border-brand-border">
              <button
                type="button"
                onClick={() =>
                  updateQuantity(item.productId, item.quantity - 1)
                }
                aria-label={locale === "bn" ? "কমান" : "Decrease quantity"}
                className="grid h-9 w-9 place-items-center text-brand-text transition-colors hover:bg-brand-navbar disabled:opacity-40"
                disabled={item.quantity <= 1}
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <span className="w-6 text-center text-sm font-semibold tabular-nums">
                {item.quantity}
              </span>
              <button
                type="button"
                onClick={() =>
                  updateQuantity(
                    item.productId,
                    Math.min(maxQty, item.quantity + 1),
                  )
                }
                aria-label={locale === "bn" ? "বাড়ান" : "Increase quantity"}
                className="grid h-9 w-9 place-items-center text-brand-text transition-colors hover:bg-brand-navbar disabled:opacity-40"
                disabled={item.quantity >= maxQty}
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="text-right">
              <p className="font-heading text-base font-bold text-brand-text sm:text-lg">
                {fmtPrice(lineTotal, locale)}
              </p>
              {item.originalPrice && (
                <p className="text-xs text-brand-text-secondary line-through">
                  {fmtPrice(item.originalPrice * item.quantity, locale)}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
