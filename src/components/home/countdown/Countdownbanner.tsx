// src/components/home/countdown/Countdownbanner.tsx

// src/components/home/countdown-banner/CountdownBanner.tsx

"use client";

import Image from "next/image";
import { useMemo, useSyncExternalStore } from "react";
import { ArrowRight } from "lucide-react";

import Button from "@/components/shared/Button";
import styles from "./CountdownBanner.module.css";

type Locale = "en" | "bn";

type LocalizedText = {
  en: string;
  bn: string;
};

export type CountdownBannerProps = {
  title: LocalizedText;
  description?: LocalizedText;
  ctaLabel: LocalizedText;
  ctaHref: string;
  /**
   * When the offer ends. Use an ISO string WITH a UTC offset so every
   * visitor sees the same deadline, e.g. "2026-10-15T23:59:59+06:00"
   * (Bangladesh time). A timestamp or Date also works.
   */
  endsAt: string | number | Date;
  /** Small line above the flap board. Has a default in both languages. */
  timerLabel?: LocalizedText;
  /** Optional product image, shown from 1280px up. */
  image?: { src: string; alt: LocalizedText };
  locale?: Locale;
  className?: string;
};

const DEFAULT_TIMER_LABEL: LocalizedText = {
  en: "Offer ends in",
  bn: "অফার শেষ হতে বাকি",
};

const UNITS = [
  { key: "days", label: { en: "Days", bn: "দিন" } },
  { key: "hours", label: { en: "Hours", bn: "ঘণ্টা" } },
  { key: "minutes", label: { en: "Minutes", bn: "মিনিট" } },
  { key: "seconds", label: { en: "Seconds", bn: "সেকেন্ড" } },
] as const;

type UnitKey = (typeof UNITS)[number]["key"];
type Parts = Record<UnitKey, number>;

/* ------------------------------------------------------------
   Decorative clock face (12 ticks, 4 of them longer at the
   cardinal points). Computed once at module load — it never
   depends on props or state.

   Coordinates are rounded to 3 decimals so the server and the
   browser always serialize the identical string. Math.cos/Math.sin
   can differ in their last bit between platforms; left unrounded,
   that turns into a hydration mismatch even though this array
   never changes at runtime.
   ------------------------------------------------------------ */

const round = (n: number) => Math.round(n * 1000) / 1000;

const CLOCK_TICKS = Array.from({ length: 12 }, (_, i) => {
  const angle = ((i * 30 - 90) * Math.PI) / 180;
  const isMajor = i % 3 === 0;
  const rOuter = 92;
  const rInner = isMajor ? 76 : 84;

  return {
    key: i,
    x1: round(100 + rOuter * Math.cos(angle)),
    y1: round(100 + rOuter * Math.sin(angle)),
    x2: round(100 + rInner * Math.cos(angle)),
    y2: round(100 + rInner * Math.sin(angle)),
  };
});

/* ------------------------------------------------------------
   Clock
   useSyncExternalStore gives us a hydration-safe "now": the server
   (and the first client render) see `null`, so both render the same
   "--" placeholders; the real time appears right after hydration.
   Ticking every 250ms keeps the seconds from drifting.
   ------------------------------------------------------------ */

function subscribe(onTick: () => void) {
  const id = window.setInterval(onTick, 250);
  return () => window.clearInterval(id);
}

const getNowSeconds = (): number | null => Math.floor(Date.now() / 1000);
const getServerNow = (): number | null => null;

/* ------------------------------------------------------------
   A single flap. Keying the text by its own value makes React
   remount the node whenever the digit changes, which restarts the
   CSS "flap" animation — no manual animation bookkeeping needed.
   ------------------------------------------------------------ */

function FlipDigit({ char }: { char: string }) {
  return (
    <span className={styles.flap}>
      <span key={char} className={styles.flapFace}>
        {char}
      </span>
    </span>
  );
}

