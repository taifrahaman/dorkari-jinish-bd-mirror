// src/components/shop/ActiveFilterPills.tsx

"use client";

import { useRef } from "react";
import { X } from "lucide-react";
import gsap from "gsap";

import type { Facet, FilterState, Locale } from "@/lib/shop/types";
import { COLOR_LIST } from "@/lib/shop/dummy-products";
import { formatPrice } from "@/lib/shop/filter-utils";

type Pill = {
  key: string;
  label: string;
  onRemove: () => void;
};

type ActiveFilterPillsProps = {
  locale?: Locale;
  filters: FilterState;
  onChange: (next: FilterState) => void;
  categoryFacets: Facet[];
  brandFacets: Facet[];
};

export default function ActiveFilterPills({
  locale = "en",
  filters,
  onChange,
  categoryFacets,
  brandFacets,
}: ActiveFilterPillsProps) {
  const nodeRefs = useRef<Map<string, HTMLSpanElement>>(new Map());

  const pills: Pill[] = [];

  for (const value of filters.categories) {
    const facet = categoryFacets.find((f) => f.value === value);
    pills.push({
      key: `category-${value}`,
      label: facet?.label[locale] ?? value,
      onRemove: () =>
        onChange({
          ...filters,
          categories: filters.categories.filter((c) => c !== value),
        }),
    });
  }

  for (const value of filters.brands) {
    const facet = brandFacets.find((f) => f.value === value);
    pills.push({
      key: `brand-${value}`,
      label: facet?.label[locale] ?? value,
      onRemove: () =>
        onChange({
          ...filters,
          brands: filters.brands.filter((b) => b !== value),
        }),
    });
  }

  if (filters.priceRange) {
    const [min, max] = filters.priceRange;
    pills.push({
      key: "price",
      label: `${formatPrice(min, locale)} – ${formatPrice(max, locale)}`,
      onRemove: () => onChange({ ...filters, priceRange: null }),
    });
  }

  if (filters.minRating !== null) {
    pills.push({
      key: "rating",
      label: `${filters.minRating}★ ${locale === "bn" ? "ও তার বেশি" : "& up"}`,
      onRemove: () => onChange({ ...filters, minRating: null }),
    });
  }

  for (const hex of filters.colors) {
    const color = COLOR_LIST.find((c) => c.hex === hex);
    pills.push({
      key: `color-${hex}`,
      label: color?.name?.[locale] ?? hex,
      onRemove: () =>
        onChange({
          ...filters,
          colors: filters.colors.filter((c) => c !== hex),
        }),
    });
  }

  if (filters.inStockOnly) {
    pills.push({
      key: "in-stock",
      label: locale === "bn" ? "স্টকে আছে" : "In stock",
      onRemove: () => onChange({ ...filters, inStockOnly: false }),
    });
  }

  if (filters.onSaleOnly) {
    pills.push({
      key: "on-sale",
      label: locale === "bn" ? "ছাড়ে আছে" : "On sale",
      onRemove: () => onChange({ ...filters, onSaleOnly: false }),
    });
  }

  if (pills.length === 0) return null;

  const handleRemove = (key: string, onRemove: () => void) => {
    const el = nodeRefs.current.get(key);
    if (!el) {
      onRemove();
      return;
    }
    // Collapse the pill's width to 0 as it fades, so its neighbors slide
    // over into the freed space instead of the row just losing an item.
    gsap.to(el, {
      opacity: 0,
      scale: 0.85,
      width: 0,
      marginRight: 0,
      paddingLeft: 0,
      paddingRight: 0,
      duration: 0.22,
      ease: "power2.in",
      onComplete: onRemove,
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {pills.map((pill) => (
        <span
          key={pill.key}
          ref={(el) => {
            if (el) nodeRefs.current.set(pill.key, el);
            else nodeRefs.current.delete(pill.key);
          }}
          className="flex items-center gap-1.5 overflow-hidden whitespace-nowrap rounded-full bg-brand-navbar py-1.5 pl-3 pr-2 text-xs font-medium text-brand-text"
        >
          {pill.label}
          <button
            type="button"
            onClick={() => handleRemove(pill.key, pill.onRemove)}
            aria-label={locale === "bn" ? "ফিল্টার সরান" : "Remove filter"}
            className="grid h-4 w-4 place-items-center rounded-full text-brand-text-secondary hover:bg-brand-border"
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
    </div>
  );
}
