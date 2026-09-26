// src/components/product/StickyBuyBar.tsx

"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

import type { Locale } from "@/lib/shop/types";

const fmtPrice = (n: number, locale: Locale) =>
  new Intl.NumberFormat(locale === "bn" ? "bn-BD" : "en-US", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 0,
  }).format(n);

export default function StickyBuyBar({
  price,
  disabled,
  watchRef,
  onAddToCart,
  locale = "en",
}: {
  price: number;
  disabled?: boolean;
  /** The element to watch — the bar shows once this scrolls above the viewport. */
  watchRef: React.RefObject<HTMLElement>;
  onAddToCart: () => void;
  locale?: Locale;
}) {
  const [visible, setVisible] = useState(false);
  const barRef = useRef<HTMLDivElement>(null);
  const mounted = useRef(false);

  useEffect(() => {
    const el = watchRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting),
      { rootMargin: "-72px 0px 0px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [watchRef]);

  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;
    if (!mounted.current) {
      gsap.set(bar, { yPercent: visible ? 0 : 100 });
      mounted.current = true;
      return;
    }
    gsap.to(bar, {
      yPercent: visible ? 0 : 100,
      duration: 0.3,
      ease: "power3.out",
    });
  }, [visible]);

  return (
    <div
      ref={barRef}
      className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-3 border-t border-brand-border bg-brand-surface p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] shadow-[0_-8px_24px_-12px_rgba(23,38,66,0.2)] sm:hidden"
      style={{ transform: "translateY(100%)" }}
    >
      <span className="flex-none whitespace-nowrap font-heading text-lg font-bold text-brand-text">
        {fmtPrice(price, locale)}
      </span>
      <button
        type="button"
        disabled={disabled}
        onClick={onAddToCart}
        className="h-11 flex-1 whitespace-nowrap rounded-full bg-brand-primary text-sm font-semibold text-white disabled:opacity-40"
      >
        {locale === "bn" ? "কার্টে যোগ করুন" : "Add to Cart"}
      </button>
    </div>
  );
}
