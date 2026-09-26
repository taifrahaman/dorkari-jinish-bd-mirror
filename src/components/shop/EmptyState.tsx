// src/components/shop/EmptyState.tsx

"use client";

import { PackageSearch } from "lucide-react";

import type { Locale } from "@/lib/shop/types";

type EmptyStateProps = {
  locale?: Locale;
  onClear: () => void;
};

export default function EmptyState({
  locale = "en",
  onClear,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-3xl bg-brand-surface py-20 text-center ring-1 ring-brand-primary/6">
      <PackageSearch
        className="h-8 w-8 text-brand-text-secondary"
        strokeWidth={1.5}
      />
      <p className="font-heading text-base font-bold text-brand-text">
        {locale === "bn"
          ? "কোনো পণ্য পাওয়া যায়নি"
          : "No products match your filters"}
      </p>
      <p className="max-w-xs text-sm text-brand-text-secondary">
        {locale === "bn"
          ? "কিছু ফিল্টার সরিয়ে আবার চেষ্টা করুন।"
          : "Try removing a filter or two to see more results."}
      </p>
      <button
        type="button"
        onClick={onClear}
        className="mt-1 rounded-full bg-brand-primary px-5 py-2 text-sm font-semibold text-white hover:bg-brand-primary-dark"
      >
        {locale === "bn" ? "সব ফিল্টার মুছুন" : "Clear all filters"}
      </button>
    </div>
  );
}
