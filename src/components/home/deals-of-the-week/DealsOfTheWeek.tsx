// src/components/home/deals-of-the-week/DealsOfTheWeek.tsx

"use client";

import Image from "next/image";
import { useLocale } from "next-intl";
import { dealsOfTheWeek } from "./dealsOfTheWeekData";
import type { DealProduct } from "./dealsOfTheWeek.types";
import GrainGradient from "@/components/shared/GrainGradient";
import Button from "@/components/shared/Button";

type Locale = "en" | "bn";

type DealsOfTheWeekProps = {
  locale?: Locale;
};

const CARD_PALETTES = [
  { from: "#f7f1e4", mid: "#ebdfc6", to: "#d6c5a3" },
  { from: "#eef2e8", mid: "#dde4d2", to: "#bcc7a8" },
] as const;

const sectionContent = {
  en: {
    title: "Weekly Deals",
    description:
      "Two carefully selected essentials, available this week at a special price.",
    dealLabel: "WEEKLY DEAL",
    detailsLabel: "Details",
    nowLabel: "Now",
    shopNow: "Shop Now",
  },
  bn: {
    title: "সাপ্তাহিক অফার",
    description: "এই সপ্তাহের জন্য বেছে নেওয়া দুটি দরকারি পণ্য, বিশেষ দামে।",
    dealLabel: "সাপ্তাহিক অফার",
    detailsLabel: "বিস্তারিত",
    nowLabel: "বর্তমান মূল্য",
    shopNow: "এখনই দেখুন",
  },
};

function formatPrice(price: number, locale: Locale) {
  return new Intl.NumberFormat(locale === "bn" ? "bn-BD" : "en-BD", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 0,
  }).format(price);
}

function calculateDiscount(price: number, originalPrice: number) {
  return Math.round(((originalPrice - price) / originalPrice) * 100);
}

function DealCard({
  product,
  locale,
  paletteIndex,
}: {
  product: DealProduct;
  locale: Locale;
  paletteIndex: number;
}) {
  const content = sectionContent[locale];
  const discount = calculateDiscount(product.price, product.originalPrice);
  const isBangla = locale === "bn";
  const banglaClass = isBangla ? "tracking-normal" : "";
  const palette = CARD_PALETTES[paletteIndex % CARD_PALETTES.length];

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-xl border border-black/[0.08] bg-white transition-[border-color,box-shadow] duration-300 hover:border-black/[0.18] hover:shadow-[0_10px_30px_-14px_rgba(0,0,0,0.18)]">
      <GrainGradient
        id={`deal-${product.id}-card`}
        from={palette.from}
        mid={palette.mid}
        to={palette.to}
        opacity={1}
        grainFrequency={0.8}
        className="pointer-events-none absolute inset-0 z-0 h-full w-full"
      />

      <div
        className="pointer-events-none absolute inset-0 z-[1]"
        style={{
          background:
            "linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0) 55%, rgba(255,255,255,0.35) 100%)",
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 flex flex-1 flex-col">
        <div className="relative aspect-[5/3] overflow-hidden">
          <Image
            src={product.image}
            alt={product.name[locale]}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="z-10 object-contain p-6 transition-transform duration-700 ease-out group-hover:scale-[1.03] sm:p-8 md:p-9"
          />

          <div className="absolute right-3 top-3 z-20 inline-flex items-center rounded-full bg-black/85 px-2.5 py-1 backdrop-blur-sm">
            <span className="text-[10px] font-semibold tracking-wide text-white">
              −{discount}%
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto]">
          <div className="p-4 sm:p-5 md:p-6">
            <div className="mb-2.5 flex items-center gap-2.5">
              <p
                className={`text-[10px] font-semibold uppercase tracking-[0.16em] text-black/60 ${banglaClass}`}
              >
                {product.category[locale]}
              </p>

              <span className="h-2.5 w-px bg-black/25" aria-hidden="true" />

              <p
                className={`text-[10px] font-semibold uppercase tracking-[0.16em] text-black/60 ${banglaClass}`}
              >
                {content.dealLabel}
              </p>
            </div>

            <h3
              className={`text-base font-semibold leading-snug tracking-[-0.02em] text-black/90 sm:text-lg md:text-xl ${banglaClass}`}
            >
              {product.name[locale]}
            </h3>

            <p
              className={`mt-2 line-clamp-2 text-[13px] leading-relaxed text-black/65 sm:text-sm ${banglaClass}`}
            >
              {product.description[locale]}
            </p>

            <div className="mt-4 border-t border-black/[0.12] pt-3.5">
              <p
                className={`mb-2.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-black/60 ${banglaClass}`}
              >
                {content.detailsLabel}
              </p>

              <div className="grid grid-cols-2 gap-x-5 gap-y-2.5">
                {product.details.map((detail) => (
                  <div key={detail.label.en} className="flex flex-col gap-0.5">
                    <span
                      className={`text-[10px] font-medium uppercase tracking-[0.12em] text-black/55 ${banglaClass}`}
                    >
                      {detail.label[locale]}
                    </span>

                    <span
                      className={`text-[13px] font-semibold text-black/85 ${banglaClass}`}
                    >
                      {detail.value[locale]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex min-w-[150px] flex-col justify-between border-t border-black/[0.12] p-4 sm:border-l sm:border-t-0 sm:p-5 md:p-6">
            <div>
              <p
                className={`text-[10px] font-semibold uppercase tracking-[0.16em] text-black/60 ${banglaClass}`}
              >
                {content.nowLabel}
              </p>

              <p className="mt-1.5 text-lg font-bold tracking-[-0.02em] text-black sm:text-xl">
                {formatPrice(product.price, locale)}
              </p>

              <p className="mt-0.5 text-[12px] text-black/50 line-through">
                {formatPrice(product.originalPrice, locale)}
              </p>
            </div>

            <Button
              href={`/products/${product.id}`}
              fontSize={14}
              bangla={isBangla}
              trailingIcon={<span className="text-sm">→</span>}
              className="mt-5 self-start"
            >
              {content.shopNow}
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}

export default function DealsOfTheWeek({
  locale: localeProp,
}: DealsOfTheWeekProps) {
  const nextLocale = useLocale() as Locale;
  const locale: Locale = localeProp ?? nextLocale;

  const content = sectionContent[locale];
  const isBangla = locale === "bn";
  const banglaClass = isBangla ? "tracking-normal" : "";

  const deals = dealsOfTheWeek.slice(0, 2);

  return (
    <section className="w-full bg-white py-12 sm:py-14 md:py-16">
      <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-12">
        <header className="mb-8 sm:mb-10">
          <h2
            className={`text-[clamp(1.5rem,3vw,2.25rem)] font-semibold leading-tight tracking-[-0.03em] ${banglaClass}`}
          >
            {content.title}
          </h2>

          <p
            className={`mt-2.5 max-w-xl text-[13px] leading-relaxed text-black/55 sm:text-sm ${banglaClass}`}
          >
            {content.description}
          </p>
        </header>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6 lg:gap-7">
          {deals.map((product, index) => (
            <DealCard
              key={product.id}
              product={product}
              locale={locale}
              paletteIndex={index}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
