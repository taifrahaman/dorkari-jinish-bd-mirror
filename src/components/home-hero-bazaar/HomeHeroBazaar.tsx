// src/components/home-hero-bazaar/HomeHeroBazaar.tsx
"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { ArrowRight } from "lucide-react";
import gsap from "gsap";
import Image from "next/image";

import HeroSearch from "@/components/hero/HeroSearch";
import type { CategoryNode } from "@/components/navigation/navItems";
import {
  HERO_COLLECTIONS,
  PLACEHOLDER_IMAGE,
  type HeroCollection,
  type HeroPick,
  type Lang,
} from "@/components/home-hero/heroCollections";
import {
  SWATCHES,
  swatchVars,
  type BazaarVars,
} from "@/components/home/bazaar/bazaarPalette";
import styles from "./HomeHeroBazaar.module.css";

const COPY: Record<
  Lang,
  {
    brand: string;
    headline: string;
    stalls: string;
    seeAll: string;
    best: string;
  }
> = {
  bn: {
    brand: "দরকারি জিনিশ",
    headline: "দরকারি সবকিছু, এক বাজারেই",
    stalls: "কালেকশন",
    seeAll: "সব দেখুন",
    best: "আজকের সেরা দাম",
  },
  en: {
    brand: "Dorkari Jinish",
    headline: "Everything you need, in one market",
    stalls: "Collections",
    seeAll: "See all",
    best: "Best price today",
  },
};

/** little flags strung across the top */
const FLAGS = 28;
/** festival bulbs hanging above the stalls */
const BULBS = 9;
/** [left %, top px, size px] */
const STARS: Array<[number, number, number]> = [
  [7, 14, 2],
  [16, 46, 3],
  [27, 22, 2],
  [39, 58, 2],
  [51, 18, 3],
  [63, 52, 2],
  [74, 26, 2],
  [86, 12, 3],
  [93, 48, 2],
  [11, 84, 2],
  [47, 92, 2],
  [81, 88, 2],
];

/** seconds before the first automatic switch / between switches / max automatic switches */
const FIRST_DELAY = 6;
const INTERVAL = 7;
const MAX_AUTO = 4;

/** travel (px) or speed (px/ms) that turns a drag into a swipe */
const SWIPE_DIST = 72;
const SWIPE_SPEED = 0.45;

const SEEN_KEY = "bz-hero-seen";

type Props = {
  categories: CategoryNode[];
  collections?: HeroCollection[];
};

