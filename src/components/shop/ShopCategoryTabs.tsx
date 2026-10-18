// src/components/shop/ShopCategoryTabs.tsx

"use client";

import { useEffect, useRef } from "react";

import { DEFAULT_GLOW } from "./categoryGlow";
import styles from "./ShopHero.module.css";

export type CategoryTab = {
  value: string;
  label: string;
  count: number;
  rgb: string;
};

type Props = {
  tabs: CategoryTab[];
  active: string | null;
  onChange: (value: string | null) => void;
  allLabel: string;
  groupLabel: string;
};

type CSSVars = React.CSSProperties & Record<`--${string}`, string | number>;

export default function ShopCategoryTabs({
  tabs,
  active,
  onChange,
  allLabel,
  groupLabel,
}: Props) {
  const boxRef = useRef<HTMLDivElement>(null);
  const activeIndex = active
    ? tabs.findIndex((t) => t.value === active) + 1
    : 0;

  /* keep the active tab centred in the scrollable row */
  useEffect(() => {
    const box = boxRef.current;
    const el = box?.children[activeIndex] as HTMLElement | undefined;
    if (!box || !el) return;
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const left = el.offsetLeft - (box.clientWidth - el.offsetWidth) / 2;
    box.scrollTo({
      left: Math.max(0, left),
      behavior: reduce ? "auto" : "smooth",
    });
  }, [activeIndex]);

  return (
    <div
      ref={boxRef}
      className={styles.tabs}
      role="group"
      aria-label={groupLabel}
    >
      <button
        type="button"
        className={styles.tab}
        aria-pressed={active === null}
        style={{ "--tab-rgb": DEFAULT_GLOW } as CSSVars}
        onClick={() => onChange(null)}
      >
        {allLabel}
      </button>

      {tabs.map((t) => {
        const isActive = t.value === active;
        return (
          <button
            key={t.value}
            type="button"
            className={styles.tab}
            aria-pressed={isActive}
            disabled={t.count === 0 && !isActive}
            style={{ "--tab-rgb": t.rgb } as CSSVars}
            onClick={() => onChange(isActive ? null : t.value)}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
