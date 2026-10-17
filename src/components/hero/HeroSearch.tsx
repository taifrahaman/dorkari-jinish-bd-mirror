// src/components/hero/HeroSearch.tsx

"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { ChevronDown, Check, Search } from "lucide-react";

import type { CategoryNode } from "@/components/navigation/navItems";
import {
  heroSearchPlaceholder,
  heroFilterAllLabel,
  type SupportedLocale,
} from "./messages";
import styles from "./HeroSearch.module.css";

type FilterOption = { id: string; label: string };

type Props = {
  categories: CategoryNode[];
};

export default function HeroSearch({ categories }: Props) {
  const router = useRouter();
  const locale = useLocale() as SupportedLocale;

  const placeholder = heroSearchPlaceholder[locale] ?? heroSearchPlaceholder.en;
  const allLabel = heroFilterAllLabel[locale] ?? heroFilterAllLabel.en;

  /** Filter list — All + top-level categories */
  const filterOptions: FilterOption[] = [
    { id: "all", label: allLabel },
    ...categories.map((c) => ({ id: c.slug, label: c.label })),
  ];

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected =
    filterOptions.find((o) => o.id === category) ?? filterOptions[0];

  // Close dropdown on Escape or outside click
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDoc);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDoc);
    };
  }, [open]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (category !== "all") params.set("c", category);
    router.push(`/${locale}/search${params.toString() ? `?${params}` : ""}`);
  };

  const pick = (id: string) => {
    setCategory(id);
    setOpen(false);
    inputRef.current?.focus();
  };

  return (
    <form className={styles.root} onSubmit={submit} role="search">
      <div className={styles.bar}>
        <div className={styles.filterWrap} ref={wrapRef}>
          <button
            type="button"
            className={styles.filter}
            data-open={open}
            onClick={() => setOpen((v) => !v)}
            aria-haspopup="listbox"
            aria-expanded={open}
          >
            <span className={styles.filterLabel}>{selected.label}</span>
            <ChevronDown size={14} className={styles.chev} />
          </button>

          {/* 
            Notice we added `bg-brand-surface shadow-xl border border-brand-border` 
            to force a solid background and remove the blur 
          */}
          <div
            className={`${styles.panel} bg-brand-surface shadow-xl border border-brand-border`}
            data-open={open}
            role="listbox"
            style={{ backdropFilter: "none", WebkitBackdropFilter: "none" }}
          >
            <ul className={styles.panelList}>
              {filterOptions.map((opt) => (
                <li key={opt.id}>
                  <button
                    type="button"
                    className={styles.panelItem}
                    data-active={opt.id === category}
                    onClick={() => pick(opt.id)}
                    role="option"
                    aria-selected={opt.id === category}
                  >
                    <span>{opt.label}</span>
                    <Check size={14} className={styles.panelCheck} />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <span className={styles.divider} aria-hidden />

        <input
          ref={inputRef}
          type="search"
          className={styles.input}
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label={placeholder}
        />

        <button type="submit" className={styles.submit} aria-label="Search">
          <Search size={20} strokeWidth={2.4} />
        </button>
      </div>
    </form>
  );
}
