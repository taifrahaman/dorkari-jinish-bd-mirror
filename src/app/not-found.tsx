// src/app/not-found.tsx

import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Search } from "lucide-react";

import styles from "./not-found.module.css";

export const metadata: Metadata = {
  title: "Page not found | পৃষ্ঠা পাওয়া যায়নি",
};

/* Lives outside [locale], so there is no locale context here:
 * both languages are shown together. */
const BN_FONT = { fontFamily: "var(--font-body-bn)" } as const;
const BN_HEADING = { fontFamily: "var(--font-heading-bn)" } as const;

export default function NotFound() {
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
        <p aria-hidden className={styles.numeral}>
          404
        </p>

        <p className="mt-1 font-heading text-[13px] font-extrabold uppercase tracking-[0.16em] text-brand-teal">
          Error 404
        </p>

        <h1 className="mt-3 font-heading text-[clamp(2rem,6vw,3rem)] font-medium leading-[1.1] tracking-[-0.03em] text-brand-text">
          Page not found
        </h1>
        <p
          lang="bn"
          style={BN_HEADING}
          className="mt-1 text-xl leading-[1.5] text-brand-text/80 sm:text-2xl"
        >
          পৃষ্ঠাটি পাওয়া যায়নি
        </p>

        <p className="mt-4 max-w-md text-[15px] leading-relaxed text-brand-text-secondary sm:text-base">
          The link may be broken, or the page may have moved. Try a search, or
          head back to the shop.
        </p>
        <p
          lang="bn"
          style={BN_FONT}
          className="mt-1.5 max-w-md text-sm leading-relaxed text-brand-text-secondary/90 sm:text-[15px]"
        >
          লিংকটি ভুল হতে পারে অথবা পৃষ্ঠাটি সরে গেছে। খুঁজে দেখুন, অথবা দোকানে
          ফিরে যান।
        </p>

        {/* plain GET form: works with no JavaScript */}
        <form
          action="/shop"
          method="get"
          role="search"
          className="mt-8 flex w-full max-w-md items-center gap-2 rounded-full bg-brand-surface p-1.5 pl-5 shadow-[0_14px_32px_-18px_rgba(15,23,42,0.3)] ring-1 ring-brand-border transition-shadow duration-300 focus-within:ring-4 focus-within:ring-brand-accent/40"
        >
          <label htmlFor="nf-search" className="sr-only">
            Search products · পণ্য খুঁজুন
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
            placeholder="Search products · পণ্য খুঁজুন"
            className="min-w-0 flex-1 bg-transparent py-3 text-base text-brand-text outline-none placeholder:text-brand-text-secondary/70"
          />
          <button
            type="submit"
            aria-label="Search · খুঁজুন"
            className="grid h-11 w-11 flex-none place-items-center rounded-full bg-brand-accent text-brand-primary transition-transform duration-200 hover:scale-105 active:scale-95"
          >
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        <div className="mt-6 flex w-full max-w-md flex-col gap-3 sm:max-w-none sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-brand-primary px-6 text-sm font-semibold text-white transition duration-200 hover:bg-brand-primary-dark active:scale-95"
          >
            Back to home
            <span lang="bn" style={BN_FONT} className="font-medium opacity-75">
              · হোমে ফিরুন
            </span>
          </Link>

          <Link
            href="/shop"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-black/[0.08] bg-white/60 px-6 text-sm font-semibold text-brand-text shadow-[0_10px_24px_-14px_rgba(15,23,42,0.28)] backdrop-blur-md transition duration-200 hover:bg-brand-accent/30 active:scale-95"
          >
            Browse shop
            <span lang="bn" style={BN_FONT} className="font-medium opacity-75">
              · দোকান দেখুন
            </span>
          </Link>
        </div>
      </div>
    </main>
  );
}
