// src/components/home/deals-of-the-week/DealCard.tsx

"use client";

import Image from "next/image";
import GrainGradient from "@/components/shared/GrainGradient";
import Button from "@/components/shared/Button";
import type { DealProduct } from "./dealsOfTheWeek.types";

type Locale = "en" | "bn";

export type DealCardPalette = {
  from: string;
  mid: string;
  to: string;
};

const cardContent = {
  en: {
    dealLabel: "WEEKLY DEAL",
    detailsLabel: "Details",
    nowLabel: "Now",
    shopNow: "Shop Now",
  },
  bn: {
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

export default function DealCard({
  product,
  locale,
  palette,
}: {
  product: DealProduct;
  locale: Locale;
  palette: DealCardPalette;
}) {
  const content = cardContent[locale];
  const discount = calculateDiscount(product.price, product.originalPrice);
  const isBangla = locale === "bn";
  const banglaClass = isBangla ? "tracking-normal" : "";

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
        {/* Image: taller aspect ratio + tighter padding so the product reads bigger */}
        <div className="relative aspect-[4/3] overflow-hidden sm:aspect-[16/11]">
          <Image
            src={product.image}
            alt={product.name[locale]}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="z-10 object-contain p-4 transition-transform duration-700 ease-out group-hover:scale-[1.03] sm:p-5 md:p-6"
          />

          <div className="absolute right-3 top-3 z-20 inline-flex items-center rounded-full bg-black/85 px-3 py-1.5 backdrop-blur-sm sm:px-3.5 sm:py-2">
            <span className="text-[13px] font-bold tracking-wide text-white sm:text-sm">
              −{discount}%
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto]">
          <div className="p-4 sm:p-6 md:p-7">
            <div className="mb-3 flex items-center gap-2.5">
              <p
                className={`text-[11px] font-bold uppercase tracking-[0.16em] text-black/60 sm:text-xs ${banglaClass}`}
              >
                {product.category[locale]}
              </p>

              <span className="h-3 w-px bg-black/25" aria-hidden="true" />

              <p
                className={`text-[11px] font-bold uppercase tracking-[0.16em] text-black/60 sm:text-xs ${banglaClass}`}
              >
                {content.dealLabel}
              </p>
            </div>

            <h3
              className={`text-2xl font-bold leading-tight tracking-[-0.02em] text-black sm:text-[28px] md:text-3xl ${banglaClass}`}
            >
              {product.name[locale]}
            </h3>

            <p
              className={`mt-2.5 line-clamp-2 text-sm leading-relaxed text-black/65 sm:text-base ${banglaClass}`}
            >
              {product.description[locale]}
            </p>

            <div className="mt-5 border-t border-black/[0.12] pt-4">
              <p
                className={`mb-3 text-[11px] font-bold uppercase tracking-[0.16em] text-black/60 sm:text-xs ${banglaClass}`}
              >
                {content.detailsLabel}
              </p>

              <div className="grid grid-cols-2 gap-x-5 gap-y-3">
                {product.details.map((detail) => (
                  <div key={detail.label.en} className="flex flex-col gap-0.5">
                    <span
                      className={`text-[11px] font-medium uppercase tracking-[0.12em] text-black/55 ${banglaClass}`}
                    >
                      {detail.label[locale]}
                    </span>

                    <span
                      className={`text-[15px] font-semibold text-black/85 sm:text-base ${banglaClass}`}
                    >
                      {detail.value[locale]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex min-w-[170px] flex-col justify-between border-t border-black/[0.12] p-4 sm:border-l sm:border-t-0 sm:p-6 md:p-7">
            <div>
              <p
                className={`text-[11px] font-bold uppercase tracking-[0.16em] text-black/60 sm:text-xs ${banglaClass}`}
              >
                {content.nowLabel}
              </p>

              <p className="mt-2 text-2xl font-bold tracking-[-0.02em] text-black sm:text-3xl">
                {formatPrice(product.price, locale)}
              </p>

              <p className="mt-1 text-sm text-black/50 line-through">
                {formatPrice(product.originalPrice, locale)}
              </p>
            </div>

            <Button
              href={`/products/${product.slug}`}
              fontSize={15}
              bangla={isBangla}
              trailingIcon={<span className="text-base">→</span>}
              className="mt-6 self-start"
            >
              {content.shopNow}
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}
