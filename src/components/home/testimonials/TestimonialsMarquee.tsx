// src/components/home/testimonials/TestimonialsMarquee.tsx

"use client";

import { useEffect, useMemo, useRef } from "react";
import gsap from "gsap";
import { BadgeCheck, Quote, Star } from "lucide-react";

import type { Testimonial } from "./testimonialsData";
import { testimonials } from "./testimonialsData";
import styles from "./Testimonials.module.css";

type Props = {
  locale: "en" | "bn";
};

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();
}

function TestimonialCard({
  testimonial,
  tabIndex,
}: {
  testimonial: Testimonial;
  tabIndex: number;
}) {
  return (
    <article tabIndex={tabIndex} className={`${styles.card} relative shrink-0`}>
      {/* Header */}
      <div className={styles.cardHeader}>
        <Quote
          className={`${styles.quoteMark} h-8 w-8`}
          strokeWidth={1.5}
          aria-hidden="true"
        />

        <div
          className={styles.rating}
          aria-label={`${testimonial.rating} out of 5 stars`}
        >
          {Array.from({ length: 5 }, (_, i) => (
            <Star
              key={i}
              className={`h-3.5 w-3.5 ${
                i < testimonial.rating
                  ? "fill-amber-400 text-amber-400"
                  : "fill-black/10 text-black/10"
              }`}
              strokeWidth={0}
              aria-hidden="true"
            />
          ))}
        </div>
      </div>

      {/* Review */}
      <p className={styles.reviewText}>{testimonial.quote}</p>

      {/* Customer */}
      <div className={styles.customer}>
        <span
          className={`${styles.avatar} ${
            styles[`avatar-${testimonial.palette}`]
          }`}
          aria-hidden="true"
        >
          {getInitials(testimonial.name)}
        </span>

        <div className={styles.customerInfo}>
          <div className={styles.customerNameRow}>
            <p className={styles.customerName}>{testimonial.name}</p>

            {testimonial.verified && (
              <BadgeCheck
                className={styles.verifiedIcon}
                strokeWidth={2}
                aria-label="Verified review"
              />
            )}
          </div>

          <p className={styles.customerCity}>{testimonial.city}</p>
        </div>
      </div>
    </article>
  );
}

export default function TestimonialsMarquee({ locale }: Props) {
  const rowRefs = useRef<(HTMLDivElement | null)[]>([]);

  const half = Math.ceil(testimonials.length / 2);

  /*
   * IMPORTANT: this must be memoized.
   *
   * `testimonials` is static, but without useMemo this array literal
   * gets a brand-new reference on every render of this component.
   * Since the GSAP effect below depends on `rows`, a new reference
   * re-triggers the effect: the existing tweens get killed and
   * recreated, which snaps each row's xPercent back to its start
   * value (0 or -50). That snap is what reads as "the marquee
   * suddenly resets / a new card pops in" after a while — it's not
   * actually the end of the loop, it's a re-render tearing the
   * animation down mid-cycle. Memoizing keeps the reference stable
   * so the effect only runs once on mount.
   */
  const rows = useMemo<
    {
      items: Testimonial[];
      direction: "left" | "right";
    }[]
  >(
    () => [
      {
        items: testimonials.slice(0, half),
        direction: "left",
      },
      {
        items: testimonials.slice(half),
        direction: "right",
      },
    ],
    [half],
  );

  useEffect(() => {
    const tweens: gsap.core.Tween[] = [];
    const cleanups: (() => void)[] = [];

    rowRefs.current.forEach((row, i) => {
      if (!row) return;

      const direction = rows[i].direction;
      const duration = i === 0 ? 44 : 52;

      /*
       * Keep the original seamless marquee mechanics:
       *
       * Row 1:  0% -> -50%
       * Row 2: -50% ->   0%
       *
       * Each row contains the exact same set of cards twice.
       */
      const tween =
        direction === "left"
          ? gsap.fromTo(
              row,
              {
                xPercent: 0,
              },
              {
                xPercent: -50,
                duration,
                ease: "none",
                repeat: -1,
              },
            )
          : gsap.fromTo(
              row,
              {
                xPercent: -50,
              },
              {
                xPercent: 0,
                duration,
                ease: "none",
                repeat: -1,
              },
            );

      tweens.push(tween);

      const viewport = row.parentElement;

      if (!viewport) return;

      const pause = () => tween.pause();
      const resume = () => tween.resume();

      viewport.addEventListener("mouseenter", pause);
      viewport.addEventListener("mouseleave", resume);
      viewport.addEventListener("focusin", pause);
      viewport.addEventListener("focusout", resume);

      cleanups.push(() => {
        viewport.removeEventListener("mouseenter", pause);
        viewport.removeEventListener("mouseleave", resume);
        viewport.removeEventListener("focusin", pause);
        viewport.removeEventListener("focusout", resume);
      });
    });

    return () => {
      cleanups.forEach((cleanup) => cleanup());
      tweens.forEach((tween) => tween.kill());
    };
  }, [rows]);

  return (
    <div className="w-full space-y-5">
      {rows.map((row, rowIndex) => (
        <div key={rowIndex} className={styles.marqueeViewport}>
          <div
            ref={(element) => {
              rowRefs.current[rowIndex] = element;
            }}
            className={styles.marqueeRow}
          >
            {[...row.items, ...row.items].map((testimonial, i) => (
              <div key={`${testimonial.id}-${i}`} className="pl-4 first:pl-0">
                <TestimonialCard
                  testimonial={testimonial}
                  tabIndex={i < row.items.length ? 0 : -1}
                />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
