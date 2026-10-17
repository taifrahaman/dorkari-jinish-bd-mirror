// src/components/home-hero/HomeHero.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import {
  Truck,
  Banknote,
  ChevronLeft,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";
import gsap from "gsap";

import HeroSearch from "@/components/hero/HeroSearch";
import type { CategoryNode } from "@/components/navigation/navItems";
import { iconForCategory } from "./categoryIcons";
import HeroLamp, { RING_LENGTH, type HeroLampHandle } from "./HeroLamp";
import CollectionPanel from "./CollectionPanel";
import {
  HERO_COLLECTIONS,
  type CSSVars,
  type HeroCollection,
  type Lang,
} from "./heroCollections";
import styles from "./HomeHero.module.css";

/** seconds before the first automatic pull / between pulls / max automatic pulls */
const FIRST_DELAY = 6;
const INTERVAL = 7;
const MAX_AUTO = 4;

/** swipe: minimum horizontal distance (px) to count as a swipe */
const SWIPE_MIN = 48;

const COPY: Record<
  Lang,
  {
    brand: string;
    headline: string;
    lampLabel: string;
    eyebrow: string;
    seeAll: string;
    collections: string;
    prev: string;
    next: string;
    trust: Array<{ icon: LucideIcon; text: string }>;
  }
> = {
  bn: {
    brand: "দরকারি জিনিশ",
    headline: "দরকারি সবকিছু, এক সুইচেই",
    lampLabel: "পরের কালেকশন দেখতে বাতির দড়ি টানুন",
    eyebrow: "আজকের পছন্দ",
    seeAll: "সব দেখুন",
    collections: "কালেকশন",
    prev: "আগের কালেকশন",
    next: "পরের কালেকশন",
    trust: [
      { icon: Truck, text: "সারা দেশে ডেলিভারি" },
      { icon: Banknote, text: "ক্যাশ অন ডেলিভারি" },
    ],
  },
  en: {
    brand: "Dorkari Jinish",
    headline: "Everything you need, one switch away",
    lampLabel: "Pull the cord to see the next collection",
    eyebrow: "Today's picks",
    seeAll: "See all",
    collections: "Collections",
    prev: "Previous collection",
    next: "Next collection",
    trust: [
      { icon: Truck, text: "Delivery across Bangladesh" },
      { icon: Banknote, text: "Cash on delivery" },
    ],
  },
};

type Props = {
  categories: CategoryNode[];
  collections?: HeroCollection[];
};

