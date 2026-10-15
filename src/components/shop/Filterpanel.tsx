// src/components/shop/Filterpanel.tsx

"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, X } from "lucide-react";
import gsap from "gsap";

import styles from "./FilterPanel.module.css";
import type {
  CategoryFacetNode,
  ColorFacet,
  Facet,
  FilterState,
  Locale,
  PriceRange,
} from "@/lib/shop/types";

type FilterPanelProps = {
  open: boolean;
  onClose: () => void;
  locale?: Locale;
  filters: FilterState;
  onChange: (next: FilterState) => void;
  onClear: () => void;
  categoryFacets: CategoryFacetNode[];
  brandFacets: Facet[];
  colorFacets: ColorFacet[];
  resultCount: number;
  priceMax: number;
};

const COPY = {
  title: { en: "Filters", bn: "ফিল্টার" },
  category: { en: "Category", bn: "ক্যাটাগরি" },
  brand: { en: "Brand", bn: "ব্র্যান্ড" },
  price: { en: "Price", bn: "মূল্য" },
  rating: { en: "Rating", bn: "রেটিং" },
  color: { en: "Color", bn: "রং" },
  availability: { en: "Availability", bn: "প্রাপ্যতা" },
  inStock: { en: "In stock only", bn: "শুধু স্টকে আছে" },
  onSale: { en: "On sale", bn: "ছাড়ে আছে" },
  clearAll: { en: "Clear all", bn: "সব মুছুন" },
  showResults: { en: "Show", bn: "দেখুন" },
  results: { en: "results", bn: "পণ্য" },
  andUp: { en: "& up", bn: "ও তার বেশি" },
};

function toggleValue(list: string[], value: string): string[] {
  return list.includes(value)
    ? list.filter((v) => v !== value)
    : [...list, value];
}

/* ------------------------------------------------------------------ */
/* Accordion section                                                    */
/* ------------------------------------------------------------------ */

