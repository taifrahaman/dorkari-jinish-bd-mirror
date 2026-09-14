// src/components/home/AnimatedRotatingHeadline.tsx

"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { SplitText } from "gsap/SplitText";
import { CustomEase } from "gsap/CustomEase";

gsap.registerPlugin(SplitText, CustomEase);
CustomEase.create("osmo-ease", "0.625, 0.05, 0, 1");

const ENTER_DURATION = 0.8;
const EXIT_DURATION = 0.8;
const STAGGER = 0.08;

// Bangla glyphs (matra, reph, anusvara, stacked conjuncts) render taller
// than the line box. SplitText's mask wrapper clips to its padding box,
// so we pad vertically and cancel the layout effect with negative margins.
const MASK_PAD_EM = 0.2;

// Line must travel its own height (100%) + mask padding (~16%) + safety.
const TRAVEL_PERCENT = 140;

interface AnimatedRotatingHeadlineProps {
  items: string[];
  interval?: number;
  className?: string;
}

export default function AnimatedRotatingHeadline({
  items,
  interval = 4500,
  className,
}: AnimatedRotatingHeadlineProps) {
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const indexRef = useRef(0);
  const splitRef = useRef<SplitText | null>(null);
  const isAnimatingRef = useRef(false);

  useEffect(() => {
    const el = headlineRef.current;
    if (!el || items.length === 0) return;

    let cancelled = false;
    indexRef.current = 0;
    isAnimatingRef.current = false;

    const createSplit = () => {
      if (splitRef.current) {
        splitRef.current.revert();
        splitRef.current = null;
      }

      const split = SplitText.create(el, {
        type: "lines",
        mask: "lines",
        linesClass: "line",
      });

      // Store it — this was the missing line.
      splitRef.current = split;

      // Expand the mask clip region without changing line stacking.
      split.lines.forEach((line) => {
        const mask = line.parentElement as HTMLElement | null;
        if (!mask) return;
        mask.style.paddingTop = `${MASK_PAD_EM}em`;
        mask.style.paddingBottom = `${MASK_PAD_EM}em`;
        mask.style.marginTop = `${-MASK_PAD_EM}em`;
        mask.style.marginBottom = `${-MASK_PAD_EM}em`;
      });

      return split;
    };

    const playEnter = () => {
      const split = createSplit();
      if (!split) return;
      gsap.set(split.lines, { yPercent: TRAVEL_PERCENT });
      gsap.to(split.lines, {
        yPercent: 0,
        duration: ENTER_DURATION,
        stagger: STAGGER,
        ease: "osmo-ease",
      });
    };

    const playExitThenEnter = () => {
      if (cancelled || isAnimatingRef.current) return;
      const split = splitRef.current;
      if (!split) return;

      isAnimatingRef.current = true;
      const outgoing = split.lines;

      gsap.to(outgoing, {
        // Literal reverse. Swap sign to -TRAVEL_PERCENT for carousel-style exit.
        yPercent: TRAVEL_PERCENT,
        duration: EXIT_DURATION,
        stagger: STAGGER,
        ease: "osmo-ease",
        onComplete: () => {
          if (cancelled) return;

          // Restore plain text, swap content, then re-split and re-enter.
          if (splitRef.current) {
            splitRef.current.revert();
            splitRef.current = null;
          }

          indexRef.current = (indexRef.current + 1) % items.length;
          el.textContent = items[indexRef.current];
          playEnter();
          isAnimatingRef.current = false;
        },
      });
    };

    // Initial render
    el.textContent = items[0];
    playEnter();

    let timerId: ReturnType<typeof setInterval> | null = null;
    if (items.length > 1) {
      timerId = setInterval(playExitThenEnter, interval);
    }

    return () => {
      cancelled = true;
      if (timerId) clearInterval(timerId);
      if (splitRef.current) {
        splitRef.current.revert();
        splitRef.current = null;
      }
    };
  }, [items, interval]);

  return (
    <h1
      key={items[0] ?? ""}
      ref={headlineRef}
      className={className}
      dangerouslySetInnerHTML={{ __html: items[0] ?? "" }}
    />
  );
}