export default function CountdownBanner({
  title,
  description,
  ctaLabel,
  ctaHref,
  endsAt,
  timerLabel = DEFAULT_TIMER_LABEL,
  image,
  locale = "en",
  className = "",
}: CountdownBannerProps) {
  const isBangla = locale === "bn";

  const end = useMemo(() => new Date(endsAt).getTime(), [endsAt]);
  const now = useSyncExternalStore<number | null>(
    subscribe,
    getNowSeconds,
    getServerNow,
  );

  // two digits minimum; Bengali numerals in Bangla
  const numberFormat = useMemo(
    () =>
      new Intl.NumberFormat(isBangla ? "bn-BD" : "en-BD", {
        minimumIntegerDigits: 2,
        useGrouping: false,
      }),
    [isBangla],
  );

  // an unreadable date can't count down to anything
  if (!Number.isFinite(end)) return null;

  const secondsLeft = now === null ? null : Math.floor(end / 1000) - now;

  // offer is over: take the banner away instead of showing 00 : 00 : 00 : 00
  if (secondsLeft !== null && secondsLeft <= 0) return null;

  const parts: Parts | null =
    secondsLeft === null
      ? null
      : {
          days: Math.floor(secondsLeft / 86400),
          hours: Math.floor((secondsLeft % 86400) / 3600),
          minutes: Math.floor((secondsLeft % 3600) / 60),
          seconds: secondsLeft % 60,
        };

  const srText = parts
    ? UNITS.map((u) => `${parts[u.key]} ${u.label[locale]}`).join(" ")
    : undefined;

  return (
    <section
      className={`${styles.section} w-full bg-brand-background py-8 sm:py-10 md:py-12 ${className}`}
    >
      <div className={styles.inner}>
        <div
          className={styles.banner}
          data-locale={locale}
          data-has-media={image ? "true" : "false"}
        >
          {/* ---------------- Ambience ---------------- */}
          <div className={styles.ambience} aria-hidden="true">
            <span className={styles.glowAmber} />
            <span className={styles.glowTeal} />

            <svg
              className={styles.clockMark}
              viewBox="0 0 200 200"
              focusable="false"
            >
              <circle cx="100" cy="100" r="92" />
              {CLOCK_TICKS.map((t) => (
                <line key={t.key} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} />
              ))}
            </svg>
          </div>

          {/* ---------------- Copy + CTA ---------------- */}
          <div className={styles.content}>
            <h2 className={styles.title}>{title[locale]}</h2>

            {description && (
              <p className={styles.description}>{description[locale]}</p>
            )}

            <Button
              href={ctaHref}
              trailingIcon={<ArrowRight className="h-4 w-4" />}
              bangla={isBangla}
            >
              {ctaLabel[locale]}
            </Button>
          </div>

          {/* ---------------- Countdown ---------------- */}
          <div className={styles.timer} role="timer" aria-live="off">
            <p className={styles.timerLabel}>{timerLabel[locale]}</p>

            <div className={styles.case}>
              {UNITS.flatMap((unit, i) => {
                const isSeconds = unit.key === "seconds";
                const digits = parts
                  ? numberFormat.format(parts[unit.key]).split("")
                  : ["-", "-"];

                const group = (
                  <div className={styles.unitGroup} key={`group-${unit.key}`}>
                    <span
                      className={styles.flapRow}
                      data-accent={isSeconds || undefined}
                    >
                      {digits.map((d, di) => (
                        <FlipDigit key={di} char={d} />
                      ))}
                    </span>

                    <span className={styles.unitLabel}>
                      {unit.label[locale]}
                    </span>
                  </div>
                );

                if (i === 0) return [group];

                return [
                  <span
                    key={`colon-${unit.key}`}
                    className={styles.colon}
                    aria-hidden="true"
                  >
                    :
                  </span>,
                  group,
                ];
              })}
            </div>

            {srText && <span className="sr-only">{srText}</span>}
          </div>

          {/* ---------------- Optional image ---------------- */}
          {image && (
            <div className={styles.media}>
              <Image
                src={image.src}
                alt={image.alt[locale]}
                fill
                sizes="240px"
                className={styles.mediaImg}
              />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
