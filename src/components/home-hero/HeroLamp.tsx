// src/components/home-hero/HeroLamp.tsx
"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
} from "react";
import gsap from "gsap";
import { Draggable } from "gsap/Draggable";
import styles from "./HomeHero.module.css";

gsap.registerPlugin(Draggable);

/* ---- cord + knob geometry (SVG units) ------------------------------------
 * Visually this is the original lamp: small knob dot with a thin progress ring.
 * Only the invisible hit circle is bigger, so it is still easy to grab on a phone.
 */
const CHAIN_X = 84;
const CHAIN_TOP = 164;
const KNOB_Y = 204;
const KNOB_DOT_R = 5;
const HIT_R = 28; // invisible touch target (~45px on phones)
const RING_R = 11;
export const RING_LENGTH = 2 * Math.PI * RING_R;
const CHAIN_BASE = KNOB_Y - KNOB_DOT_R; // chain ends on the top edge of the dot

/** Where the cord is fixed to the ceiling. */
const SWAY_ORIGIN = "60 50";

export type HeroLampHandle = {
  /** Plays the cord-pull motion only (carousel buttons, swipes, automatic pull). */
  pullVisual: () => void;
  /** One soft pulse of the bulb. */
  pulse: () => void;
  /** Fades out the hand-drawn arrow once the visitor has used any control. */
  dismissHint: () => void;
  /** The progress ring around the knob. */
  ring: SVGCircleElement | null;
};

type Props = {
  /** Called when the visitor pulls (drag, tap, or keyboard). */
  onPull: () => void;
  ariaLabel: string;
};

