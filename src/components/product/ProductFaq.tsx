// src/components/product/ProductFaq.tsx

"use client";

import { useEffect, useRef, useState } from "react";
import { Plus } from "lucide-react";
import gsap from "gsap";

import type { StorefrontFaq } from "@/lib/product/types";
import type { Locale } from "@/lib/shop/types";

function FaqRow({
  item,
  locale,
  open,
  onToggle,
}: {
  item: StorefrontFaq;
  locale: Locale;
  open: boolean;
  onToggle: () => void;
}) {
  const contentRef = useRef<HTMLDivElement>(null);
  const iconRef = useRef<HTMLSpanElement>(null);
  const barRef = useRef<HTMLSpanElement>(null);
  const mounted = useRef(false);

  useEffect(() => {
    const content = contentRef.current;
    const icon = iconRef.current;
    const bar = barRef.current;
    if (!content || !icon || !bar) return;

    if (!mounted.current) {
      gsap.set(content, { height: open ? "auto" : 0 });
      gsap.set(icon, { rotate: open ? 45 : 0 });
      gsap.set(bar, { scaleY: open ? 1 : 0 });
      mounted.current = true;
      return;
    }

    gsap.to(content, {
      height: open ? "auto" : 0,
      duration: 0.36,
      ease: "power3.out",
    });
    // Slight overshoot on the "+" -> "×" morph, the one deliberately playful touch.
    gsap.to(icon, {
      rotate: open ? 45 : 0,
      duration: 0.45,
      ease: open ? "back.out(2.4)" : "power2.out",
    });
    gsap.to(bar, {
      scaleY: open ? 1 : 0,
      transformOrigin: "top",
      duration: 0.32,
      ease: "power2.out",
      delay: open ? 0.05 : 0,
    });
  }, [open]);

  return (
    <div className="relative border-b border-brand-border py-1 pl-4">
      <span
        ref={barRef}
        aria-hidden
        className="absolute left-0 top-1 h-[calc(100%-0.5rem)] w-0.5 rounded-full bg-brand-primary"
        style={{ transform: "scaleY(0)" }}
      />
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 py-4 text-left"
      >
        <span className="text-sm font-semibold text-brand-text sm:text-base">
          {item.question[locale]}
        </span>
        <span
          ref={iconRef}
          className="grid h-7 w-7 flex-none place-items-center rounded-full bg-brand-navbar text-brand-text"
          style={{ transform: "rotate(0deg)" }}
        >
          <Plus className="h-3.5 w-3.5" aria-hidden />
        </span>
      </button>
      <div ref={contentRef} className="overflow-hidden" style={{ height: 0 }}>
        <p className="pb-4 pr-10 text-sm leading-relaxed text-brand-text-secondary">
          {item.answer[locale]}
        </p>
      </div>
    </div>
  );
}

export default function ProductFaq({
  faqs,
  locale = "en",
}: {
  faqs: StorefrontFaq[];
  locale?: Locale;
}) {
  const [openId, setOpenId] = useState<string | null>(faqs[0]?.id ?? null);

  return (
    <section aria-labelledby="faq-heading">
      <h2
        id="faq-heading"
        className="mb-2 font-heading text-xl font-bold text-brand-text sm:text-2xl"
      >
        {locale === "bn" ? "সচরাচর জিজ্ঞাসা" : "Frequently asked questions"}
      </h2>
      <div>
        {faqs.map((item) => (
          <FaqRow
            key={item.id}
            item={item}
            locale={locale}
            open={openId === item.id}
            onToggle={() =>
              setOpenId((current) => (current === item.id ? null : item.id))
            }
          />
        ))}
      </div>
    </section>
  );
}
