// src/components/shop/ProductGrid.tsx

"use client";

import {
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import type { ComponentProps, ReactNode } from "react";
import gsap from "gsap";

import ProductCard from "@/components/shared/ProductCard";
import type { Locale, ShopProduct } from "@/lib/shop/types";

const useIsoLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

/** Cards up to this far outside the viewport (× viewport height) still animate; the rest just snap. */
const VIEW_MARGIN = 0.75;

/** Hard cap on cards tweened per transition. */
const MAX_ANIMATED = 48;

/** Layer-promote cards only while they animate. */
const PROMOTE = "transform, opacity";

type Box = {
  x: number;
  y: number;
  w: number;
  h: number;
};

type Snapshot = {
  boxes: Map<string, Box>;
  height: number;
};

type CardProps = ComponentProps<typeof ProductCard>;

const idOf = (el: HTMLElement) => el.dataset.id!;

function sameOrder(a: ShopProduct[], b: ShopProduct[]) {
  return a.length === b.length && a.every((p, i) => p.id === b[i].id);
}

/** Visual (transform-aware) position of every card, relative to the grid. */
function readBoxes(grid: HTMLElement) {
  const g = grid.getBoundingClientRect();
  const boxes = new Map<string, Box>();

  for (const el of Array.from(grid.children) as HTMLElement[]) {
    const r = el.getBoundingClientRect();

    boxes.set(idOf(el), {
      x: r.left - g.left,
      y: r.top - g.top,
      w: r.width,
      h: r.height,
    });
  }

  return { g, boxes };
}

// Removed onWishlist and onAddToCart from GridItem
const GridItem = memo(function GridItem({
  product,
  locale,
}: {
  product: ShopProduct;
  locale: Locale;
}) {
  return (
    <div data-id={product.id} className="min-w-0">
      <ProductCard product={product} locale={locale} />
    </div>
  );
});

type ProductGridProps = {
  /** The current result set, already filtered + sorted. Diffed by `product.id`. */
  products: ShopProduct[];
  locale?: Locale;
  /** Rendered once the last card has finished leaving and nothing is left to show. */
  empty?: ReactNode;
  /** True while a refetch is in flight (keep the previous products on screen meanwhile). */
  isFetching?: boolean;
};

export default function ProductGrid({
  products,
  locale = "en",
  empty,
  isFetching = false,
}: ProductGridProps) {
  const gridRef = useRef<HTMLDivElement>(null);
  const emptyRef = useRef<HTMLDivElement>(null);

  // What's actually on screen. It lags `products` by the exit animation so
  // leaving cards can fade out before React unmounts them.
  const [shown, setShown] = useState(products);

  const snapshot = useRef<Snapshot | null>(null);
  const timeline = useRef<gsap.core.Timeline | null>(null);
  const animated = useRef<HTMLElement[]>([]);
  const fading = useRef<HTMLElement[]>([]);

  // Phase 1: products changed -> fade out the cards that are leaving, THEN commit.
  useEffect(() => {
    const grid = gridRef.current;

    if (!grid || products === shown) return;

    // Same cards in the same order: render the fresh product data directly.
    // No state update is needed, and no card transition should run.
    if (sameOrder(products, shown)) return;

    const nextIds = new Set(products.map((p) => p.id));

    // Cards a superseded change had started fading, but which are staying after all.
    for (const el of fading.current) {
      if (el.isConnected && nextIds.has(idOf(el))) {
        gsap.to(el, {
          opacity: 1,
          scale: 1,
          duration: 0.2,
          overwrite: "auto",
          clearProps: "opacity,transform,willChange",
        });
      }
    }

    fading.current = [];

    const commit = () => {
      timeline.current?.pause();

      // Freeze the current layout so the snapshot matches what's on screen.
      const { g, boxes } = readBoxes(grid);

      snapshot.current = {
        boxes,
        height: g.height,
      };

      fading.current = [];
      setShown(products);
    };

    const vh = window.innerHeight;
    const margin = vh * VIEW_MARGIN;

    const leaving = (Array.from(grid.children) as HTMLElement[])
      .filter((el) => {
        if (nextIds.has(idOf(el))) return false;

        const r = el.getBoundingClientRect();

        return r.bottom > -margin && r.top < vh + margin;
      })
      .slice(0, MAX_ANIMATED);

    // Nothing visible is leaving (sort, cards added, or off-screen only):
    // no exit phase.
    if (
      leaving.length === 0 ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      commit();
      return;
    }

    fading.current = leaving;

    gsap.set(leaving, {
      willChange: PROMOTE,
    });

    const tween = gsap.to(leaving, {
      opacity: 0,
      scale: 0.94,
      duration: 0.2,
      ease: "power2.in",
      overwrite: "auto",
      onComplete: commit,
    });

    return () => {
      tween.kill();
    };
  }, [products, shown]);

  // Phase 2: new DOM is committed -> FLIP the cards that moved,
  // fade in the new ones.
  useIsoLayoutEffect(() => {
    const grid = gridRef.current;
    const snap = snapshot.current;

    snapshot.current = null;

    if (!grid || !snap) return;

    // Stop the previous transition and clear what it left behind.
    timeline.current?.kill();

    const settle: HTMLElement[] = [];

    // Cards caught mid fade-in.
    for (const el of animated.current) {
      if (!el.isConnected) continue;

      gsap.set(el, {
        clearProps: "transform,willChange",
      });

      if (el.style.opacity && el.style.opacity !== "1") {
        settle.push(el);
      }
    }

    animated.current = [];

    gsap.set(grid, {
      clearProps: "height",
    });

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.set(settle, {
        clearProps: "opacity",
      });

      return;
    }

    const { g, boxes: after } = readBoxes(grid);

    const vh = window.innerHeight;
    const margin = vh * VIEW_MARGIN;

    const near = (b: Box) =>
      g.top + b.y + b.h > -margin && g.top + b.y < vh + margin;

    const moves: {
      el: HTMLElement;
      dx: number;
      dy: number;
    }[] = [];

    const enters: HTMLElement[] = [];

    let stayers = 0;

    for (const el of Array.from(grid.children) as HTMLElement[]) {
      const a = after.get(idOf(el))!;
      const b = snap.boxes.get(idOf(el));

      if (b) {
        stayers++;

        const dx = b.x - a.x;
        const dy = b.y - a.y;

        if (
          (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) &&
          (near(a) || near(b))
        ) {
          moves.push({
            el,
            dx,
            dy,
          });
        }
      } else if (near(a)) {
        enters.push(el);
      }
    }

    const moving = moves.slice(0, MAX_ANIMATED);
    const entering = enters.slice(0, MAX_ANIMATED);

    const removed = snap.boxes.size - stayers;
    const movingEls = moving.map((m) => m.el);

    gsap.set([...movingEls, ...entering], {
      willChange: PROMOTE,
    });

    const tl = gsap.timeline();

    timeline.current = tl;
    animated.current = [...settle, ...movingEls, ...entering];

    if (settle.length) {
      tl.to(
        settle,
        {
          opacity: 1,
          duration: 0.25,
          clearProps: "opacity,willChange",
        },
        0,
      );
    }

    if (moving.length) {
      tl.fromTo(
        movingEls,
        {
          x: (i: number) => moving[i].dx,
          y: (i: number) => moving[i].dy,
        },
        {
          x: 0,
          y: 0,
          duration: 0.85,
          ease: "power4.out",
          stagger: {
            amount: Math.min(moving.length * 0.008, 0.12),
          },
          clearProps: "transform,willChange",
        },
        0,
      );
    }

    if (entering.length) {
      tl.fromTo(
        entering,
        {
          opacity: 0,
          y: 24,
          scale: 0.96,
        },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.6,
          ease: "power3.out",
          stagger: {
            amount: Math.min(entering.length * 0.025, 0.3),
          },
          clearProps: "transform,opacity,willChange",
        },
        moving.length ? 0.15 : 0,
      );
    }

    // Only ease the container when something was removed or moved.
    // A plain "load more" append just grows the grid.
    if (
      (removed > 0 || moving.length > 0) &&
      Math.abs(snap.height - g.height) > 1
    ) {
      tl.fromTo(
        grid,
        {
          height: snap.height,
        },
        {
          height: g.height,
          duration: 0.85,
          ease: "power4.out",
          clearProps: "height",
        },
        0,
      );
    }
  }, [shown]);

  useEffect(() => {
    return () => {
      timeline.current?.kill();
    };
  }, []);

  // When the product IDs and order match, use the latest product objects.
  // This refreshes card data without triggering a state update.
  const displayedProducts = sameOrder(products, shown) ? products : shown;

  const isEmpty = displayedProducts.length === 0;

  useEffect(() => {
    if (isEmpty && emptyRef.current) {
      gsap.fromTo(
        emptyRef.current,
        {
          opacity: 0,
          y: 12,
        },
        {
          opacity: 1,
          y: 0,
          duration: 0.4,
          ease: "power2.out",
        },
      );
    }
  }, [isEmpty]);

  return (
    <>
      <div
        ref={gridRef}
        aria-busy={isFetching}
        className={`relative grid grid-cols-1 content-start gap-5 transition-opacity duration-300 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 ${
          isFetching ? "opacity-70" : ""
        }`}
      >
        {displayedProducts.map((product) => (
          <GridItem key={product.id} product={product} locale={locale} />
        ))}
      </div>

      {isEmpty && empty ? <div ref={emptyRef}>{empty}</div> : null}
    </>
  );
}
