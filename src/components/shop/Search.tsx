// src/components/shop/Search.tsx

"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ArrowRight, Search, X } from "lucide-react";

import type { Locale } from "@/lib/shop/types";

type HeroSearchProps = {
  locale?: Locale;
  /** Controlled value. Omit to let the component manage its own state. */
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  onSubmit?: (value: string) => void;
  suggestions?: string[];
  placeholder?: string;
  variant?: "onLight" | "onDark";
  className?: string;
};

const COPY = {
  placeholder: {
    en: "Search rice cookers, refrigerators, brands…",
    bn: "রাইস কুকার, ফ্রিজ বা ব্র্যান্ড খুঁজুন…",
  },
  label: { en: "Search products", bn: "পণ্য খুঁজুন" },
  clear: { en: "Clear search", bn: "সার্চ মুছুন" },
  submit: { en: "Search", bn: "খুঁজুন" },
  popular: { en: "Popular", bn: "জনপ্রিয়" },
};

const CHIP = {
  onLight:
    "bg-brand-surface text-brand-text ring-1 ring-brand-border hover:ring-brand-accent",
  onDark:
    "bg-white/10 text-white ring-1 ring-white/15 hover:bg-white/15 hover:ring-brand-accent",
};

export default function ShopSearch({
  locale = "en",
  value,
  defaultValue = "",
  onChange,
  onSubmit,
  suggestions = [],
  placeholder,
  variant = "onLight",
  className = "",
}: HeroSearchProps) {
  const [inner, setInner] = useState(defaultValue);
  const current = value ?? inner;
  const inputRef = useRef<HTMLInputElement>(null);
  const id = useId();

  const update = (next: string) => {
    setInner(next);
    onChange?.(next);
  };

  // Press "/" anywhere to jump into search.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (
        t &&
        (t.tagName === "INPUT" ||
          t.tagName === "TEXTAREA" ||
          t.isContentEditable)
      )
        return;
      e.preventDefault();
      inputRef.current?.focus();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className={className}>
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit?.(current.trim());
        }}
        className="flex items-center gap-2 rounded-full bg-brand-surface p-1.5 pl-5 shadow-[0_18px_40px_-18px_rgba(0,0,0,0.45)] ring-1 ring-brand-border transition-shadow duration-300 focus-within:ring-4 focus-within:ring-brand-accent/40"
      >
        <label htmlFor={id} className="sr-only">
          {COPY.label[locale]}
        </label>
        <Search
          className="h-5 w-5 flex-none text-brand-text-secondary"
          aria-hidden
        />

        <input
          id={id}
          ref={inputRef}
          type="text"
          inputMode="search"
          enterKeyHint="search"
          autoComplete="off"
          value={current}
          onChange={(e) => update(e.target.value)}
          onKeyDown={(e) => {
            if (e.key !== "Escape") return;
            if (current) update("");
            else inputRef.current?.blur();
          }}
          placeholder={placeholder ?? COPY.placeholder[locale]}
          className="min-w-0 flex-1 bg-transparent py-3 text-base text-brand-text outline-none placeholder:text-brand-text-secondary/70"
        />

        {current ? (
          <button
            type="button"
            onClick={() => {
              update("");
              inputRef.current?.focus();
            }}
            aria-label={COPY.clear[locale]}
            className="grid h-9 w-9 flex-none place-items-center rounded-full text-brand-text-secondary transition-colors hover:bg-brand-navbar"
          >
            <X className="h-4 w-4" />
          </button>
        ) : (
          <kbd className="mr-1 hidden h-6 min-w-6 place-items-center rounded-md border border-brand-border px-1.5 text-[11px] font-medium text-brand-text-secondary sm:grid">
            /
          </kbd>
        )}

        <button
          type="submit"
          aria-label={COPY.submit[locale]}
          className="inline-flex h-11 min-w-11 flex-none items-center justify-center gap-2 rounded-full bg-brand-accent px-3 text-brand-primary transition-transform duration-200 hover:scale-105 active:scale-95 sm:px-5"
        >
          <span className="hidden text-sm font-semibold sm:inline">
            {COPY.submit[locale]}
          </span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </form>

      {suggestions.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span
            className={`text-xs font-medium ${
              variant === "onDark"
                ? "text-white/60"
                : "text-brand-text-secondary"
            }`}
          >
            {COPY.popular[locale]}
          </span>
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                update(s);
                onSubmit?.(s);
              }}
              className={`min-h-10 rounded-full px-3.5 text-sm font-medium transition-colors active:scale-95 ${CHIP[variant]}`}
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
