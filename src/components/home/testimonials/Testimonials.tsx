// src/components/home/testimonials/Testimonials.tsx

"use client";

import TestimonialsHeader from "./TestimonialsHeader";
import TestimonialsMarquee from "./TestimonialsMarquee";
import TestimonialsTrust from "./TestimonialsTrust";
import styles from "./Testimonials.module.css";

type Props = {
  locale?: "en" | "bn";
};

export default function Testimonials({ locale = "en" }: Props) {
  return (
    <section className="relative overflow-hidden bg-[#faf8f5] py-20 sm:py-24 lg:py-28 mt-10">
      {/* Aurora background — gives glass/grain surfaces something
                to blur against, and blends white into brand color
                instead of a hard color block. */}
      <div className={styles.auroraBg} aria-hidden="true" />

      {/* Header */}
      <div className="relative z-10 mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        <TestimonialsHeader locale={locale} />

        <div className="mt-10 sm:mt-12">
          <TestimonialsTrust locale={locale} />
        </div>
      </div>

      {/* Full-width marquee */}
      <div className="relative z-10 mt-12 w-full sm:mt-14 lg:mt-16">
        <TestimonialsMarquee locale={locale} />
      </div>
    </section>
  );
}
