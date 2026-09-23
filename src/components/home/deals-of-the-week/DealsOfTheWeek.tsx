// src/components/home/deals-of-the-week/DealsOfTheWeek.tsx

"use client";

import { useLocale } from "next-intl";
import { dealsOfTheWeek } from "./dealsOfTheWeekData";
import DealCard, { type DealCardPalette } from "./DealCard";

type Locale = "en" | "bn";

type DealsOfTheWeekProps = {
  locale?: Locale;
};

const CARD_PALETTES: DealCardPalette[] = [
  { from: "#f7f1e4", mid: "#ebdfc6", to: "#d6c5a3" },
  { from: "#eef2e8", mid: "#dde4d2", to: "#bcc7a8" },
];

const sectionContent = {
  en: {
    title: "Weekly Deals",
    description:
      "Two carefully selected essentials, available this week at a special price.",
  },
  bn: {
    title: "সাপ্তাহিক অফার",
    description: "এই সপ্তাহের জন্য বেছে নেওয়া দুটি দরকারি পণ্য, বিশেষ দামে।",
  },
};

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
            className={`text-[clamp(2rem,4.2vw,3.25rem)] font-bold leading-[1.05] tracking-[-0.03em] ${banglaClass}`}
          >
            {content.title}
          </h2>

          <p
            className={`mt-3 max-w-xl text-[15px] leading-relaxed text-black/60 sm:text-base ${banglaClass}`}
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
              palette={CARD_PALETTES[index % CARD_PALETTES.length]}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
