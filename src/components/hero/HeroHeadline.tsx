// src/components/hero/HeroHeadline.tsx
"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { SplitText } from "gsap/SplitText";
import styles from "./HeroHeadline.module.css";

gsap.registerPlugin(SplitText);

type Props = {
  items: string[];
  /** Time each headline stays visible, in ms */
  interval?: number;
};

export default function HeroHeadline({ items, interval = 18000 }: Props) {
  const rootRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const el = rootRef.current;
    if (!el || items.length === 0) return;

    let split: SplitText | null = null;
    let idx = 0;

    const buildAndAnimateIn = () => {
      split?.revert();
      el.textContent = items[idx];

      split = new SplitText(el, { type: "lines" });

      // Wrap each line in a mask container (styled via CSS module class)
      split.lines.forEach((line) => {
        const lineEl = line as HTMLElement;
        const wrap = document.createElement("div");
        wrap.className = styles.lineMask;
        lineEl.parentNode?.insertBefore(wrap, lineEl);
        wrap.appendChild(lineEl);
      });

      gsap.from(split.lines, {
        yPercent: 115,
        opacity: 0,
        duration: 1.2,
        stagger: 0.08,
        ease: "power4.out",
      });
    };

    buildAndAnimateIn();

    const tick = () => {
      if (!split) return;
      gsap.to(split.lines, {
        yPercent: -115,
        opacity: 0,
        duration: 0.8,
        stagger: 0.06,
        ease: "power3.in",
        onComplete: () => {
          idx = (idx + 1) % items.length;
          buildAndAnimateIn();
        },
      });
    };

    const id = window.setInterval(tick, interval);

    return () => {
      window.clearInterval(id);
      split?.revert();
    };
  }, [items, interval]);

  return <h1 ref={rootRef} className={styles.headline} />;
}
