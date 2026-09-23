// src/components/home/testimonials/TestimonialCard.tsx

import { BadgeCheck, Quote, Star } from "lucide-react";

import type { Testimonial } from "./testimonialsData";
import styles from "./Testimonials.module.css";

type Locale = "bn" | "en";

type TestimonialCardProps = {
  testimonial: Testimonial;
  locale: Locale;
  verifiedLabel: string;
  tabIndex?: 0 | -1;
};

export default function TestimonialCard({
  testimonial,
  locale,
  verifiedLabel,
  tabIndex = 0,
}: TestimonialCardProps) {
  const banglaClass =
    locale === "bn" ||
    /[\u0980-\u09FF]/.test(`${testimonial.name}${testimonial.quote}`)
      ? "tracking-normal"
      : "";

  const initials = testimonial.name
    .trim()
    .split(/\s+/)
    .map((part) => part[0] ?? "")
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <article
      tabIndex={tabIndex}
      className={`${styles.card} relative flex w-[300px] shrink-0 flex-col gap-4 rounded-2xl border border-black/[0.07] bg-white p-6 sm:w-[340px]`}
    >
      <Quote
        className={`${styles.quoteMark} h-8 w-8 text-black/[0.08]`}
        strokeWidth={0}
        fill="currentColor"
        aria-hidden="true"
      />

      <div
        className="flex items-center gap-0.5"
        aria-label={`${testimonial.rating} out of 5 stars`}
      >
        {Array.from({ length: 5 }, (_, index) => (
          <Star
            key={index}
            className={`h-3.5 w-3.5 ${
              index < testimonial.rating
                ? "fill-amber-400 text-amber-400"
                : "fill-black/10 text-black/10"
            }`}
            strokeWidth={0}
            aria-hidden="true"
          />
        ))}
      </div>

      <p
        className={`text-[14.5px] leading-relaxed text-black/80 ${banglaClass}`}
      >
        {testimonial.quote}
      </p>

      <div className="mt-auto flex items-center gap-3 pt-1">
        <span
          className={`grid h-10 w-10 shrink-0 place-items-center rounded-full text-[13px] font-semibold ${
            styles[`avatar-${testimonial.palette}`]
          }`}
          aria-hidden="true"
        >
          {initials}
        </span>

        <div className="min-w-0">
          <p
            className={`truncate text-[13.5px] font-semibold text-black ${banglaClass}`}
          >
            {testimonial.name}
          </p>

          <p
            className={`flex items-center gap-1 truncate text-[12px] text-black/50 ${banglaClass}`}
          >
            {testimonial.city}

            {testimonial.verified && (
              <>
                <span aria-hidden="true">·</span>

                <BadgeCheck
                  className="h-3.5 w-3.5 text-emerald-600"
                  strokeWidth={2}
                  aria-hidden="true"
                />

                <span className="sr-only">{verifiedLabel}</span>
              </>
            )}
          </p>
        </div>
      </div>
    </article>
  );
}
