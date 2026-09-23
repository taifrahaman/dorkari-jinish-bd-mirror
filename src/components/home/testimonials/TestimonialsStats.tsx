// src/components/home/testimonials/TestimonialsStats.tsx

"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

import { testimonials } from "./testimonialsData";

type Props = {
  locale: "en" | "bn";
};

type Stat = {
  value: number;
  decimals: number;
  suffix: string;
  label: {
    en: string;
    bn: string;
  };
};

export default function TestimonialsStats({ locale }: Props) {
  const valueRefs = useRef<(HTMLSpanElement | null)[]>([]);

  const totalReviews = testimonials.length;

  const averageRating =
    totalReviews > 0
      ? testimonials.reduce(
          (total, testimonial) => total + testimonial.rating,
          0,
        ) / totalReviews
      : 0;

  const fiveStarPercentage =
    totalReviews > 0
      ? Math.round(
          (testimonials.filter((testimonial) => testimonial.rating === 5)
            .length /
            totalReviews) *
            100,
        )
      : 0;

  const stats: Stat[] = [
    {
      value: averageRating,
      decimals: 1,
      suffix: "/5",
      label: {
        en: "Average rating",
        bn: "গড় রেটিং",
      },
    },
    {
      value: totalReviews,
      decimals: 0,
      suffix: "",
      label: {
        en: "Customer reviews",
        bn: "কাস্টমার রিভিউ",
      },
    },
    {
      value: fiveStarPercentage,
      decimals: 0,
      suffix: "%",
      label: {
        en: "5-star ratings",
        bn: "৫-স্টার রেটিং",
      },
    },
  ];

  useEffect(() => {
    const animations: gsap.core.Tween[] = [];

    stats.forEach((stat, index) => {
      const element = valueRefs.current[index];

      if (!element) return;

      const counter = { value: 0 };

      const tween = gsap.to(counter, {
        value: stat.value,
        duration: 1.4,
        delay: index * 0.12,
        ease: "power2.out",
        onUpdate: () => {
          element.textContent = `${counter.value.toFixed(
            stat.decimals,
          )}${stat.suffix}`;
        },
      });

      animations.push(tween);
    });

    return () => {
      animations.forEach((animation) => animation.kill());
    };
  }, [stats]);

  return (
    <div className="grid grid-cols-3 border-y border-black/[0.08] py-6">
      {stats.map((stat, index) => (
        <div
          key={stat.label.en}
          className="flex flex-col items-center justify-center px-3 text-center"
        >
          <div className="text-2xl font-semibold tracking-tight text-[#172642] sm:text-3xl">
            <span
              ref={(element) => {
                valueRefs.current[index] = element;
              }}
            >
              0{stat.suffix}
            </span>
          </div>

          <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.12em] text-black/45 sm:text-xs">
            {stat.label[locale]}
          </p>
        </div>
      ))}
    </div>
  );
}
