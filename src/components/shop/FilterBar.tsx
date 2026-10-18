// src/components/shop/FilterBar.tsx

"use client";

import { useEffect, useRef } from "react";
import { SlidersHorizontal } from "lucide-react";
import gsap from "gsap";

import type { Locale, SortOption } from "@/lib/shop/types";
import SortMenu from "./SortMenu";

type FilterBarProps = {
  locale?: Locale;
  onOpenFilters: () => void;
  activeFilterCount: number;
  sort: SortOption;
  onSortChange: (value: SortOption) => void;
  resultCount: number;
};

function ResultCount({ value, locale }: { value: number; locale: Locale }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const tween = gsap.fromTo(
      ref.current,
      { y: 8, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.35, ease: "power2.out" },
    );
    return () => {
      tween.kill();
    };
  }, [value]);

  return (
    <p
      aria-live="polite"
      className="whitespace-nowrap text-sm text-brand-text-secondary"
    >
      <span
        ref={ref}
        className="mr-1 inline-block font-semibold tabular-nums text-brand-text"
      >
        {value.toLocaleString(locale === "bn" ? "bn-BD" : "en-US")}
      </span>
      {locale === "bn" ? "টি পণ্য" : "results"}
    </p>
  );
}

export default function FilterBar({
  locale = "en",
  onOpenFilters,
  activeFilterCount,
  sort,
  onSortChange,
  resultCount,
}: FilterBarProps) {
  const hasFilters = activeFilterCount > 0;

  return (
    /* the only sticky part, parked just under the floating navbar */
    <div className="sticky top-[var(--shop-nav)] z-30 -mx-4 flex items-center justify-between gap-3 border-b border-brand-border bg-brand-background/85 px-4 py-3 backdrop-blur-xl sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenFilters}
          className={`inline-flex min-h-11 items-center gap-2 rounded-full px-5 text-sm font-semibold transition-all duration-300 active:scale-95 ${
            hasFilters
              ? "bg-brand-primary text-white shadow-[0_10px_24px_-10px_rgba(23,38,66,0.6)]"
              : "bg-brand-surface text-brand-text ring-1 ring-brand-border hover:ring-brand-primary"
          }`}
        >
          <SlidersHorizontal className="h-4 w-4" />
          {locale === "bn" ? "ফিল্টার" : "Filters"}
          {hasFilters && (
            <span className="grid h-5 min-w-5 place-items-center rounded-full bg-brand-accent px-1 text-[11px] font-bold text-brand-primary">
              {activeFilterCount}
            </span>
          )}
        </button>

        <ResultCount value={resultCount} locale={locale} />
      </div>

      <SortMenu value={sort} onChange={onSortChange} locale={locale} />
    </div>
  );
}