export default function HomeHero({
  categories,
  collections = HERO_COLLECTIONS,
}: Props) {
  const locale: Lang = useLocale() === "bn" ? "bn" : "en";
  const copy = COPY[locale];
  const fmt = useMemo(
    () => new Intl.NumberFormat(locale === "bn" ? "bn-BD" : "en-US"),
    [locale],
  );

  const rootRef = useRef<HTMLElement>(null);
  const lampRef = useRef<HeroLampHandle>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef(0);
  const goToRef = useRef<
    ((i: number, manual?: boolean, pull?: boolean) => void) | null
  >(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const glows = Array.from(root.querySelectorAll<HTMLElement>("[data-glow]"));
    const panels = Array.from(
      root.querySelectorAll<HTMLElement>("[data-panel]"),
    );
    const panelsEl = root.querySelector<HTMLElement>("[data-panels]");
    const animEls = panels.map((p) =>
      Array.from(p.querySelectorAll<HTMLElement>("[data-anim]")),
    );
    const lamp = lampRef.current;
    const ring = lamp?.ring ?? null;
    if (panels.length < 2 || glows.length < 2) return;

    let glowIdx = 0;
    let autoCount = 0;
    let ringTween: gsap.core.Tween | null = null;
    let tl: gsap.core.Timeline | null = null;
    let touchTimer = 0;
    const pauses = new Set<string>();

    // Everything created later (timers, clicks) is registered in this context
    // so ctx.revert() cleans it up.
    const ctx = gsap.context(() => {});
    const scoped = (fn: () => void) => ctx.add(fn);

    const applyPause = () => ringTween?.paused(pauses.size > 0);

    const startTimer = (seconds: number) =>
      scoped(() => {
        ringTween?.kill();
        ringTween = null;
        if (!ring) return;
        gsap.set(ring, { strokeDashoffset: RING_LENGTH, opacity: 1 });
        if (reduce || autoCount >= MAX_AUTO) {
          gsap.to(ring, { opacity: 0, duration: 0.3 });
          return;
        }
        ringTween = gsap.to(ring, {
          strokeDashoffset: 0,
          duration: seconds,
          ease: "none",
          onComplete: () => {
            autoCount += 1;
            lamp?.pullVisual();
            goTo((activeRef.current + 1) % panels.length);
          },
        });
        applyPause();
      });

    const goTo = (next: number, manual = false) =>
      scoped(() => {
        const prev = activeRef.current;
        if (next === prev || next < 0 || next >= panels.length) return;

        // Once the visitor takes control (tab, swipe, arrow, lamp),
        // stop the automatic pulls so the content never moves on its own again.
        if (manual) {
          autoCount = MAX_AUTO;
          lamp?.dismissHint();
        }

        tl?.progress(1);

        activeRef.current = next;
        setActive(next);
        root.style.setProperty("--rgb", collections[next].glow);

        const gOut = glows[glowIdx];
        const gIn = glows[1 - glowIdx];
        gIn.style.setProperty("--rgb", collections[next].glow);
        glowIdx = 1 - glowIdx;

        if (reduce) {
          gsap.set(gOut, { opacity: 0 });
          gsap.set(gIn, { opacity: 0.6, scale: 1 });
          gsap.set(panels[prev], { autoAlpha: 0 });
          gsap.set(panels[next], { autoAlpha: 1 });
          gsap.set(animEls[next], { clearProps: "opacity,transform" });
          startTimer(INTERVAL);
          return;
        }

        tl = gsap.timeline({ defaults: { ease: "power3.out" } });
        tl.add(() => lamp?.pulse(), 0)
          .to(gOut, { opacity: 0, duration: 1, ease: "power1.inOut" }, 0)
          .fromTo(
            gIn,
            { opacity: 0, scale: 0.7 },
            { opacity: 0.6, scale: 1, duration: 1.1 },
            0,
          )
          .to(
            animEls[prev],
            {
              y: -10,
              opacity: 0,
              duration: 0.25,
              stagger: 0.03,
              ease: "power2.in",
            },
            0,
          )
          .set(panels[prev], { autoAlpha: 0 }, 0.4)
          .set(panels[next], { autoAlpha: 1 }, 0.4)
          .fromTo(
            animEls[next],
            { y: 16, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.55, stagger: 0.06 },
            0.4,
          );

        startTimer(INTERVAL);
      });

    // `pull` = also pull the lamp cord (tabs, arrows). When the lamp itself
    // started the change it has already animated, so it passes pull = false.
    goToRef.current = (i, manual, pull) => {
      if (pull && i !== activeRef.current) lamp?.pullVisual();
      goTo(i, manual);
    };

    /* ---------- swipe left / right on the product panel (touch + pen) ---------- */
    let sx = 0;
    let sy = 0;
    let tracking = false;
    let swiped = false;

    const onSwipeDown = (e: PointerEvent) => {
      if (e.pointerType === "mouse") return;
      tracking = true;
      sx = e.clientX;
      sy = e.clientY;
    };
    const onSwipeUp = (e: PointerEvent) => {
      if (!tracking) return;
      tracking = false;
      const dx = e.clientX - sx;
      const dy = e.clientY - sy;
      if (Math.abs(dx) < SWIPE_MIN || Math.abs(dx) < Math.abs(dy) * 1.5) return;
      // swallow the click that would follow, so a swipe never opens a product
      swiped = true;
      window.setTimeout(() => {
        swiped = false;
      }, 60);
      const n = panels.length;
      lamp?.pullVisual();
      goTo((activeRef.current + (dx < 0 ? 1 : n - 1)) % n, true);
    };
    const onSwipeCancel = () => {
      tracking = false;
    };
    const onSwipeClick = (e: MouseEvent) => {
      if (!swiped) return;
      e.preventDefault();
      e.stopPropagation();
    };

    panelsEl?.addEventListener("pointerdown", onSwipeDown);
    panelsEl?.addEventListener("pointerup", onSwipeUp);
    panelsEl?.addEventListener("pointercancel", onSwipeCancel);
    panelsEl?.addEventListener("click", onSwipeClick, true);

    /* ---------- when to pause the automatic pulls ---------- */
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
    const onDown = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") {
        window.clearTimeout(touchTimer);
        pauses.add("touch");
        applyPause();
      }
    };
    const onUp = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") {
        window.clearTimeout(touchTimer);
        touchTimer = window.setTimeout(() => {
          pauses.delete("touch");
          applyPause();
        }, 1500);
      }
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

    root.addEventListener("pointerenter", onEnter);
    root.addEventListener("pointerleave", onLeave);
    root.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    root.addEventListener("focusin", onFocusIn);
    root.addEventListener("focusout", onFocusOut);
    document.addEventListener("visibilitychange", onVisibility);

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) pauses.delete("offscreen");
        else pauses.add("offscreen");
        applyPause();
      },
      { threshold: 0.25 },
    );
    io.observe(root);

    startTimer(FIRST_DELAY);

    return () => {
      window.clearTimeout(touchTimer);
      panelsEl?.removeEventListener("pointerdown", onSwipeDown);
      panelsEl?.removeEventListener("pointerup", onSwipeUp);
      panelsEl?.removeEventListener("pointercancel", onSwipeCancel);
      panelsEl?.removeEventListener("click", onSwipeClick, true);
      root.removeEventListener("pointerenter", onEnter);
      root.removeEventListener("pointerleave", onLeave);
      root.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      root.removeEventListener("focusin", onFocusIn);
      root.removeEventListener("focusout", onFocusOut);
      document.removeEventListener("visibilitychange", onVisibility);
      io.disconnect();
      goToRef.current = null;
      ctx.revert();
    };
  }, [collections, locale]);

  /* keep the active tab centred in the (horizontally scrollable) tab row */
  useEffect(() => {
    const box = tabsRef.current;
    const el = box?.children[active] as HTMLElement | undefined;
    if (!box || !el) return;
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const left = el.offsetLeft - (box.clientWidth - el.offsetWidth) / 2;
    box.scrollTo({
      left: Math.max(0, left),
      behavior: reduce ? "auto" : "smooth",
    });
  }, [active]);

  const step = (delta: number, pull = true) =>
    goToRef.current?.(
      (activeRef.current + delta + collections.length) % collections.length,
      true,
      pull,
    );

  // the lamp already animates its own cord, so no extra pull here
  const pullNext = () => step(1, false);

  const rootVars: CSSVars = { "--rgb": collections[0].glow };

  return (
    <section ref={rootRef} className={styles.root} style={rootVars}>
      {/* two glow layers that crossfade between collection colors */}
      <div
        className={styles.glow}
        data-glow
        aria-hidden
        style={{ "--rgb": collections[0].glow, opacity: 0.6 } as CSSVars}
      />
      <div
        className={styles.glow}
        data-glow
        aria-hidden
        style={{ opacity: 0 }}
      />

      <HeroLamp ref={lampRef} onPull={pullNext} ariaLabel={copy.lampLabel} />

      <div className={styles.content}>
        <p className={styles.brand}>{copy.brand}</p>

        <h1 className={styles.headline}>{copy.headline}</h1>

        <div className={styles.searchWrap}>
          <HeroSearch categories={categories} />
        </div>

        <ul className={styles.chips}>
          {copy.trust.map(({ icon: Icon, text }) => (
            <li key={text} className={styles.chip}>
              <span className={styles.chipIcon}>
                <Icon size={15} strokeWidth={2} />
              </span>
              <span>{text}</span>
            </li>
          ))}
        </ul>

        {/* ---------------- Collections ---------------- */}
        <div className={styles.collection}>
          {/* labelled tabs: the obvious way to switch collection */}
          <div
            ref={tabsRef}
            className={styles.tabs}
            role="group"
            aria-label={copy.collections}
          >
            {collections.map((s, i) => (
              <button
                key={s.id}
                type="button"
                className={styles.tab}
                aria-current={i === active}
                style={{ "--tab-rgb": s.glow } as CSSVars}
                onClick={() => goToRef.current?.(i, true, true)}
              >
                {s.label[locale]}
              </button>
            ))}
          </div>

          <span className={styles.srOnly} aria-live="polite">
            {collections[active].label[locale]}
          </span>

          {/* prev / next arrows: shown on desktop with a mouse; phones swipe */}
          <button
            type="button"
            className={`${styles.arrow} ${styles.arrowPrev}`}
            aria-label={copy.prev}
            onClick={() => step(-1)}
          >
            <ChevronLeft size={22} strokeWidth={2.2} />
          </button>
          <button
            type="button"
            className={`${styles.arrow} ${styles.arrowNext}`}
            aria-label={copy.next}
            onClick={() => step(1)}
          >
            <ChevronRight size={22} strokeWidth={2.2} />
          </button>

          <div className={styles.panels} data-panels>
            {collections.map((s, i) => (
              <CollectionPanel
                key={s.id}
                collection={s}
                index={i}
                active={i === active}
                locale={locale}
                eyebrow={copy.eyebrow}
                seeAll={copy.seeAll}
                fmt={fmt}
              />
            ))}
          </div>
        </div>

        {/* ---------------- Category tiles ---------------- */}
        <ul className={styles.tiles}>
          {categories.map((c) => {
            const Icon = iconForCategory(c.slug);
            return (
              <li key={c.slug} className={styles.tile}>
                <Link
                  href={`/${locale}/shop?category=${encodeURIComponent(c.slug)}`}
                  className={styles.tileLink}
                >
                  <span className={styles.ico}>
                    <Icon size={24} strokeWidth={1.5} />
                  </span>
                  <span className={styles.label}>{c.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
