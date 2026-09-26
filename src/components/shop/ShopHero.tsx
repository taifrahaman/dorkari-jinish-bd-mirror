// src/components/shop/ShopHero.tsx

"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import gsap from "gsap";

import ShopSearch from "./Search";
import type { Locale } from "@/lib/shop/types";

const useIsoLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

const COPY = {
  lead: { en: "Shop All", bn: "সকল" },
  highlight: { en: "Appliances", bn: "পণ্য" },
  sub: {
    en: "Everything for your home, in one place.",
    bn: "আপনার বাড়ির জন্য সেরা যন্ত্রপাতি খুঁজে নিন।",
  },
};

const SUGGESTIONS = [
  "Rice cooker",
  "Refrigerator",
  "Air conditioner",
  "Blender",
];

type ShopHeroProps = {
  locale?: Locale;
  productCount: number;
  query: string;
  onQueryChange: (value: string) => void;
  onSearchSubmit?: () => void;
};

export default function ShopHero({
  locale = "en",
  productCount,
  query,
  onQueryChange,
  onSearchSubmit,
}: ShopHeroProps) {
  const rootRef = useRef<HTMLElement>(null);

  useIsoLayoutEffect(() => {
    const root = rootRef.current;
    if (!root || window.matchMedia("(prefers-reduced-motion: reduce)").matches)
      return;

    const ctx = gsap.context(() => {
      gsap.from("[data-in]", {
        opacity: 0,
        y: 20,
        duration: 0.7,
        ease: "power3.out",
        stagger: 0.09,
      });
      gsap.from("[data-underline]", {
        scaleX: 0,
        transformOrigin: "left center",
        duration: 0.8,
        delay: 0.45,
        ease: "power3.out",
      });
      gsap.to("[data-glow]", {
        xPercent: 10,
        yPercent: -8,
        duration: 9,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
      });
    }, root);

    return () => ctx.revert();
  }, []);

  const count = productCount.toLocaleString(
    locale === "bn" ? "bn-BD" : "en-US",
  );

  return (
    <section
      ref={rootRef}
      className="relative isolate overflow-hidden rounded-[28px] bg-brand-primary px-5 pb-8 pt-10 text-white sm:px-10 sm:pb-12 sm:pt-14 lg:px-14 lg:pb-14 lg:pt-16"
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div
          data-glow
          className="absolute -right-24 -top-32 h-80 w-80 rounded-full bg-brand-accent/30 blur-3xl sm:h-[28rem] sm:w-[28rem]"
        />
        <div
          data-glow
          className="absolute -bottom-40 -left-24 h-72 w-72 rounded-full bg-brand-accent/15 blur-3xl"
        />
        <div
          className="absolute inset-0 opacity-60 [mask-image:linear-gradient(to_bottom,black,transparent_85%)]"
          style={{
            backgroundImage:
              "radial-gradient(rgba(255,255,255,.14) 1px, transparent 1px)",
            backgroundSize: "22px 22px",
          }}
        />
      </div>

      <p
        data-in
        className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-medium text-white/85 ring-1 ring-white/15 backdrop-blur"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-brand-accent" />
        {locale === "bn" ? `${count}টি পণ্য` : `${count} products`}
      </p>

      <h1
        data-in
        className="font-heading text-[2.5rem] font-bold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl"
      >
        {COPY.lead[locale]}{" "}
        <span className="relative inline-block text-brand-accent">
          {COPY.highlight[locale]}
          <svg
            data-underline
            aria-hidden
            viewBox="0 0 200 10"
            preserveAspectRatio="none"
            className="absolute -bottom-2 left-0 h-2.5 w-full"
          >
            <path
              d="M2 7 C 40 1, 70 9, 110 4 S 170 2, 198 6"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        </span>
      </h1>

      <p data-in className="mt-4 max-w-xl text-base text-white/70 sm:text-lg">
        {COPY.sub[locale]}
      </p>

      <div data-in className="mt-8 max-w-2xl">
        <ShopSearch
          locale={locale}
          variant="onDark"
          value={query}
          onChange={onQueryChange}
          onSubmit={onSearchSubmit}
          suggestions={SUGGESTIONS}
        />
      </div>
    </section>
  );
}
