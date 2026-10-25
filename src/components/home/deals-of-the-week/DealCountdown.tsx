// src/components/home/deals-of-the-week/DealCountdown.tsx

"use client";

import { useEffect, useState } from "react";

type Locale = "en" | "bn";

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export default function DealCountdown({
  endsAt,
  locale,
}: {
  /** ISO date string (or anything `new Date()` accepts). */
  endsAt: string;
  locale: Locale;
}) {
  // null until mounted, so server and client markup always match.
  const [left, setLeft] = useState<number | null>(null);

  useEffect(() => {
    const end = new Date(endsAt).getTime();
    if (Number.isNaN(end)) return;

    const tick = () => setLeft(Math.max(0, end - Date.now()));
    tick();

    const id = window.setInterval(tick, 30_000);
    return () => window.clearInterval(id);
  }, [endsAt]);

  if (left === null || left <= 0) return null;

  const nf = new Intl.NumberFormat(locale === "bn" ? "bn-BD" : "en-US");
  const days = Math.floor(left / DAY);
  const hours = Math.floor((left % DAY) / HOUR);
  const mins = Math.floor((left % HOUR) / MINUTE);

  const text =
    locale === "bn"
      ? [
          days > 0 ? `${nf.format(days)} দিন` : null,
          `${nf.format(hours)} ঘণ্টা`,
          `${nf.format(mins)} মিনিট`,
          "বাকি",
        ]
          .filter(Boolean)
          .join(" ")
      : `Ends in ${[
          days > 0 ? `${nf.format(days)}d` : null,
          `${nf.format(hours)}h`,
          `${nf.format(mins)}m`,
        ]
          .filter(Boolean)
          .join(" ")}`;

  return (
    <p className="inline-flex items-center gap-2 self-start rounded-full border border-black/[0.08] bg-white/60 px-3.5 py-1.5 text-[13px] font-semibold text-brand-text shadow-[0_10px_24px_-14px_rgba(15,23,42,0.28)] backdrop-blur-md sm:self-auto">
      <span
        aria-hidden
        className="h-2 w-2 rounded-full bg-brand-accent shadow-[0_0_6px_rgba(251,167,5,0.8)] motion-safe:animate-pulse"
      />
      {text}
    </p>
  );
}
