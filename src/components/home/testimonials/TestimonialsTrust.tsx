// src/components/home/testimonials/TestimonialsTrust.tsx

"use client";

import { useLayoutEffect, useRef } from "react";
import { BadgeCheck, Gem, Headphones, PackageCheck } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import styles from "./TestimonialsTrust.module.css";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

type Props = {
  locale: "en" | "bn";
};

type Accent = {
  light: string;
  base: string;
  shadow: string;
};

type TrustItem = {
  id: string;
  title: { en: string; bn: string };
  description: { en: string; bn: string };
  icon: typeof Gem;
  accent: Accent;
};

const trustItems: TrustItem[] = [
  {
    id: "original",
    title: { en: "Original Products", bn: "অরিজিনাল প্রোডাক্ট" },
    description: {
      en: "Genuine products, sourced with care",
      bn: "যত্নসহকারে সংগ্রহ করা আসল পণ্য",
    },
    icon: Gem,
    accent: {
      light: "#ffcc66",
      base: "#fba705",
      shadow: "rgba(251,167,5,0.35)",
    },
  },
  {
    id: "quality",
    title: { en: "Quality Guarantee", bn: "কোয়ালিটি গ্যারান্টি" },
    description: {
      en: "Quality checked before dispatch",
      bn: "ডিসপ্যাচের আগে মান যাচাই করা হয়",
    },
    icon: BadgeCheck,
    accent: {
      light: "#7fb0a6",
      base: "#4f8a7e",
      shadow: "rgba(79,138,126,0.35)",
    },
  },
  {
    id: "packaging",
    title: { en: "Secure Packaging", bn: "নিরাপদ প্যাকেজিং" },
    description: {
      en: "Carefully packed for safe delivery",
      bn: "নিরাপদ ডেলিভারির জন্য যত্নসহকারে প্যাক করা",
    },
    icon: PackageCheck,
    accent: {
      light: "#e0a184",
      base: "#c1673f",
      shadow: "rgba(193,103,63,0.35)",
    },
  },
  {
    id: "support",
    title: { en: "Responsive Support", bn: "দ্রুত সাপোর্ট" },
    description: {
      en: "Helpful support when you need it",
      bn: "প্রয়োজনে দ্রুত সহযোগিতা",
    },
    icon: Headphones,
    accent: {
      light: "#4a5f82",
      base: "#172642",
      shadow: "rgba(23,38,66,0.35)",
    },
  },
];

// Two corner-radius states the blob eases between, forever. Kept as
// plain numbers per corner (no elliptical "/" values) so GSAP can
// tween each one as a normal numeric property.
const BLOB_A = { tl: 42, tr: 58, br: 63, bl: 37 };
const BLOB_B = { tl: 60, tr: 40, br: 38, bl: 62 };

function applyBlobRadius(el: HTMLElement, r: typeof BLOB_A) {
  el.style.borderRadius = `${r.tl}% ${r.tr}% ${r.br}% ${r.bl}% / ${r.bl}% ${r.tl}% ${r.tr}% ${r.br}%`;
}

export default function TestimonialsTrust({ locale }: Props) {
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const cellRefs = useRef<(HTMLDivElement | null)[]>([]);
  const blobRefs = useRef<(HTMLDivElement | null)[]>([]);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      mm.add(
        {
          reduce: "(prefers-reduced-motion: reduce)",
          animate: "(prefers-reduced-motion: no-preference)",
        },
        (context) => {
          const { reduce } = context.conditions as {
            reduce: boolean;
          };

          if (reduce) {
            gsap.set(cellRefs.current, {
              opacity: 1,
              y: 0,
              scale: 1,
            });
            return;
          }

          // ---- Entrance: pop in, staggered, once, on scroll ----
          gsap
            .timeline({
              scrollTrigger: {
                trigger: sectionRef.current,
                start: "top 82%",
                once: true,
              },
            })
            .from(cellRefs.current, {
              opacity: 0,
              y: 26,
              scale: 0.9,
              duration: 0.65,
              ease: "back.out(1.6)",
              stagger: 0.1,
            });

          // ---- Continuous blob morph + gentle float ----
          blobRefs.current.forEach((blob, i) => {
            if (!blob) return;

            const state = { ...BLOB_A };

            gsap.to(state, {
              ...BLOB_B,
              duration: 5 + i * 0.4,
              repeat: -1,
              yoyo: true,
              ease: "sine.inOut",
              delay: i * 0.25,
              onUpdate: () => applyBlobRadius(blob, state),
            });

            gsap.to(blob, {
              y: -5,
              rotation: i % 2 === 0 ? 3 : -3,
              duration: 3.2 + i * 0.3,
              repeat: -1,
              yoyo: true,
              ease: "sine.inOut",
              delay: i * 0.2,
            });
          });
        },
      );

      return () => mm.revert();
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={sectionRef}
      className="grid grid-cols-2 border-y border-black/[0.07] sm:grid-cols-4"
    >
      {trustItems.map((item, index) => {
        const Icon = item.icon;

        return (
          <div
            key={item.id}
            ref={(el) => {
              cellRefs.current[index] = el;
            }}
            style={
              {
                "--accent": item.accent.base,
                "--accent-light": item.accent.light,
                "--accent-shadow": item.accent.shadow,
              } as React.CSSProperties
            }
            className={`${styles.cell} group flex flex-col items-center gap-3 px-4 py-8 text-center sm:px-5 lg:px-7 ${
              index < trustItems.length - 1
                ? "border-black/[0.07] sm:border-r"
                : ""
            } ${index < 2 ? "border-b sm:border-b-0" : ""}`}
          >
            <div className={styles.blobWrap}>
              <span className={styles.blobGlow} aria-hidden="true" />

              <div
                ref={(el) => {
                  blobRefs.current[index] = el;
                }}
                className={styles.blob}
              >
                <Icon
                  className={`${styles.icon} h-7 w-7 sm:h-8 sm:w-8`}
                  strokeWidth={1.8}
                />
              </div>
            </div>

            <div>
              <h3 className="text-[13.5px] font-bold tracking-[-0.01em] text-[#172642] sm:text-[14.5px]">
                {item.title[locale]}
              </h3>

              <p className="mx-auto mt-1.5 max-w-[190px] text-[11.5px] leading-[1.5] text-black/45 sm:text-[12px]">
                {item.description[locale]}
              </p>
            </div>

            <span className={styles.underline} aria-hidden="true" />
          </div>
        );
      })}
    </div>
  );
}
