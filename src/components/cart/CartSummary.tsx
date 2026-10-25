// src/components/cart/CartSummary.tsx

"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, ShieldCheck, Truck } from "lucide-react";

import type { Locale } from "@/lib/shop/types";
import type { DeliveryConfig } from "@/lib/product/types";
import { useCartStore } from "@/lib/stores/useCartStore";
import { PROMO_CODES } from "@/lib/cart/constants";

import FreeShippingProgress from "./FreeShippingProgress";

const fmtPrice = (n: number, locale: Locale) =>
  new Intl.NumberFormat(locale === "bn" ? "bn-BD" : "en-US", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 0,
  }).format(n);

export default function CartSummary({
  locale = "en",
  delivery,
}: {
  locale?: Locale;
  delivery: DeliveryConfig;
}) {
  const items = useCartStore((s) => s.items);
  const subtotal = useCartStore((s) => s.totalPrice);
  const [code, setCode] = useState("");
  const [applied, setApplied] = useState<{
    code: string;
    type: "percent" | "shipping";
    value?: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    const found = PROMO_CODES[code.trim().toUpperCase()];
    if (!found) {
      setError(locale === "bn" ? "কোডটি সঠিক নয়" : "That code isn't valid");
      setApplied(null);
      return;
    }
    setApplied({ code: code.trim().toUpperCase(), ...found });
    setError(null);
  };

  const itemSavings = items.reduce(
    (sum, i) => sum + ((i.originalPrice ?? i.price) - i.price) * i.quantity,
    0,
  );
  const promoDiscount =
    applied?.type === "percent"
      ? Math.round(subtotal * ((applied.value ?? 0) / 100))
      : 0;
  const totalSavings = itemSavings + promoDiscount;

  const freeDelivery =
    applied?.type === "shipping" ||
    (delivery.freeShippingEnabled &&
      subtotal >= delivery.freeShippingThreshold);
  const deliveryFee = freeDelivery ? 0 : subtotal > 0 ? delivery.fee : 0;
  const total = subtotal - promoDiscount + deliveryFee;

  return (
    <div className="flex h-fit flex-col gap-4 rounded-3xl border border-brand-border p-5">
      <h2 className="font-heading text-lg font-bold text-brand-text">
        {locale === "bn" ? "অর্ডার সারসংক্ষেপ" : "Order summary"}
      </h2>

      <FreeShippingProgress
        subtotal={subtotal}
        delivery={delivery}
        locale={locale}
      />

      <form onSubmit={handleApply} className="flex gap-2">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder={locale === "bn" ? "প্রোমো কোড" : "Promo code"}
          className="flex-1 rounded-full border border-brand-border bg-transparent px-3.5 py-2 text-sm text-brand-text outline-none transition-colors focus:border-brand-primary"
        />
        <button
          type="submit"
          className="rounded-full bg-brand-navbar px-4 py-2 text-sm font-semibold text-brand-text transition-colors hover:bg-brand-border"
        >
          {locale === "bn" ? "প্রয়োগ" : "Apply"}
        </button>
      </form>
      {error && <p className="-mt-2 text-xs text-red-600">{error}</p>}
      {applied && (
        <p className="-mt-2 text-xs font-medium text-emerald-700">
          {locale === "bn"
            ? `কোড "${applied.code}" প্রয়োগ হয়েছে`
            : `Code "${applied.code}" applied`}
        </p>
      )}

      <div className="flex flex-col gap-2 text-sm">
        <div className="flex justify-between text-brand-text-secondary">
          <span>{locale === "bn" ? "সাবটোটাল" : "Subtotal"}</span>
          <span className="text-brand-text">{fmtPrice(subtotal, locale)}</span>
        </div>
        {promoDiscount > 0 && (
          <div className="flex justify-between text-emerald-700">
            <span>{locale === "bn" ? "কোড ছাড়" : "Code discount"}</span>
            <span>-{fmtPrice(promoDiscount, locale)}</span>
          </div>
        )}
        <div className="flex justify-between text-brand-text-secondary">
          <span>{locale === "bn" ? "ডেলিভারি" : "Delivery"}</span>
          <span
            className={
              freeDelivery
                ? "font-semibold text-emerald-700"
                : "text-brand-text"
            }
          >
            {freeDelivery
              ? locale === "bn"
                ? "ফ্রি"
                : "Free"
              : fmtPrice(deliveryFee, locale)}
          </span>
        </div>
        {totalSavings > 0 && (
          <div className="flex justify-between rounded-xl bg-brand-accent/15 px-3 py-2 text-xs font-semibold text-brand-primary">
            <span>
              {locale === "bn" ? "আপনি সাশ্রয় করেছেন" : "You're saving"}
            </span>
            <span>{fmtPrice(totalSavings, locale)}</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between rounded-2xl bg-brand-primary px-4 py-3.5 text-white">
        <span className="text-sm font-medium text-white/80">
          {locale === "bn" ? "মোট" : "Total"}
        </span>
        <span className="font-heading text-xl font-bold">
          {fmtPrice(total, locale)}
        </span>
      </div>

      <Link
        href={`/${locale}/checkout`}
        className="flex h-12 items-center justify-center gap-2 rounded-full bg-brand-accent text-sm font-semibold text-white transition-transform active:scale-95"
      >
        {locale === "bn" ? "চেকআউট করুন" : "Proceed to Checkout"}
        <ArrowRight className="h-4 w-4" />
      </Link>

      <div className="flex flex-wrap gap-2">
        <span className="flex items-center gap-1.5 rounded-full bg-brand-navbar px-3 py-1.5 text-xs font-medium text-brand-text">
          <ShieldCheck className="h-3.5 w-3.5 text-brand-primary" />{" "}
          {locale === "bn" ? "১০০% আসল" : "100% genuine"}
        </span>
        <span className="flex items-center gap-1.5 rounded-full bg-brand-navbar px-3 py-1.5 text-xs font-medium text-brand-text">
          <Truck className="h-3.5 w-3.5 text-brand-primary" />{" "}
          {locale === "bn" ? "ক্যাশ অন ডেলিভারি" : "Cash on delivery"}
        </span>
      </div>
    </div>
  );
}