function FilterSection({
  title,
  defaultOpen = false,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const contentRef = useRef<HTMLDivElement>(null);
  const mounted = useRef(false);

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;

    if (!mounted.current) {
      gsap.set(el, { height: open ? "auto" : 0 });
      mounted.current = true;
      return;
    }

    gsap.to(el, {
      height: open ? "auto" : 0,
      duration: 0.32,
      ease: "power2.out",
    });
  }, [open]);

  return (
    <div className={styles.section}>
      <button
        type="button"
        className={styles.sectionTrigger}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span className="text-sm font-semibold text-brand-text">{title}</span>

        <ChevronDown
          className={`h-4 w-4 text-brand-text-secondary transition-transform duration-300 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      <div ref={contentRef} className={styles.sectionContent}>
        <div className={styles.sectionInner}>{children}</div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Category tree node — parent / child linked checkboxes               */
/*                                                                     */
/* Semantics:                                                          */
/*   - Clicking a parent selects / deselects the whole subtree by      */
/*     storing the parent slug in filters.categories.                  */
/*   - Children render as checked while the parent is selected.        */
/*   - Clicking a child while the parent is selected "materializes":   */
/*     the parent slug is removed and every other child is added       */
/*     explicitly, so only the clicked child ends up unchecked.        */
/*   - Selecting every child individually shows the parent as checked. */
/*   - Selecting some children shows the parent as indeterminate.      */
/* ------------------------------------------------------------------ */

function CategoryTreeNode({
  node,
  filters,
  locale,
  onChange,
}: {
  node: CategoryFacetNode;
  filters: FilterState;
  locale: Locale;
  onChange: (next: FilterState) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const parentRef = useRef<HTMLInputElement>(null);

  const childSlugs = node.children?.map((c) => c.value) ?? [];
  const hasChildren = childSlugs.length > 0;

  const parentSelected = filters.categories.includes(node.value);
  const selectedChildCount = childSlugs.filter((s) =>
    filters.categories.includes(s),
  ).length;
  const allChildrenSelected =
    hasChildren && selectedChildCount === childSlugs.length;
  const someChildrenSelected = selectedChildCount > 0 && !allChildrenSelected;

  const parentChecked = parentSelected || allChildrenSelected;
  const parentIndeterminate = !parentSelected && someChildrenSelected;

  // `indeterminate` is a DOM-only property — must be set via ref.
  useEffect(() => {
    if (parentRef.current) {
      parentRef.current.indeterminate = parentIndeterminate;
    }
  }, [parentIndeterminate]);

  const handleParentToggle = () => {
    // Unchecking (or was-checked-via-children): clear parent and every child.
    if (parentSelected || allChildrenSelected) {
      return onChange({
        ...filters,
        categories: filters.categories.filter(
          (v) => v !== node.value && !childSlugs.includes(v),
        ),
      });
    }

    // Checking: store parent slug, drop any explicit child slugs so the
    // two representations can't coexist.
    return onChange({
      ...filters,
      categories: [
        ...filters.categories.filter((v) => !childSlugs.includes(v)),
        node.value,
      ],
    });
  };

  const handleChildToggle = (childValue: string) => {
    // Parent is selected → user is trying to uncheck a child that was
    // only "checked" because of the parent. Materialize the parent into
    // explicit children, minus the one just clicked.
    if (parentSelected) {
      const otherChildren = childSlugs.filter((v) => v !== childValue);
      return onChange({
        ...filters,
        categories: [
          ...filters.categories.filter((v) => v !== node.value),
          ...otherChildren,
        ],
      });
    }

    // Normal child toggle.
    return onChange({
      ...filters,
      categories: toggleValue(filters.categories, childValue),
    });
  };

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between gap-2">
        <label className="flex flex-1 cursor-pointer items-center gap-2.5 text-sm text-brand-text">
          <input
            ref={parentRef}
            type="checkbox"
            checked={parentChecked}
            onChange={handleParentToggle}
            className="h-4 w-4 rounded border-brand-border accent-brand-primary"
          />
          <span className="font-medium">{node.label[locale]}</span>
        </label>

        <div className="flex items-center gap-1.5">
          <span className="text-xs text-brand-text-secondary">
            {node.count}
          </span>

          {hasChildren && (
            <button
              type="button"
              onClick={() => setExpanded((e) => !e)}
              aria-label={
                expanded
                  ? locale === "bn"
                    ? "সংকুচিত করুন"
                    : "Collapse"
                  : locale === "bn"
                    ? "প্রসারিত করুন"
                    : "Expand"
              }
              aria-expanded={expanded}
              className="grid h-6 w-6 place-items-center rounded-full text-brand-text-secondary hover:bg-brand-navbar"
            >
              <ChevronDown
                className={`h-3.5 w-3.5 transition-transform duration-200 ${
                  expanded ? "rotate-180" : ""
                }`}
              />
            </button>
          )}
        </div>
      </div>

      {hasChildren && expanded && (
        <div className="ml-6 flex flex-col gap-2 border-l border-brand-border pl-3">
          {node.children!.map((child) => {
            // While the parent is selected, every child displays as
            // checked even though only the parent slug is stored.
            const isChecked =
              parentSelected || filters.categories.includes(child.value);

            return (
              <label
                key={child.value}
                className="flex cursor-pointer items-center justify-between gap-3 text-sm text-brand-text"
              >
                <span className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => handleChildToggle(child.value)}
                    className="h-4 w-4 rounded border-brand-border accent-brand-primary"
                  />
                  {child.label[locale]}
                </span>
                <span className="text-xs text-brand-text-secondary">
                  {child.count}
                </span>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Panel                                                               */
/* ------------------------------------------------------------------ */

export default function FilterPanel({
  open,
  onClose,
  locale = "en",
  filters,
  onChange,
  onClear,
  categoryFacets,
  brandFacets,
  colorFacets,
  resultCount,
  priceMax,
}: FilterPanelProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const [mountedInDom, setMountedInDom] = useState(open);

  const pricePresets: { label: string; range: PriceRange }[] = [
    {
      label: locale === "bn" ? "৳১০,০০০ এর নিচে" : "Under ৳10,000",
      range: [0, 10000],
    },
    {
      label: locale === "bn" ? "৳১০,০০০ – ৩০,০০০" : "৳10,000 – 30,000",
      range: [10000, 30000],
    },
    {
      label: locale === "bn" ? "৳৩০,০০০ – ৬০,০০০" : "৳30,000 – 60,000",
      range: [30000, 60000],
    },
    {
      label: locale === "bn" ? "৳৬০,০০০ এর বেশি" : "Over ৳60,000",
      range: [60000, priceMax],
    },
  ];

  useEffect(() => {
    if (!open) return;

    const frame = window.requestAnimationFrame(() => {
      setMountedInDom(true);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [open]);

  useEffect(() => {
    if (!mountedInDom) return;

    const overlay = overlayRef.current;
    const panel = panelRef.current;

    if (!overlay || !panel) return;

    const isMobile = window.matchMedia("(max-width: 640px)").matches;
    const from = isMobile ? { yPercent: 100 } : { xPercent: 100 };

    if (open) {
      gsap.set(overlay, { opacity: 0 });
      gsap.set(panel, from);

      gsap.to(overlay, {
        opacity: 1,
        duration: 0.25,
        ease: "power1.out",
      });

      gsap.to(panel, {
        xPercent: 0,
        yPercent: 0,
        duration: 0.38,
        ease: "power3.out",
      });
    } else {
      gsap.to(overlay, {
        opacity: 0,
        duration: 0.2,
        ease: "power1.in",
      });

      gsap.to(panel, {
        ...from,
        duration: 0.3,
        ease: "power2.in",
        onComplete: () => setMountedInDom(false),
      });
    }
  }, [open, mountedInDom]);

  if (!mountedInDom) return null;

  return (
    <>
      <div
        ref={overlayRef}
        className={styles.overlay}
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        ref={panelRef}
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-label={COPY.title[locale]}
      >
        <div className={styles.grabber} />

        <div className={styles.header}>
          <h2 className="font-heading text-lg font-bold text-brand-text">
            {COPY.title[locale]}
          </h2>

          <button
            type="button"
            onClick={onClose}
            aria-label={locale === "bn" ? "বন্ধ করুন" : "Close"}
            className="grid h-8 w-8 place-items-center rounded-full text-brand-text-secondary hover:bg-brand-navbar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className={styles.body}>
          <FilterSection title={COPY.category[locale]} defaultOpen>
            <div className="flex flex-col gap-3">
              {categoryFacets.map((node) => (
                <CategoryTreeNode
                  key={node.value}
                  node={node}
                  filters={filters}
                  locale={locale}
                  onChange={onChange}
                />
              ))}
            </div>
          </FilterSection>

          <FilterSection title={COPY.brand[locale]}>
            <div className="flex max-h-48 flex-col gap-2.5 overflow-y-auto pr-1">
              {brandFacets.map((facet) => (
                <label
                  key={facet.value}
                  className="flex cursor-pointer items-center justify-between gap-3 text-sm text-brand-text"
                >
                  <span className="flex items-center gap-2.5">
                    <input
                      type="checkbox"
                      checked={filters.brands.includes(facet.value)}
                      onChange={() =>
                        onChange({
                          ...filters,
                          brands: toggleValue(filters.brands, facet.value),
                        })
                      }
                      className="h-4 w-4 rounded border-brand-border accent-brand-primary"
                    />

                    {facet.label[locale]}
                  </span>

                  <span className="text-xs text-brand-text-secondary">
                    {facet.count}
                  </span>
                </label>
              ))}
            </div>
          </FilterSection>

          <FilterSection title={COPY.price[locale]}>
            <div className="flex flex-wrap gap-2">
              {pricePresets.map((preset) => {
                const active =
                  filters.priceRange?.[0] === preset.range[0] &&
                  filters.priceRange?.[1] === preset.range[1];

                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() =>
                      onChange({
                        ...filters,
                        priceRange: active ? null : preset.range,
                      })
                    }
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                      active
                        ? "border-brand-primary bg-brand-primary text-white"
                        : "border-brand-border text-brand-text hover:bg-brand-navbar"
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
          </FilterSection>

          <FilterSection title={COPY.rating[locale]}>
            <div className="flex flex-col gap-2">
              {[4, 3].map((threshold) => (
                <label
                  key={threshold}
                  className="flex cursor-pointer items-center gap-2.5 text-sm text-brand-text"
                >
                  <input
                    type="radio"
                    name="min-rating"
                    checked={filters.minRating === threshold}
                    onChange={() =>
                      onChange({
                        ...filters,
                        minRating:
                          filters.minRating === threshold ? null : threshold,
                      })
                    }
                    className="h-4 w-4 accent-brand-primary"
                  />
                  {threshold}★ {COPY.andUp[locale]}
                </label>
              ))}
            </div>
          </FilterSection>

          <FilterSection title={COPY.color[locale]}>
            <div className="flex flex-wrap gap-3">
              {colorFacets.map((color) => {
                const active = filters.colors.includes(color.hex);

                return (
                  <button
                    key={color.hex}
                    type="button"
                    aria-label={color.name?.[locale] ?? color.hex}
                    aria-pressed={active}
                    onClick={() =>
                      onChange({
                        ...filters,
                        colors: toggleValue(filters.colors, color.hex),
                      })
                    }
                    className="grid h-8 w-8 place-items-center rounded-full"
                    style={{
                      outline: active
                        ? "2px solid var(--color-brand-primary)"
                        : "none",
                      outlineOffset: 2,
                    }}
                  >
                    <span
                      className="h-6 w-6 rounded-full shadow-[inset_0_0_0_1px_rgba(0,0,0,0.14)]"
                      style={{
                        backgroundColor: color.hex,
                      }}
                    />
                  </button>
                );
              })}
            </div>
          </FilterSection>

          <FilterSection title={COPY.availability[locale]}>
            <div className="flex flex-col gap-2.5">
              <label className="flex cursor-pointer items-center gap-2.5 text-sm text-brand-text">
                <input
                  type="checkbox"
                  checked={filters.inStockOnly}
                  onChange={() =>
                    onChange({
                      ...filters,
                      inStockOnly: !filters.inStockOnly,
                    })
                  }
                  className="h-4 w-4 rounded border-brand-border accent-brand-primary"
                />

                {COPY.inStock[locale]}
              </label>

              <label className="flex cursor-pointer items-center gap-2.5 text-sm text-brand-text">
                <input
                  type="checkbox"
                  checked={filters.onSaleOnly}
                  onChange={() =>
                    onChange({
                      ...filters,
                      onSaleOnly: !filters.onSaleOnly,
                    })
                  }
                  className="h-4 w-4 rounded border-brand-border accent-brand-primary"
                />

                {COPY.onSale[locale]}
              </label>
            </div>
          </FilterSection>
        </div>

        <div className={styles.footer}>
          <button
            type="button"
            onClick={onClear}
            className="flex-1 rounded-full border border-brand-border py-2.5 text-sm font-medium text-brand-text hover:bg-brand-navbar"
          >
            {COPY.clearAll[locale]}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="flex-[2] rounded-full bg-brand-primary py-2.5 text-sm font-semibold text-white hover:bg-brand-primary-dark"
          >
            {COPY.showResults[locale]} ({resultCount} {COPY.results[locale]})
          </button>
        </div>
      </div>
    </>
  );
}
