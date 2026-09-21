// src/components/home/category-rail/CategoryRail.tsx

"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import ProductCard, {
  type ProductCardData,
} from "@/components/shared/ProductCard";

import styles from "./CategoryRail.module.css";

type Locale = "en" | "bn";

type LocalizedText = {
  en: string;
  bn: string;
};

export type CategoryRailProps = {
  title: LocalizedText;
  description?: LocalizedText;
  shopHref: string;
  products: ProductCardData[];
  locale?: Locale;
  palette?: "cream" | "sage" | "neutral" | "slate";
};

/* ------------------------------------------------------------
   Helpers
   ------------------------------------------------------------ */

const clamp = (n: number, min: number, max: number) =>
  Math.min(max, Math.max(min, n));

/** Gentle start and stop: used for the prev / next buttons and scrollbar clicks. */
const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

/** Fast start, long soft landing: used after a drag so it feels like momentum. */
const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4);

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const nearestIndex = (points: number[], x: number) => {
  let best = 0;
  for (let i = 1; i < points.length; i++) {
    if (Math.abs(points[i] - x) < Math.abs(points[best] - x)) best = i;
  }
  return best;
};

/** Pixels the pointer must travel before a mouse press becomes a drag. */
const DRAG_THRESHOLD = 6;

/** How far (in ms of travel) a flick carries the rail after release. */
const INERTIA_MS = 320;

