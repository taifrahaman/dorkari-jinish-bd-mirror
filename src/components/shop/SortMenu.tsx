// src/components/shop/SortMenu.tsx

"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import gsap from "gsap";

import type { Locale, SortOption } from "@/lib/shop/types";

const OPTIONS: { value: SortOption; label: Record<Locale, string> }[] = [
  { value: "featured", label: { en: "Featured", bn: "ফিচার্ড" } },
  { value: "newest", label: { en: "Newest", bn: "নতুন" } },
  {
    value: "price-asc",
    label: { en: "Price: Low to High", bn: "মূল্য: কম থেকে বেশি" },
  },
  {
    value: "price-desc",
    label: { en: "Price: High to Low", bn: "মূল্য: বেশি থেকে কম" },
  },
  { value: "rating", label: { en: "Highest Rated", bn: "সর্বোচ্চ রেটিং" } },
  { value: "discount", label: { en: "Biggest Discount", bn: "সর্বোচ্চ ছাড়" } },
];

type SortMenuProps = {
  value: SortOption;
  onChange: (value: SortOption) => void;
  locale?: Locale;
};

export default function SortMenu({
  value,
  onChange,
  locale = "en",
}: SortMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const current = OPTIONS.find((o) => o.value === value) ?? OPTIONS[0];

  useEffect(() => {
    if (!open) return;

    function handleClickOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  useEffect(() => {
    const el = menuRef.current;
    if (!el) return;
    if (open) {
      gsap.fromTo(
        el,
        { opacity: 0, y: -6, scale: 0.98 },
        { opacity: 1, y: 0, scale: 1, duration: 0.18, ease: "power2.out" },
      );
    }
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex min-h-11 items-center gap-2 rounded-full bg-brand-surface px-4 text-sm font-medium text-brand-text ring-1 ring-brand-border transition-all duration-300 hover:ring-brand-primary active:scale-95"
      >
        <span className="sm:hidden">{locale === "bn" ? "সাজান" : "Sort"}</span>
        <span className="hidden sm:inline">{current.label[locale]}</span>
        <ChevronDown
          className={`h-4 w-4 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          ref={menuRef}
          role="listbox"
          className="absolute right-0 top-[calc(100%+8px)] z-40 w-52 overflow-hidden rounded-2xl border border-brand-border bg-brand-surface py-1.5 shadow-[0_12px_28px_-12px_rgba(23,38,66,0.28)]"
        >
          {OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={option.value === value}
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
              className="flex w-full items-center justify-between gap-2 px-3.5 py-2 text-left text-xs text-brand-text hover:bg-brand-navbar"
            >
              {option.label[locale]}
              {option.value === value && (
                <Check className="h-3.5 w-3.5 text-brand-primary" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