const HeroLamp = forwardRef<HeroLampHandle, Props>(function HeroLamp(
  { onPull, ariaLabel },
  ref,
) {
  const swayRef = useRef<SVGGElement>(null);
  const knobRef = useRef<SVGGElement>(null);
  const chainRef = useRef<SVGLineElement>(null);
  const bulbRef = useRef<SVGCircleElement>(null);
  const ringRef = useRef<SVGCircleElement>(null);
  const doodleRef = useRef<SVGSVGElement>(null);

  const onPullRef = useRef(onPull);
  onPullRef.current = onPull;

  const setChain = (y: number) =>
    chainRef.current?.setAttribute("y2", String(CHAIN_BASE + y));

  const pullVisual = () => {
    const knob = knobRef.current;
    if (!knob) return;
    gsap.killTweensOf(knob);
    const sync = () => setChain(gsap.getProperty(knob, "y") as number);
    gsap
      .timeline()
      .to(knob, { y: 18, duration: 0.16, ease: "power2.in", onUpdate: sync })
      .to(knob, {
        y: 0,
        duration: 0.7,
        ease: "elastic.out(1, 0.35)",
        onUpdate: sync,
      });
  };

  /** Small tug on mouse hover (desktop) to say "this moves". */
  const nudge = () => {
    const knob = knobRef.current;
    if (!knob || gsap.isTweening(knob)) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const sync = () => setChain(gsap.getProperty(knob, "y") as number);
    gsap
      .timeline()
      .to(knob, { y: 7, duration: 0.18, ease: "power2.out", onUpdate: sync })
      .to(knob, {
        y: 0,
        duration: 0.6,
        ease: "elastic.out(1, 0.4)",
        onUpdate: sync,
      });
  };

  const pulse = () => {
    const bulb = bulbRef.current;
    if (!bulb) return;
    gsap.fromTo(
      bulb,
      { scale: 1, svgOrigin: "60 168" },
      {
        scale: 1.45,
        svgOrigin: "60 168",
        duration: 0.14,
        yoyo: true,
        repeat: 1,
        ease: "power2.out",
      },
    );
  };

  const dismissHint = () => {
    doodleRef.current?.classList.add(styles.doodleOff);
  };

  /** A pull started on the lamp itself (tap, drag, keyboard). */
  const manualPull = (withVisual: boolean) => {
    dismissHint();
    if (withVisual) pullVisual();
    onPullRef.current();
  };

  useImperativeHandle(
    ref,
    () => ({
      pullVisual,
      pulse,
      dismissHint,
      get ring() {
        return ringRef.current;
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useEffect(() => {
    const sway = swayRef.current;
    const knob = knobRef.current;
    if (!sway || !knob) return;

    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const ctx = gsap.context(() => {
      if (!reduce) {
        gsap.fromTo(
          sway,
          { rotation: -1.8, svgOrigin: SWAY_ORIGIN },
          {
            rotation: 1.8,
            svgOrigin: SWAY_ORIGIN,
            duration: 3.4,
            ease: "sine.inOut",
            yoyo: true,
            repeat: -1,
          },
        );
      }
    });

    const [drag] = Draggable.create(knob, {
      type: "y",
      bounds: { minY: 0, maxY: 34 },
      zIndexBoost: false,
      onDrag() {
        setChain(this.y);
      },
      onRelease() {
        const pulled = this.y > 14;
        gsap.to(knob, {
          y: 0,
          duration: 0.7,
          ease: "elastic.out(1, 0.35)",
          onUpdate: () => setChain(gsap.getProperty(knob, "y") as number),
        });
        if (pulled) manualPull(false);
      },
      onClick() {
        manualPull(true);
      },
    });

    return () => {
      drag.kill();
      gsap.killTweensOf([knob, bulbRef.current]);
      ctx.revert();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onWrapClick = (e: MouseEvent<HTMLDivElement>) => {
    // the knob handles its own taps through Draggable
    if ((e.target as Element).closest("[data-knob]")) return;
    manualPull(true);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      manualPull(true);
    }
  };

  const onPointerEnter = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "mouse") nudge();
  };

  return (
    <div
      className={styles.lamp}
      role="button"
      tabIndex={0}
      aria-label={ariaLabel}
      onClick={onWrapClick}
      onKeyDown={onKeyDown}
      onPointerEnter={onPointerEnter}
    >
      <svg
        className={styles.lampSvg}
        viewBox="0 0 120 232"
        aria-hidden="true"
        focusable="false"
      >
        <g ref={swayRef}>
          {/* ceiling cord */}
          <line x1="60" y1="50" x2="60" y2="104" className={styles.stroke} />
          <rect
            x="54"
            y="100"
            width="12"
            height="12"
            rx="3"
            className={styles.stroke}
          />
          <path
            d="M26 164 C26 128 44 112 60 112 C76 112 94 128 94 164 Z"
            className={`${styles.stroke} ${styles.shade}`}
          />
          {/* large invisible tap target over the shade */}
          <rect x="14" y="98" width="92" height="84" fill="transparent" />
          <circle
            ref={bulbRef}
            cx="60"
            cy="168"
            r="9"
            className={styles.bulb}
          />

          {/* pull chain: straight down from the rim to the knob */}
          <line
            ref={chainRef}
            x1={CHAIN_X}
            y1={CHAIN_TOP}
            x2={CHAIN_X}
            y2={CHAIN_BASE}
            className={styles.stroke}
          />
          <g ref={knobRef} data-knob className={styles.knob}>
            <circle cx={CHAIN_X} cy={KNOB_Y} r={HIT_R} fill="transparent" />
            <circle
              cx={CHAIN_X}
              cy={KNOB_Y}
              r={KNOB_DOT_R}
              className={styles.knobDot}
            />
            <circle
              ref={ringRef}
              className={styles.ring}
              cx={CHAIN_X}
              cy={KNOB_Y}
              r={RING_R}
              transform={`rotate(-90 ${CHAIN_X} ${KNOB_Y})`}
              style={{
                strokeDasharray: RING_LENGTH,
                strokeDashoffset: RING_LENGTH,
              }}
            />
          </g>
        </g>
      </svg>

      {/* hand-drawn arrow: draws itself once, then gently points at the knob */}
      <svg
        ref={doodleRef}
        className={styles.doodle}
        viewBox="0 0 64 48"
        aria-hidden="true"
        focusable="false"
      >
        <path
          className={styles.doodleLine}
          pathLength={1}
          d="M60 6 C44 2 24 8 26 22 C28 33 42 30 38 19 C35 11 20 16 12 34"
        />
        <path className={styles.doodleHead} d="M18.3 29.1 L12 34 L11.5 26" />
      </svg>
    </div>
  );
});

export default HeroLamp;
