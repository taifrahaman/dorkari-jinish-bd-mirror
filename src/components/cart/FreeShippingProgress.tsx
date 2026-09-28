// src/components/cart/FreeShippingProgress.tsx

"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { PartyPopper, Truck } from "lucide-react";

import type { Locale } from "@/lib/shop/types";
import { FREE_SHIPPING_THRESHOLD } from "@/lib/cart/constants";

const fmtPrice = (n: number, locale: Locale) =>
  new Intl.NumberFormat(locale === "bn" ? "bn-BD" : "en-US", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 0,
  }).format(n);

export default function FreeShippingProgress({
  subtotal,
  locale = "en",
}: {
  subtotal: number;
  locale?: Locale;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);
  const wasReached = useRef(subtotal >= FREE_SHIPPING_THRESHOLD);

  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const pct = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);
  const reached = remaining === 0;

  useEffect(() => {
    if (fillRef.current) {
      gsap.to(fillRef.current, {
        width: `${pct}%`,
        duration: 0.6,
        ease: "power3.out",
      });
    }
    // A small celebratory pulse the moment the threshold is first crossed.
    if (reached && !wasReached.current && cardRef.current) {
      gsap.fromTo(
        cardRef.current,
        { scale: 1 },
        {
          scale: 1.015,
          duration: 0.22,
          yoyo: true,
          repeat: 1,
          ease: "power2.out",
        },
      );
    }
    wasReached.current = reached;
  }, [pct, reached]);

  return (
    <div ref={cardRef} className="rounded-2xl bg-brand-navbar/70 p-4">
      <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-brand-text">
        {reached ? (
          <PartyPopper className="h-3.5 w-3.5 flex-none text-brand-primary" />
        ) : (
          <Truck className="h-3.5 w-3.5 flex-none text-brand-primary" />
        )}
        {reached
          ? locale === "bn"
            ? "আপনি ফ্রি ডেলিভারি পেয়েছেন!"
            : "You've unlocked free delivery!"
          : locale === "bn"
            ? `ফ্রি ডেলিভারির জন্য আর ${fmtPrice(remaining, locale)} কিনুন`
            : `Add ${fmtPrice(remaining, locale)} more for free delivery`}
      </p>
      <div className="h-2 overflow-hidden rounded-full bg-brand-border/70">
        <div
          ref={fillRef}
          className="h-full rounded-full bg-brand-accent"
          style={{ width: 0 }}
        />
      </div>
    </div>
  );
}