export default function HomeHeroBazaar({
  categories,
  collections: passed,
}: Props) {
  // empty database -> fall back to the sample collections
  const collections = passed && passed.length > 0 ? passed : HERO_COLLECTIONS;

  const locale: Lang = useLocale() === "bn" ? "bn" : "en";
  const copy = COPY[locale];
  const fmt = useMemo(
    () => new Intl.NumberFormat(locale === "bn" ? "bn-BD" : "en-US"),
    [locale],
  );

  const rootRef = useRef<HTMLElement>(null);
  const panelsRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef(0);
  const goToRef = useRef<((i: number, manual?: boolean) => void) | null>(null);
  const [active, setActive] = useState(0);
  const count = collections.length;

  // the single deepest discount among picks that have a product page
  const best = useMemo(() => {
    let top: { pct: number; pick: HeroPick } | null = null;
    for (const c of collections) {
      for (const p of c.picks) {
        if (!p.slug || !p.compareAt || p.compareAt <= p.price) continue;
        const pct = Math.round(((p.compareAt - p.price) / p.compareAt) * 100);
        if (!top || pct > top.pct) top = { pct, pick: p };
      }
    }
    return top;
  }, [collections]);

  /* ============================================================
   * All motion lives in this one effect
   * ============================================================ */
  useEffect(() => {
    const root = rootRef.current;
    const panelsEl = panelsRef.current;
    if (!root || !panelsEl) return;

    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const all = <T extends HTMLElement>(
      sel: string,
      scope: ParentNode = root,
    ) => Array.from(scope.querySelectorAll<T>(sel));

    const panels = all("[data-panel]");
    const stalls = all("[data-stall]");
    const awnings = stalls.map((s) =>
      s.querySelector<HTMLElement>("[data-awning]")!,
    );
    const progs = stalls.map((s) =>
      s.querySelector<HTMLElement>("[data-prog]")!,
    );
    const flags = all("[data-flag]");
    const bulbs = all("[data-bulb]");
    const stars = all("[data-twinkle]");
    const sign = root.querySelector<HTMLElement>("[data-sign]");
    const bulbRow = root.querySelector<HTMLElement>("[data-bulbs]");
    const burst = root.querySelector<HTMLElement>("[data-burst]");
    const n = panels.length;
    if (n === 0) return;

    // every tween created after setup goes through run() so it is cleaned up
    const ctx = gsap.context(() => {}, root);
    const run = (fn: () => void) => {
      ctx.add(fn);
    };

    const loops: gsap.core.Animation[] = [];
    const pauses = new Set<string>();
    let loopsReady = false;
    let autoCount = 0;
    let progTween: gsap.core.Tween | null = null;
    let tl: gsap.core.Timeline | null = null;
    let touchTimer = 0;
    let suppressClick = false;

    const buzz = (ms = 8) => {
      try {
        navigator.vibrate?.(ms);
      } catch {
        /* not supported (iOS Safari) */
      }
    };

    const syncLoops = () => {
      const on =
        loopsReady && !pauses.has("offscreen") && !pauses.has("hidden");
      loops.forEach((a) => a.paused(!on));
    };
    const applyPause = () => {
      progTween?.paused(pauses.size > 0);
      syncLoops();
    };

    const setText = (el: HTMLElement, value: number) => {
      // write into the text node React owns, so React can still update it
      const node = el.firstChild;
      if (node) node.nodeValue = fmt.format(value);
    };

    /* ---------- keep the active stall centred in the rail ---------- */

    const centerStall = (index: number) => {
      const el = stalls[index];
      if (!el) return;
      el.scrollIntoView({
        behavior: reduce ? "instant" : "smooth",
        block: "nearest", // never scroll the page vertically
        inline: "center", // always centre horizontally inside .stalls
      });
    };

    /* ---------- auto-play, with a thin progress line on the active awning ---------- */

    const startProgress = (seconds: number) =>
      run(() => {
        progTween?.kill();
        progTween = null;
        gsap.set(progs, { scaleX: 0 });
        if (reduce || n < 2 || autoCount >= MAX_AUTO) return;
        const el = progs[activeRef.current];
        if (!el) return;
        progTween = gsap.to(el, {
          scaleX: 1,
          duration: seconds,
          ease: "none",
          onComplete: () => {
            autoCount += 1;
            show((activeRef.current + 1) % n, 1);
          },
        });
        progTween.paused(pauses.size > 0);
      });

    /** any manual interaction ends auto-play for this visit */
    const stopAuto = () =>
      run(() => {
        autoCount = MAX_AUTO;
        progTween?.kill();
        progTween = null;
        gsap.set(progs, { scaleX: 0 });
      });

    /* ---------- switching stalls ---------- */

    const show = (next: number, dir: 1 | -1) =>
      run(() => {
        const prev = activeRef.current;
        if (next === prev || next < 0 || next >= n) return;

        tl?.progress(1); // finish a transition that is still running

        activeRef.current = next;
        setActive(next);
        centerStall(next); // keep the active stall in the middle of the rail

        const outEl = panels[prev];
        const inEl = panels[next];
        const picksIn = all("[data-pick]", inEl);
        const headIn = all("[data-head]", inEl);
        const badgesIn = all("[data-off]", inEl);
        const priceEls = all("[data-price]", inEl);

        if (reduce) {
          gsap.set(outEl, { autoAlpha: 0, x: 0, rotation: 0 });
          gsap.set(inEl, { autoAlpha: 1, x: 0, rotation: 0 });
          gsap.set([...picksIn, ...headIn], { clearProps: "all" });
          startProgress(INTERVAL);
          return;
        }

        const t = gsap.timeline({
          defaults: { ease: "power3.out" },
          onComplete: () => {
            tl = null;
          },
        });
        tl = t;

        // The old board slides away and fades (no rotation: a turned board
        // pokes thin slivers of its border out from behind the new one).
        // The new board sits on top and fades in instead of popping.
        t.set(outEl, { zIndex: 1 }, 0)
          .set(inEl, { zIndex: 2 }, 0)
          .to(
            outEl,
            { x: -dir * 56, autoAlpha: 0, duration: 0.22, ease: "power2.in" },
            0,
          )
          .set(inEl, { x: 0, rotation: 0 }, 0.1)
          .fromTo(
            inEl,
            { autoAlpha: 0 },
            { autoAlpha: 1, duration: 0.18, ease: "none" },
            0.1,
          )
          .fromTo(
            headIn,
            { y: -8, autoAlpha: 0 },
            { y: 0, autoAlpha: 1, duration: 0.3 },
            0.1,
          )
          .fromTo(
            picksIn,
            {
              x: dir * 52,
              y: 14,
              rotation: dir * 5,
              scale: 0.92,
              autoAlpha: 0,
            },
            {
              x: 0,
              y: 0,
              rotation: 0,
              scale: 1,
              autoAlpha: 1,
              duration: 0.55,
              ease: "back.out(1.7)",
              stagger: 0.07,
            },
            0.1,
          )
          .fromTo(
            badgesIn,
            { scale: 0.4, rotation: -26 },
            {
              scale: 1,
              rotation: -6,
              duration: 0.45,
              ease: "back.out(3)",
              stagger: 0.07,
            },
            0.4,
          )
          // the tapped awning squashes and springs back
          .fromTo(
            awnings[next],
            { scaleY: 0.55 },
            { scaleY: 1, duration: 0.7, ease: "elastic.out(1, 0.45)" },
            0,
          );

        // prices count up (digits follow the locale)
        priceEls.forEach((el) => {
          const value = Number(el.dataset.price);
          if (!Number.isFinite(value) || value < 100) return;
          const proxy = { v: Math.round(value * 0.55) };
          setText(el, proxy.v);
          t.to(
            proxy,
            {
              v: value,
              duration: 0.7,
              ease: "power2.out",
              onUpdate: () => setText(el, Math.round(proxy.v)),
              onComplete: () => setText(el, value),
            },
            0.12,
          );
        });

        startProgress(INTERVAL);
      });

    const springBack = () =>
      run(() => {
        gsap.to(panels[activeRef.current], {
          x: 0,
          rotation: 0,
          autoAlpha: 1,
          duration: 0.55,
          ease: "elastic.out(1, 0.55)",
        });
      });

    goToRef.current = (i, manual = false) => {
      if (manual) {
        stopAuto();
        buzz();
      }
      const prev = activeRef.current;
      if (i === prev) return;
      show(i, i > prev ? 1 : -1);
    };

    /* ---------- finger-follow swipe (touch and pen only) ---------- */

    type Drag = {
      id: number;
      sx: number;
      sy: number;
      lx: number;
      lt: number;
      v: number;
      mode: "idle" | "x" | "y";
    };
    let drag: Drag | null = null;
    const rubber = (dx: number) => dx / (1 + Math.abs(dx) / 240);

    const onDragDown = (e: PointerEvent) => {
      if (e.pointerType === "mouse" || drag || n < 2) return;
      drag = {
        id: e.pointerId,
        sx: e.clientX,
        sy: e.clientY,
        lx: e.clientX,
        lt: performance.now(),
        v: 0,
        mode: "idle",
      };
    };
    const onDragMove = (e: PointerEvent) => {
      if (!drag || e.pointerId !== drag.id) return;
      const dx = e.clientX - drag.sx;
      const dy = e.clientY - drag.sy;

      if (drag.mode === "idle") {
        if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
        drag.mode = Math.abs(dx) > Math.abs(dy) * 1.2 ? "x" : "y";
        if (drag.mode === "x") {
          panelsEl.setPointerCapture(e.pointerId);
          tl?.progress(1);
          releasePress();
        }
      }
      if (drag.mode !== "x") return;

      const now = performance.now();
      const dt = now - drag.lt;
      if (dt > 0) drag.v = drag.v * 0.7 + ((e.clientX - drag.lx) / dt) * 0.3;
      drag.lx = e.clientX;
      drag.lt = now;

      const r = rubber(dx);
      gsap.set(panels[activeRef.current], {
        x: r,
        opacity: 1 - Math.min(Math.abs(r) / 240, 0.4),
      });
    };
    const onDragUp = (e: PointerEvent) => {
      if (!drag || e.pointerId !== drag.id) return;
      const d = drag;
      drag = null;
      if (d.mode !== "x") return;

      suppressClick = true;
      window.setTimeout(() => {
        suppressClick = false;
      }, 80);

      const dx = e.clientX - d.sx;
      const fast = Math.abs(d.v) > SWIPE_SPEED;
      if (e.type === "pointercancel" || (!fast && Math.abs(dx) < SWIPE_DIST)) {
        springBack();
        return;
      }
      const dir: 1 | -1 = fast ? (d.v < 0 ? 1 : -1) : dx < 0 ? 1 : -1;
      stopAuto();
      buzz();
      show((activeRef.current + dir + n) % n, dir);
    };
    const onClickCapture = (e: MouseEvent) => {
      if (!suppressClick) return;
      e.preventDefault();
      e.stopPropagation();
    };

    /* ---------- press feedback on picks (touch springs, mouse keeps CSS) ---------- */

    let pressed: HTMLElement | null = null;
    const onPressDown = (e: PointerEvent) => {
      if (e.pointerType === "mouse") return;
      const el = (e.target as Element).closest<HTMLElement>("[data-press]");
      if (!el) return;
      pressed = el;
      run(() => {
        gsap.to(el, {
          scale: 0.95,
          duration: 0.1,
          ease: "power2.out",
          overwrite: "auto",
        });
      });
    };
    function releasePress() {
      const el = pressed;
      pressed = null;
      if (!el) return;
      run(() => {
        gsap.to(el, {
          scale: 1,
          duration: 0.5,
          ease: "elastic.out(1, 0.5)",
          overwrite: "auto",
          onComplete: () => {
            gsap.set(el, { clearProps: "transform" });
          },
        });
      });
    }

    /* ---------- tap the signboard or the bulbs ---------- */

    const swingSign = () => {
      if (!sign || reduce) return;
      run(() => {
        gsap
          .timeline()
          .to(sign, {
            rotation: -6,
            duration: 0.2,
            ease: "sine.out",
            overwrite: "auto",
          })
          .to(sign, { rotation: 4, duration: 0.3, ease: "sine.inOut" })
          .to(sign, { rotation: -2, duration: 0.3, ease: "sine.inOut" })
          .to(sign, { rotation: 0, duration: 0.45, ease: "sine.inOut" });
      });
    };
    const flashBulbs = () => {
      if (reduce) return;
      buzz(6);
      run(() => {
        gsap.fromTo(
          bulbs,
          { scale: 1.7, opacity: 1 },
          {
            scale: 1,
            duration: 0.5,
            ease: "back.out(3)",
            stagger: { each: 0.05, from: "center" },
            overwrite: "auto",
          },
        );
      });
    };

    /* ---------- pauses: touch, hover (mouse), focus, hidden tab, off-screen ---------- */

    const onEnter = (e: PointerEvent) => {
      if (e.pointerType === "mouse") {
        pauses.add("hover");
        applyPause();
      }
    };
    const onLeave = (e: PointerEvent) => {
      if (e.pointerType === "mouse") {
        pauses.delete("hover");
        applyPause();
      }
    };
    const onTouchDown = (e: PointerEvent) => {
      if (e.pointerType === "mouse") return;
      window.clearTimeout(touchTimer);
      pauses.add("touch");
      applyPause();
    };
    const onTouchUp = (e: PointerEvent) => {
      if (e.pointerType === "mouse") return;
      releasePress();
      window.clearTimeout(touchTimer);
      touchTimer = window.setTimeout(() => {
        pauses.delete("touch");
        applyPause();
      }, 1500);
    };
    const onFocusIn = () => {
      pauses.add("focus");
      applyPause();
    };
    const onFocusOut = () => {
      pauses.delete("focus");
      applyPause();
    };
    const onVisibility = () => {
      if (document.hidden) pauses.add("hidden");
      else pauses.delete("hidden");
      applyPause();
    };

    panelsEl.addEventListener("pointerdown", onDragDown);
    panelsEl.addEventListener("pointerdown", onPressDown);
    panelsEl.addEventListener("pointermove", onDragMove);
    panelsEl.addEventListener("pointerup", onDragUp);
    panelsEl.addEventListener("pointercancel", onDragUp);
    panelsEl.addEventListener("click", onClickCapture, true);
    sign?.addEventListener("pointerdown", swingSign);
    bulbRow?.addEventListener("pointerdown", flashBulbs);
    root.addEventListener("pointerenter", onEnter);
    root.addEventListener("pointerleave", onLeave);
    root.addEventListener("pointerdown", onTouchDown);
    window.addEventListener("pointerup", onTouchUp);
    window.addEventListener("pointercancel", onTouchUp);
    root.addEventListener("focusin", onFocusIn);
    root.addEventListener("focusout", onFocusOut);
    document.addEventListener("visibilitychange", onVisibility);

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) pauses.delete("offscreen");
        else pauses.add("offscreen");
        applyPause();
      },
      { threshold: 0.1 },
    );
    io.observe(root);

    /* ---------- load sequence (decorations only) + the few looping motions ---------- */

    run(() => {
      if (sign) gsap.set(sign, { transformOrigin: "50% -18px" });

      if (reduce) {
        gsap.set(flags, { scaleY: 1 });
        gsap.set(bulbs, { opacity: 1, scale: 1 });
        gsap.set(stars, { opacity: 0.8 });
        return;
      }

      let seen = false;
      try {
        seen = sessionStorage.getItem(SEEN_KEY) === "1";
      } catch {
        /* private mode */
      }

      const intro = gsap.timeline({
        defaults: { ease: "power3.out" },
        onComplete: () => {
          loopsReady = true;
          syncLoops();
          try {
            sessionStorage.setItem(SEEN_KEY, "1");
          } catch {
            /* private mode */
          }
        },
      });
      if (seen) intro.timeScale(2.2); // repeat visits: same moment, twice as fast

      intro
        // flags unfurl one by one, left to right
        .fromTo(
          flags,
          { scaleY: 0 },
          { scaleY: 1, duration: 0.55, ease: "back.out(2.4)", stagger: 0.022 },
          0.05,
        )
        .fromTo(
          stars,
          { opacity: 0 },
          {
            opacity: 0.85,
            duration: 0.8,
            stagger: { each: 0.06, from: "random" },
          },
          0.2,
        );

      if (sign) {
        // the signboard swings in on its ropes and settles
        intro
          .to(sign, { rotation: -5, duration: 0.28, ease: "sine.out" }, 0.35)
          .to(sign, { rotation: 3.5, duration: 0.34, ease: "sine.inOut" })
          .to(sign, { rotation: -2, duration: 0.34, ease: "sine.inOut" })
          .to(sign, { rotation: 0, duration: 0.5, ease: "sine.inOut" });
      }

      // festival bulbs switch on from both ends towards the middle
      intro.to(
        bulbs,
        {
          opacity: 1,
          scale: 1,
          duration: 0.3,
          stagger: { each: 0.07, from: "edges" },
        },
        0.7,
      );

      // idle: a slow wave along the flags, and a rare gust running through them
      loops.push(
        gsap.fromTo(
          flags,
          { rotation: -4 },
          {
            rotation: 4,
            duration: 1.7,
            ease: "sine.inOut",
            yoyo: true,
            repeat: -1,
            stagger: 0.07,
            paused: true,
          },
        ),
        gsap
          .timeline({ repeat: -1, repeatDelay: 7, delay: 2, paused: true })
          .to(flags, {
            skewX: 16,
            duration: 0.3,
            ease: "power2.out",
            stagger: 0.03,
          })
          .to(
            flags,
            {
              skewX: 0,
              duration: 0.9,
              ease: "elastic.out(1, 0.35)",
              stagger: 0.03,
            },
            ">-0.15",
          ),
      );

      // the best-price star pops now and then to draw the eye
      if (burst) {
        loops.push(
          gsap
            .timeline({ repeat: -1, repeatDelay: 5, paused: true })
            .to(burst, {
              scale: 1.2,
              rotation: 7,
              duration: 0.2,
              ease: "power2.out",
            })
            .to(burst, {
              scale: 1,
              rotation: 0,
              duration: 0.8,
              ease: "elastic.out(1, 0.35)",
            }),
        );
      }
    });

    if (n > 1 && !reduce) startProgress(FIRST_DELAY);

    return () => {
      window.clearTimeout(touchTimer);
      panelsEl.removeEventListener("pointerdown", onDragDown);
      panelsEl.removeEventListener("pointerdown", onPressDown);
      panelsEl.removeEventListener("pointermove", onDragMove);
      panelsEl.removeEventListener("pointerup", onDragUp);
      panelsEl.removeEventListener("pointercancel", onDragUp);
      panelsEl.removeEventListener("click", onClickCapture, true);
      sign?.removeEventListener("pointerdown", swingSign);
      bulbRow?.removeEventListener("pointerdown", flashBulbs);
      root.removeEventListener("pointerenter", onEnter);
      root.removeEventListener("pointerleave", onLeave);
      root.removeEventListener("pointerdown", onTouchDown);
      window.removeEventListener("pointerup", onTouchUp);
      window.removeEventListener("pointercancel", onTouchUp);
      root.removeEventListener("focusin", onFocusIn);
      root.removeEventListener("focusout", onFocusOut);
      document.removeEventListener("visibilitychange", onVisibility);
      io.disconnect();
      goToRef.current = null;
      ctx.revert();
    };
  }, [collections, fmt]);

  const onTabKey = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const next = (i + (e.key === "ArrowRight" ? 1 : -1) + count) % count;
    goToRef.current?.(next, true);
    document.getElementById(`bz-tab-${next}`)?.focus();
  };

  return (
    <section ref={rootRef} className={styles.root}>
      <div className={styles.stars} aria-hidden>
        {STARS.map(([left, top, size], i) => (
          <span
            key={i}
            data-twinkle
            className={styles.twinkle}
            style={{ left: `${left}%`, top, width: size, height: size }}
          />
        ))}
      </div>

      <div className={styles.bunting} aria-hidden>
        {Array.from({ length: FLAGS }, (_, i) => (
          <span
            key={i}
            data-flag
            style={{ background: SWATCHES[i % SWATCHES.length].main }}
          />
        ))}
      </div>

      <div className={styles.content}>
        {best && (
          <Link
            href={`/${locale}/product/${best.pick.slug}`}
            className={styles.burst}
            aria-label={`${copy.best}: ${best.pick.name[locale]}`}
          >
            <span className={styles.star} data-burst>
              <span className={styles.starText}>-{fmt.format(best.pct)}%</span>
            </span>
            <span className={styles.burstTag}>{copy.best}</span>
          </Link>
        )}

        <div className={styles.signWrap} data-sign>
          <p className={styles.brand}>{copy.brand}</p>
        </div>

        <h1 className={styles.headline}>{copy.headline}</h1>

        <div className={styles.searchWrap}>
          <HeroSearch />
        </div>

        <div className={styles.street}>
          <div className={styles.bulbs} data-bulbs aria-hidden>
            {Array.from({ length: BULBS }, (_, i) => {
              const t = i / (BULBS - 1);
              const sag = Math.round(2 * Math.sqrt(t * (1 - t)) * 12);
              return (
                <span
                  key={i}
                  data-bulb
                  className={styles.bulb}
                  style={
                    {
                      "--b": SWATCHES[i % SWATCHES.length].main,
                      "--sag": `${sag}px`,
                    } as BazaarVars
                  }
                />
              );
            })}
          </div>

          <div
            className={styles.stalls}
            role="tablist"
            aria-label={copy.stalls}
          >
            {collections.map((c, i) => (
              <button
                key={c.id}
                id={`bz-tab-${i}`}
                type="button"
                role="tab"
                data-stall
                aria-selected={i === active}
                aria-controls={`bz-panel-${i}`}
                tabIndex={i === active ? 0 : -1}
                className={styles.stall}
                style={{ ...swatchVars(i), "--i": String(i) } as BazaarVars}
                onClick={() => goToRef.current?.(i, true)}
                onKeyDown={(e) => onTabKey(e, i)}
              >
                <span className={styles.awning} data-awning aria-hidden />
                <span className={styles.counter}>{c.label[locale]}</span>
                <span className={styles.progress} data-prog aria-hidden />
              </button>
            ))}
          </div>

          <div ref={panelsRef} className={styles.panels}>
            {collections.map((c, i) => {
              const on = i === active;
              const shopHref = `/${locale}/shop?category=${encodeURIComponent(c.categorySlug)}`;
              // Only the first collection is visible on first paint. GSAP controls
              // the rest afterwards (these inline values never change in React).
              const panelStyle = {
                ...swatchVars(i),
                ...(i === 0 ? {} : { opacity: 0, visibility: "hidden" }),
              } as BazaarVars;
              return (
                <div
                  key={c.id}
                  id={`bz-panel-${i}`}
                  role="tabpanel"
                  data-panel
                  aria-labelledby={`bz-tab-${i}`}
                  aria-hidden={!on}
                  className={`${styles.panel} ${i === 0 ? styles.panelFirst : ""}`}
                  style={panelStyle}
                >
                  <div className={styles.board}>
                    <div className={styles.boardHead} data-head>
                      <strong className={styles.name}>{c.label[locale]}</strong>
                      <Link href={shopHref} className={styles.seeAll}>
                        {copy.seeAll}
                        <ArrowRight size={14} strokeWidth={2.4} />
                      </Link>
                    </div>

                    <ul className={styles.picks}>
                      {c.picks.map((p, k) => {
                        const href = p.slug
                          ? `/${locale}/product/${p.slug}`
                          : shopHref;
                        const off =
                          p.compareAt && p.compareAt > p.price
                            ? Math.round(
                                ((p.compareAt - p.price) / p.compareAt) * 100,
                              )
                            : 0;
                        return (
                          <li
                            key={p.id}
                            data-pick
                            className={styles.pick}
                            style={{ "--k": String(k) } as BazaarVars}
                          >
                            <Link
                              href={href}
                              className={styles.pickLink}
                              data-press
                            >
                              <span className={styles.thumb}>
                                <Image
                                  src={p.image || PLACEHOLDER_IMAGE}
                                  alt={p.name[locale]}
                                  width={160}
                                  height={160}
                                  sizes="160px"
                                  priority={i === 0 && k < 4}
                                  loading={i === 0 ? "eager" : "lazy"}
                                  data-real={Boolean(p.image)}
                                />
                                {off > 0 && (
                                  <span className={styles.off} data-off>
                                    -{fmt.format(off)}%
                                  </span>
                                )}
                              </span>
                              <span className={styles.pickName}>
                                {p.name[locale]}
                              </span>
                              <span className={styles.price}>
                                ৳
                                <span data-price={p.price}>
                                  {fmt.format(p.price)}
                                </span>
                                {p.compareAt ? (
                                  <s>৳{fmt.format(p.compareAt)}</s>
                                ) : null}
                              </span>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
