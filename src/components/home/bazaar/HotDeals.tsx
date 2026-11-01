// src/components/home/bazaar/HotDeals.tsx
import Link from "next/link";
import type { DealProduct } from "@/components/home/deals-of-the-week/dealsOfTheWeek.types";
import type { Lang } from "@/components/home-hero/heroCollections";
import styles from "./HotDeals.module.css";

const COPY: Record<
  Lang,
  { sign: string; sub: string; buy: string; save: (n: string) => string }
> = {
  bn: {
    sign: "আজকের ডাক",
    sub: "এই সপ্তাহের সেরা অফার",
    buy: "এখনই কিনুন",
    save: (n) => `৳${n} বাঁচান`,
  },
  en: {
    sign: "Today's big deals",
    sub: "The best offers this week",
    buy: "Buy now",
    save: (n) => `Save ৳${n}`,
  },
};

type Props = { deals: DealProduct[]; locale: Lang };

export default function HotDeals({ deals, locale }: Props) {
  if (deals.length === 0) return null;

  const copy = COPY[locale];
  const fmt = new Intl.NumberFormat(locale === "bn" ? "bn-BD" : "en-US");

  return (
    <section className={styles.section} aria-labelledby="hot-deals-title">
      <div className={styles.inner}>
        <header className={styles.head}>
          <h2 id="hot-deals-title" className={styles.sign}>
            {copy.sign}
          </h2>
          <p className={styles.sub}>{copy.sub}</p>
        </header>

        <div className={styles.grid}>
          {deals.map((d) => {
            const saving = d.originalPrice - d.price;
            const pct = Math.round((saving / d.originalPrice) * 100);
            const href = `/${locale}/product/${d.slug}`;
            const name = d.name[locale] ?? d.name.en;
            const category = d.category[locale] ?? d.category.en;

            return (
              <article key={d.id} className={styles.card}>
                <Link href={href} className={styles.media} aria-label={name}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={d.image} alt="" loading="lazy" decoding="async" />
                  <span className={styles.burst} aria-hidden>
                    <span className={styles.burstText}>
                      -{fmt.format(pct)}%
                    </span>
                  </span>
                </Link>

                <div className={styles.body}>
                  <span className={styles.cat}>{category}</span>
                  <h3 className={styles.name}>{name}</h3>
                  <div className={styles.prices}>
                    <span className={styles.price}>৳{fmt.format(d.price)}</span>
                    <s className={styles.was}>৳{fmt.format(d.originalPrice)}</s>
                  </div>
                  <span className={styles.save}>
                    {copy.save(fmt.format(saving))}
                  </span>
                  <Link href={href} className={styles.cta}>
                    {copy.buy}
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
