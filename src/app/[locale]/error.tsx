// src/app/[locale]/error.tsx

"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Home, RotateCcw, Store } from "lucide-react";

import styles from "../not-found.module.css";

const COPY = {
  en: {
    numeral: "Oops",
    eyebrow: "Something broke",
    title: "Something went wrong",
    body: "An error occurred while loading this page. It's not you, it's us. Please try again.",
    retry: "Try again",
    home: "Go home",
    shop: "Browse shop",
    ref: "Reference",
  },
  bn: {
    numeral: "ইশ",
    eyebrow: "কিছু একটা গোলমাল",
    title: "কিছু একটা ভুল হয়েছে",
    body: "পেজটি লোড করার সময় একটি ত্রুটি ঘটেছে। সমস্যাটি আমাদের দিকে, অনুগ্রহ করে আবার চেষ্টা করুন।",
    retry: "আবার চেষ্টা করুন",
    home: "হোম পেজে যান",
    shop: "দোকান দেখুন",
    ref: "রেফারেন্স",
  },
} as const;

/** A warmer, redder light than the amber 404 lamp. */
const ERROR_RGB = "239,98,72";

export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const params = useParams();
  const locale = params?.locale === "bn" ? "bn" : "en";
  const isBn = locale === "bn";
  const t = COPY[locale];

  useEffect(() => {
    // Log to your error tracking service (Sentry, etc.) here
    console.error("[locale-error]", error);
  }, [error]);

  return (
    <main
      className={styles.root}
      style={{ "--rgb": ERROR_RGB } as React.CSSProperties}
    >
      <div className={styles.glow} aria-hidden />

      {/* same lamp as the 404, with a bulb that's about to give up */}
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
          role="alert"
          className={`mt-4 max-w-md text-[15px] leading-relaxed text-brand-text-secondary sm:text-base ${
            isBn ? "tracking-normal" : ""
          }`}
        >
          {t.body}
        </p>

        {error.digest && (
          <p className="mt-4 inline-flex items-center gap-2 rounded-full border border-black/[0.08] bg-white/60 px-3.5 py-1.5 text-xs text-brand-text-secondary shadow-[0_10px_24px_-14px_rgba(15,23,42,0.28)] backdrop-blur-md">
            <span className={isBn ? "" : "uppercase tracking-[0.12em]"}>
              {t.ref}
            </span>
            <code className="font-mono font-semibold text-brand-text">
              {error.digest}
            </code>
          </p>
        )}

        {/* the real message, development only */}
        {process.env.NODE_ENV === "development" && error.message && (
          <pre className="mt-5 max-h-40 w-full max-w-md overflow-auto rounded-2xl border border-destructive/20 bg-destructive/5 p-4 text-left text-xs leading-relaxed text-destructive">
            {error.message}
          </pre>
        )}

        <div className="mt-8 flex w-full max-w-xs flex-col gap-3 sm:max-w-none sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={() => reset()}
            className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-brand-primary px-6 text-sm font-semibold text-white transition duration-200 hover:bg-brand-primary-dark active:scale-95"
          >
            <RotateCcw className="h-4 w-4 transition-transform duration-300 group-hover:-rotate-90" />
            {t.retry}
          </button>

          <Link
            href={`/${locale}`}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-black/[0.08] bg-white/60 px-6 text-sm font-semibold text-brand-text shadow-[0_10px_24px_-14px_rgba(15,23,42,0.28)] backdrop-blur-md transition duration-200 hover:bg-brand-accent/30 active:scale-95"
          >
            <Home className="h-4 w-4" />
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