export default function CategoryRail({
  title,
  description,
  shopHref,
  products,
  locale = "en",
  palette = "cream",
}: CategoryRailProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);

  const drag = useRef({
    down: false,
    moved: false,
    startX: 0,
    startScroll: 0,
    lastX: 0,
    lastT: 0,
    velocity: 0,
    suppressClick: false,
  });

  const thumbDrag = useRef<{
    startX: number;
    startScroll: number;
    max: number;
    travel: number;
  } | null>(null);

  const [revealed, setRevealed] = useState(false);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(true);
  const [scrollable, setScrollable] = useState(true);

  const isBangla = locale === "bn";
  const banglaClass = isBangla ? "tracking-normal" : "";

  /* ---------------- snap points ---------------- */

  /** scrollLeft value that puts each card flush with the left gutter. */
  const getSnapPoints = useCallback(() => {
    const rail = railRef.current;
    if (!rail) return [];

    const pad = parseFloat(getComputedStyle(rail).paddingLeft) || 0;
    const max = rail.scrollWidth - rail.clientWidth;

    return Array.from(rail.querySelectorAll<HTMLElement>("[data-card]")).map(
      (el) => clamp(el.offsetLeft - pad, 0, max),
    );
  }, []);

  /* ---------------- eased scrolling ---------------- */

  const stopAnimation = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    railRef.current?.removeAttribute("data-animating");
  }, []);

  const animateTo = useCallback(
    (target: number, ease: (t: number) => number = easeInOutCubic) => {
      const rail = railRef.current;
      if (!rail) return;

      stopAnimation();

      const max = rail.scrollWidth - rail.clientWidth;
      const to = clamp(target, 0, max);
      const from = rail.scrollLeft;
      const dist = to - from;

      if (Math.abs(dist) < 1) return;

      if (prefersReducedMotion()) {
        rail.scrollLeft = to;
        return;
      }

      // longer trips take a bit longer, but never feel sluggish
      const duration = clamp(450 + Math.abs(dist) * 0.5, 600, 1200);
      const t0 = performance.now();

      // CSS scroll-snap is paused while we drive the position
      rail.setAttribute("data-animating", "true");

      const tick = (now: number) => {
        const t = clamp((now - t0) / duration, 0, 1);
        rail.scrollLeft = from + dist * ease(t);

        if (t < 1) {
          rafRef.current = requestAnimationFrame(tick);
        } else {
          rafRef.current = null;
          rail.removeAttribute("data-animating");
        }
      };

      rafRef.current = requestAnimationFrame(tick);
    },
    [stopAnimation],
  );

  /** Move by a "page" (visible cards - 1, at least one card). */
  const go = useCallback(
    (dir: 1 | -1, cards?: number) => {
      const rail = railRef.current;
      if (!rail) return;

      const snaps = getSnapPoints();
      if (snaps.length === 0) return;

      const items = rail.querySelectorAll<HTMLElement>("[data-card]");
      const pad = parseFloat(getComputedStyle(rail).paddingLeft) || 0;
      const stride =
        items.length > 1
          ? items[1].offsetLeft - items[0].offsetLeft
          : items[0].offsetWidth;

      const visible = (rail.clientWidth - pad) / stride;
      const step = cards ?? Math.max(1, Math.floor(visible) - 1);

      const current = nearestIndex(snaps, rail.scrollLeft);
      const next = clamp(current + dir * step, 0, snaps.length - 1);

      animateTo(snaps[next], easeInOutCubic);
    },
    [animateTo, getSnapPoints],
  );

  /* ---------------- progress / edge state ---------------- */

  const update = useCallback(() => {
    const rail = railRef.current;
    if (!rail) return;

    const max = rail.scrollWidth - rail.clientWidth;
    const x = rail.scrollLeft;
    const progress = max > 0 ? clamp(x / max, 0, 1) : 0;
    const ratio = clamp(rail.clientWidth / rail.scrollWidth, 0.08, 1);

    const thumb = thumbRef.current;
    if (thumb) {
      thumb.style.width = `${ratio * 100}%`;
      // translateX % is relative to the thumb, so scale by 1/ratio
      thumb.style.transform = `translate3d(${
        ((progress * (1 - ratio)) / ratio) * 100
      }%, 0, 0)`;
    }

    setCanPrev(x > 2);
    setCanNext(x < max - 2);
    setScrollable(max > 2);
  }, []);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;

    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        update();
      });
    };

    rail.addEventListener("scroll", onScroll, { passive: true });

    const ro = new ResizeObserver(onScroll);
    ro.observe(rail);

    update();

    return () => {
      rail.removeEventListener("scroll", onScroll);
      ro.disconnect();
      if (frame) cancelAnimationFrame(frame);
    };
  }, [update, products.length]);

  /* ---------------- entrance (plays once) ---------------- */

  useEffect(() => {
    const el = sectionRef.current;
    if (!el || !("IntersectionObserver" in window)) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRevealed(true);
          io.disconnect();
        }
      },
      { threshold: 0.15 },
    );

    io.observe(el);
    return () => io.disconnect();
  }, [products.length]);
  useEffect(() => stopAnimation, [stopAnimation]);

  /* ---------------- mouse drag with momentum ----------------
       Touch keeps the browser's native scrolling + snapping.
       Mouse gets grab-and-throw. */

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    stopAnimation(); // any new interaction cancels a running animation

    if (e.pointerType !== "mouse" || e.button !== 0) return;

    drag.current = {
      down: true,
      moved: false,
      startX: e.clientX,
      startScroll: e.currentTarget.scrollLeft,
      lastX: e.clientX,
      lastT: performance.now(),
      velocity: 0,
      suppressClick: false,
    };
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d.down) return;

    const rail = e.currentTarget;
    const dx = e.clientX - d.startX;

    if (!d.moved) {
      if (Math.abs(dx) < DRAG_THRESHOLD) return;
      d.moved = true;
      rail.setPointerCapture(e.pointerId);
      rail.setAttribute("data-dragging", "true");
    }

    const now = performance.now();
    const dt = now - d.lastT;
    if (dt > 0) {
      const instant = (d.lastX - e.clientX) / dt; // px per ms, + = scrolling right
      d.velocity = d.velocity * 0.7 + instant * 0.3;
    }
    d.lastX = e.clientX;
    d.lastT = now;

    rail.scrollLeft = d.startScroll - dx;
  };

  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d.down) return;
    d.down = false;

    if (!d.moved) return;
    d.suppressClick = true;

    const rail = e.currentTarget;
    if (rail.hasPointerCapture(e.pointerId)) {
      rail.releasePointerCapture(e.pointerId);
    }

    // if the pointer rested before release, don't throw the rail
    const rested = performance.now() - d.lastT > 80;
    const velocity = rested ? 0 : d.velocity;

    const snaps = getSnapPoints();
    const landing = rail.scrollLeft + velocity * INERTIA_MS;

    // start our animation first, then hand snapping back to CSS
    animateTo(snaps[nearestIndex(snaps, landing)], easeOutQuart);
    rail.removeAttribute("data-dragging");
  };

  /** A drag must never count as a click on a card. */
  const onClickCapture = (e: React.MouseEvent<HTMLDivElement>) => {
    if (drag.current.suppressClick) {
      e.preventDefault();
      e.stopPropagation();
      drag.current.suppressClick = false;
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return;

    const rail = e.currentTarget;
    const max = rail.scrollWidth - rail.clientWidth;

    if (e.key === "ArrowRight") {
      e.preventDefault();
      go(1, 1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      go(-1, 1);
    } else if (e.key === "Home") {
      e.preventDefault();
      animateTo(0);
    } else if (e.key === "End") {
      e.preventDefault();
      animateTo(max);
    }
  };

  /* ---------------- scrollbar: drag thumb, click track ---------------- */

  const onThumbPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const rail = railRef.current;
    const track = trackRef.current;
    const thumb = thumbRef.current;
    if (!rail || !track || !thumb) return;

    e.stopPropagation();
    stopAnimation();

    thumb.setPointerCapture(e.pointerId);
    rail.setAttribute("data-dragging", "true");
    barRef.current?.setAttribute("data-active", "true");

    thumbDrag.current = {
      startX: e.clientX,
      startScroll: rail.scrollLeft,
      max: rail.scrollWidth - rail.clientWidth,
      travel: Math.max(track.clientWidth - thumb.offsetWidth, 1),
    };
  };

  const onThumbPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const rail = railRef.current;
    const t = thumbDrag.current;
    if (!rail || !t) return;

    rail.scrollLeft =
      t.startScroll + ((e.clientX - t.startX) * t.max) / t.travel;
  };

  const onThumbPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const rail = railRef.current;
    if (!rail || !thumbDrag.current) return;

    thumbDrag.current = null;

    const thumb = e.currentTarget;
    if (thumb.hasPointerCapture(e.pointerId)) {
      thumb.releasePointerCapture(e.pointerId);
    }

    const snaps = getSnapPoints();
    animateTo(snaps[nearestIndex(snaps, rail.scrollLeft)], easeOutQuart);

    rail.removeAttribute("data-dragging");
    barRef.current?.removeAttribute("data-active");
  };

  const onTrackPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const rail = railRef.current;
    const track = trackRef.current;
    const thumb = thumbRef.current;
    if (!rail || !track || !thumb) return;

    const rect = track.getBoundingClientRect();
    const max = rail.scrollWidth - rail.clientWidth;
    const travel = Math.max(rect.width - thumb.offsetWidth, 1);

    // centre the thumb on the click, then glide to the nearest card
    const p = clamp(
      (e.clientX - rect.left - thumb.offsetWidth / 2) / travel,
      0,
      1,
    );
    const snaps = getSnapPoints();

    animateTo(snaps[nearestIndex(snaps, p * max)], easeInOutCubic);
  };

  if (products.length === 0) return null;

  return (
    <section
      ref={sectionRef}
      className={`${styles.section} ${
        revealed ? styles.revealed : ""
      } w-full bg-brand-background py-10 sm:py-12 md:py-14`}
    >
      {/* ---------------- Header ---------------- */}
      <header
        className={`${styles.head} mb-5 flex items-end justify-between gap-4 sm:mb-6`}
      >
        <div className="min-w-0 flex-1">
          <h2
            className={`font-heading truncate text-[clamp(1.25rem,2.6vw,1.875rem)] font-semibold text-brand-primary ${
              // Bengali needs a taller line box, or truncate's overflow:hidden clips the marks
              isBangla
                ? "leading-[1.45] tracking-normal"
                : "leading-tight tracking-[-0.03em]"
            }`}
          >
            {title[locale]}
          </h2>

          {description && (
            <p
              className={`font-body mt-1.5 line-clamp-2 max-w-xl text-[13px] leading-relaxed text-brand-text-secondary/80 sm:text-sm ${banglaClass}`}
            >
              {description[locale]}
            </p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <div className="hidden items-center gap-1.5 md:flex">
            <button
              type="button"
              onClick={() => go(-1)}
              disabled={!canPrev}
              aria-label={isBangla ? "আগের পণ্য" : "Previous products"}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-brand-primary/20 bg-brand-surface text-brand-primary transition duration-200 hover:border-brand-primary hover:bg-brand-primary hover:text-white active:scale-95 disabled:pointer-events-none disabled:opacity-30"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={() => go(1)}
              disabled={!canNext}
              aria-label={isBangla ? "পরের পণ্য" : "Next products"}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-brand-primary/20 bg-brand-surface text-brand-primary transition duration-200 hover:border-brand-primary hover:bg-brand-primary hover:text-white active:scale-95 disabled:pointer-events-none disabled:opacity-30"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <Link
            href={shopHref}
            className={`group/all inline-flex h-10 items-center gap-1.5 rounded-full border border-brand-primary/20 px-4 text-[10px] font-semibold uppercase tracking-[0.14em] text-brand-primary transition-colors duration-200 hover:border-brand-accent hover:bg-brand-accent hover:text-brand-primary ${banglaClass}`}
          >
            <span>{isBangla ? "সব দেখুন" : "View All"}</span>

            <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover/all:translate-x-0.5" />
          </Link>
        </div>
      </header>

      {/* ---------------- Rail ---------------- */}
      <div className={styles.railWrap} data-end={!canNext}>
        <div
          ref={railRef}
          className={styles.rail}
          role="region"
          aria-label={title[locale]}
          tabIndex={0}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onClickCapture={onClickCapture}
          onDragStart={(e) => e.preventDefault()}
          onWheel={stopAnimation}
          onKeyDown={onKeyDown}
        >
          {products.map((product, i) => (
            <div
              key={product.id}
              data-card
              className={styles.item}
              style={{ "--i": i } as React.CSSProperties}
            >
              <ProductCard
                product={product}
                locale={locale}
                palette={palette}
              />
            </div>
          ))}
        </div>
      </div>

      {/* ---------------- Scrollbar ---------------- */}
      <div
        ref={barRef}
        className={styles.bar}
        data-hidden={!scrollable}
        onPointerDown={onTrackPointerDown}
        aria-hidden="true"
      >
        <div ref={trackRef} className={styles.track}>
          <div
            ref={thumbRef}
            className={styles.thumb}
            onPointerDown={onThumbPointerDown}
            onPointerMove={onThumbPointerMove}
            onPointerUp={onThumbPointerUp}
            onPointerCancel={onThumbPointerUp}
          />
        </div>
      </div>
    </section>
  );
}
