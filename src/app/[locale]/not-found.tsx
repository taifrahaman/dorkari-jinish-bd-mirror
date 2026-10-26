// src/app/[locale]/not-found.tsx

"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Search, Store } from "lucide-react";

import styles from "../not-found.module.css";

const COPY = {
  en: {
    numeral: "404",
    eyebrow: "Error 404",
    title: "Page not found",
    body: "The link may be broken, or the page may have moved. Try a search, or head back to the shop.",
    placeholder: "Search products…",
    searchLabel: "Search products",
    submit: "Search",
    home: "Back to home",
    shop: "Browse shop",
  },
  bn: {
    numeral: "৪০৪",
    eyebrow: "ত্রুটি ৪০৪",
    title: "পেজটি পাওয়া যায়নি",
    body: "লিংকটি ভুল হতে পারে অথবা পেজটি সরে গেছে। খুঁজে দেখুন, অথবা দোকানে ফিরে যান।",
    placeholder: "পণ্য খুঁজুন…",
    searchLabel: "পণ্য খুঁজুন",
    submit: "খুঁজুন",
    home: "হোম পেজে ফিরে যান",
    shop: "দোকান দেখুন",
  },
} as const;

export default function LocaleNotFound() {
  const params = useParams();
  const locale = params?.locale === "bn" ? "bn" : "en";
  const isBn = locale === "bn";
  const t = COPY[locale];

  return (
    <main className={styles.root}>
      <div className={styles.glow} aria-hidden />

      {/* a lamp whose bulb is on the blink */}
      <div className={styles.lamp} aria-hidden>
        <svg className={styles.lampSvg} viewBox="0 0 120 190" focusable="false">
          <line x1="60" y1="0" x2="60" y2="62" className={styles.stroke} />
          <rect
            x="54"
            y="58"
            width="12"
            height="12"
            rx="3"
            className={styles.stroke}
          />
          <path
            d="M26 122 C26 86 44 70 60 70 C76 70 94 86 94 122 Z"
            className={`${styles.stroke} ${styles.shade}`}
          />
          <path
            d="M26 122 C26 86 44 70 60 70 C76 70 94 86 94 122 Z"
            className={styles.shadeOn}
          />
          <circle cx="60" cy="128" r="9" className={styles.bulbOff} />
          <circle cx="60" cy="128" r="9" className={styles.bulbOn} />
        </svg>
      </div>

      <div className={styles.content}>
        <p
          aria-hidden
          className={styles.numeral}
          style={
            isBn
              ? {
                  fontFamily: "var(--font-heading-bn)",
                  lineHeight: 1.35,
                  letterSpacing: 0,
                }
              : undefined
          }
        >
          {t.numeral}
        </p>

        <p
          className={`mt-1 font-heading font-extrabold text-brand-teal ${
            isBn
              ? "text-sm tracking-[0.04em]"
              : "text-[13px] uppercase tracking-[0.16em]"
          }`}
        >
          {t.eyebrow}
        </p>

        <h1
          className={`mt-3 font-heading text-[clamp(2rem,6vw,3rem)] font-medium text-brand-text ${
            isBn
              ? "leading-[1.4] tracking-normal"
              : "leading-[1.1] tracking-[-0.03em]"
          }`}
        >
          {t.title}
        </h1>

        <p
          className={`mt-4 max-w-md text-[15px] leading-relaxed text-brand-text-secondary sm:text-base ${
            isBn ? "tracking-normal" : ""
          }`}
        >
          {t.body}
        </p>

        {/* plain GET form: lands on the shop with ?q= already applied */}
        <form
          action={`/${locale}/shop`}
          method="get"
          role="search"
          className="mt-8 flex w-full max-w-md items-center gap-2 rounded-full bg-brand-surface p-1.5 pl-5 shadow-[0_14px_32px_-18px_rgba(15,23,42,0.3)] ring-1 ring-brand-border transition-shadow duration-300 focus-within:ring-4 focus-within:ring-brand-accent/40"
        >
          <label htmlFor="nf-search" className="sr-only">
            {t.searchLabel}
          </label>
          <Search
            className="h-5 w-5 flex-none text-brand-text-secondary"
            aria-hidden
          />
          <input
            id="nf-search"
            name="q"
            type="text"
            inputMode="search"
            enterKeyHint="search"
            autoComplete="off"
            placeholder={t.placeholder}
            className="min-w-0 flex-1 bg-transparent py-3 text-base text-brand-text outline-none placeholder:text-brand-text-secondary/70"
          />
          <button
            type="submit"
            aria-label={t.submit}
            className="grid h-11 w-11 flex-none place-items-center rounded-full bg-brand-accent text-brand-primary transition-transform duration-200 hover:scale-105 active:scale-95"
          >
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        <div className="mt-6 flex w-full max-w-md flex-col gap-3 sm:max-w-none sm:flex-row sm:justify-center">
          <Link
            href={`/${locale}`}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-brand-primary px-6 text-sm font-semibold text-white transition duration-200 hover:bg-brand-primary-dark active:scale-95"
          >
            {t.home}
          </Link>

          <Link
            href={`/${locale}/shop`}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-black/[0.08] bg-white/60 px-6 text-sm font-semibold text-brand-text shadow-[0_10px_24px_-14px_rgba(15,23,42,0.28)] backdrop-blur-md transition duration-200 hover:bg-brand-accent/30 active:scale-95"
          >
            <Store className="h-4 w-4" />
            {t.shop}
          </Link>
        </div>
      </div>
    </main>
  );
}
