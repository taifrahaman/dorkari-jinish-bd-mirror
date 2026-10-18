// src/components/shop/PriceRangeFilter.tsx

"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { formatPrice } from "@/lib/shop/filter-utils";
import type { Locale, PriceRange } from "@/lib/shop/types";
import styles from "./PriceRangeFilter.module.css";

/** Slider resolution (positions 0..RES map to prices through a curve). */
const RES = 1000;
/** >1 gives the cheap end more room, because most products are cheap. */
const GAMMA = 2;
/** Closest the two handles may get (slider units). */
const MIN_GAP = 8;
const BUCKETS = 28;

const BN_DIGITS = "০১২৩৪৫৬৭৮৯";

const clamp = (n: number, a: number, b: number) => Math.min(b, Math.max(a, n));

/** Round to a "nice" price: ৳10 steps under 1k, ৳50 under 5k, ৳100 above. */
function snap(p: number) {
  const step = p < 1000 ? 10 : p < 5000 ? 50 : 100;
  return Math.round(p / step) * step;
}

type Props = {
  /** Every product price in the catalog (bounds + histogram are derived from it). */
  prices: number[];
  value: PriceRange | null;
  onChange: (next: PriceRange | null) => void;
  locale?: Locale;
};

export default function PriceRangeFilter({
  prices,
  value,
  onChange,
  locale = "en",
}: Props) {
  const [lo, hi] = useMemo(() => {
    if (!prices.length) return [0, 0] as const;
    let mn = Infinity;
    let mx = -Infinity;
    for (const p of prices) {
      if (p < mn) mn = p;
      if (p > mx) mx = p;
    }
    return [Math.floor(mn / 10) * 10, Math.ceil(mx / 10) * 10] as const;
  }, [prices]);

  const toPrice = (pos: number) => {
    if (pos <= 0) return lo;
    if (pos >= RES) return hi;
    return clamp(snap(lo + (hi - lo) * Math.pow(pos / RES, GAMMA)), lo, hi);
  };
  const toPos = (price: number) =>
    hi === lo
      ? 0
      : Math.round(
          Math.pow(clamp((price - lo) / (hi - lo), 0, 1), 1 / GAMMA) * RES,
        );

  /* Draft = what the handles show while dragging. `value` = what is applied. */
  const [draft, setDraft] = useState<PriceRange>(value ?? [lo, hi]);

  // External changes (Clear all, removing the pill, URL) reset the handles.
  useEffect(() => {
    const next: PriceRange = value ?? [lo, hi];
    setDraft((prev) =>
      prev[0] === next[0] && prev[1] === next[1] ? prev : next,
    );
  }, [value, lo, hi]);

  const commit = (r: PriceRange) => {
    const full = r[0] <= lo && r[1] >= hi;
    const same = full
      ? value === null
      : value !== null && value[0] === r[0] && value[1] === r[1];
    if (same) return;
    onChange(full ? null : r);
  };

  // Releasing the handle anywhere (even outside it) applies the draft.
  const draftRef = useRef(draft);
  useEffect(() => {
    draftRef.current = draft;
  }, [draft]);

  const commitRef = useRef<() => void>(() => {});
  useEffect(() => {
    commitRef.current = () => commit(draftRef.current);
  }); // runs after every render

  const startDrag = () => {
    const apply = () => commitRef.current();
    window.addEventListener("pointerup", apply, { once: true });
    window.addEventListener("pointercancel", apply, { once: true });
  };

  /* ---------------- histogram + presets ---------------- */

  const { bars, maxCount } = useMemo(() => {
    const counts = new Array<number>(BUCKETS).fill(0);
    if (hi > lo) {
      for (const p of prices) {
        const pos = Math.round(
          Math.pow(clamp((p - lo) / (hi - lo), 0, 1), 1 / GAMMA) * RES,
        );
        counts[Math.min(BUCKETS - 1, Math.floor((pos / RES) * BUCKETS))]++;
      }
    }
    return { bars: counts, maxCount: Math.max(1, ...counts) };
  }, [prices, lo, hi]);

  const presets = useMemo(() => {
    if (prices.length < 9) return [];
    const sorted = [...prices].sort((a, b) => a - b);
    const q = (f: number) => sorted[Math.floor((sorted.length - 1) * f)];
    const a = snap(q(1 / 3));
    const b = snap(q(2 / 3));
    if (!(lo < a && a < b && b < hi)) return [];
    const under = formatPrice(a, locale);
    const over = formatPrice(b, locale);
    return [
      {
        label: locale === "bn" ? `${under} এর নিচে` : `Under ${under}`,
        range: [lo, a] as PriceRange,
      },
      {
        label: `${under} – ${over}`,
        range: [a, b] as PriceRange,
      },
      {
        label: locale === "bn" ? `${over} এর বেশি` : `Over ${over}`,
        range: [b, hi] as PriceRange,
      },
    ];
  }, [prices, lo, hi, locale]);

  /* ---------------- min / max text fields ---------------- */

  const [editing, setEditing] = useState<0 | 1 | null>(null);
  const [text, setText] = useState("");

  const numFmt = (n: number) =>
    n.toLocaleString(locale === "bn" ? "bn-BD" : "en-US", {
      useGrouping: false,
    });

  const finishEdit = (i: 0 | 1) => {
    setEditing(null);
    const ascii = text
      .replace(/[০-৯]/g, (d) => String(BN_DIGITS.indexOf(d)))
      .replace(/[^\d]/g, "");
    const n = parseInt(ascii, 10);
    if (Number.isNaN(n)) return;

    const next: PriceRange =
      i === 0
        ? [clamp(n, lo, draft[1]), draft[1]]
        : [draft[0], clamp(n, draft[0], hi)];
    setDraft(next);
    commit(next);
  };

  if (hi <= lo) return null;

  const posMin = toPos(draft[0]);
  const posMax = toPos(draft[1]);

  const fields: { i: 0 | 1; label: string }[] = [
    { i: 0, label: locale === "bn" ? "সর্বনিম্ন" : "Min" },
    { i: 1, label: locale === "bn" ? "সর্বোচ্চ" : "Max" },
  ];

  return (
    <div className={styles.root}>
      {/* where the products are, by price */}
      <div className={styles.hist} aria-hidden>
        {bars.map((count, i) => {
          const start = (i * RES) / BUCKETS;
          const end = ((i + 1) * RES) / BUCKETS;
          const on = end > posMin && start < posMax;
          return (
            <span
              key={i}
              className={`${styles.bar} ${on ? styles.barOn : ""}`}
              style={{
                height: `${count ? Math.max(10, (count / maxCount) * 100) : 4}%`,
              }}
            />
          );
        })}
      </div>

      {/* two stacked native range inputs: free keyboard + a11y */}
      <div className={styles.rail}>
        <div className={styles.track}>
          <div
            className={styles.fill}
            style={{
              left: `${(posMin / RES) * 100}%`,
              right: `${100 - (posMax / RES) * 100}%`,
            }}
          />
        </div>

        <input
          type="range"
          className={styles.range}
          min={0}
          max={RES}
          step={1}
          value={posMin}
          aria-label={locale === "bn" ? "সর্বনিম্ন মূল্য" : "Minimum price"}
          aria-valuetext={formatPrice(draft[0], locale)}
          style={{ zIndex: posMin > RES / 2 ? 4 : 2 }}
          onPointerDown={startDrag}
          onKeyUp={() => commit(draft)}
          onChange={(e) => {
            const pos = Math.min(Number(e.target.value), posMax - MIN_GAP);
            setDraft([toPrice(pos), draft[1]]);
          }}
        />
        <input
          type="range"
          className={styles.range}
          min={0}
          max={RES}
          step={1}
          value={posMax}
          aria-label={locale === "bn" ? "সর্বোচ্চ মূল্য" : "Maximum price"}
          aria-valuetext={formatPrice(draft[1], locale)}
          style={{ zIndex: 3 }}
          onPointerDown={startDrag}
          onKeyUp={() => commit(draft)}
          onChange={(e) => {
            const pos = Math.max(Number(e.target.value), posMin + MIN_GAP);
            setDraft([draft[0], toPrice(pos)]);
          }}
        />
      </div>

      <div className={styles.fields}>
        {fields.map(({ i, label }, idx) => (
          <div key={i} className={styles.fieldWrap}>
            {idx === 1 && (
              <span className={styles.dash} aria-hidden>
                –
              </span>
            )}
            <label className={styles.field}>
              <span className={styles.fieldLabel}>{label}</span>
              <span className={styles.fieldBox}>
                <b aria-hidden>৳</b>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  value={editing === i ? text : numFmt(draft[i])}
                  onFocus={(e) => {
                    setEditing(i);
                    setText(String(draft[i]));
                    e.currentTarget.select();
                  }}
                  onChange={(e) => setText(e.target.value)}
                  onBlur={() => finishEdit(i)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") e.currentTarget.blur();
                  }}
                />
              </span>
            </label>
          </div>
        ))}
      </div>

      {presets.length > 0 && (
        <div className={styles.presets}>
          {presets.map((p) => {
            const active = draft[0] === p.range[0] && draft[1] === p.range[1];
            return (
              <button
                key={p.label}
                type="button"
                aria-pressed={active}
                className={styles.preset}
                onClick={() => {
                  const next: PriceRange = active ? [lo, hi] : p.range;
                  setDraft(next);
                  commit(next);
                }}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
