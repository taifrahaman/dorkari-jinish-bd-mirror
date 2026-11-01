// src/components/home/bazaar/ShopfrontLane.tsx
import Link from "next/link";
import type { CategoryNode } from "@/components/navigation/navItems";
import { iconForCategory } from "@/components/home-hero/categoryIcons";
import type { Lang } from "@/components/home-hero/heroCollections";
import { swatchVars } from "./bazaarPalette";
import styles from "./ShopfrontLane.module.css";

const TITLE: Record<Lang, string> = {
  bn: "দোকান ঘুরে দেখুন",
  en: "Browse the shops",
};

type Props = { categories: CategoryNode[]; locale: Lang };

export default function ShopfrontLane({ categories, locale }: Props) {
  if (categories.length === 0) return null;

  return (
    <section className={styles.section} aria-labelledby="lane-title">
      <h2 id="lane-title" className={styles.title}>
        {TITLE[locale]}
      </h2>
      <ul className={styles.row}>
        {categories.map((c, i) => {
          const Icon = iconForCategory(c.slug);
          return (
            <li key={c.slug} className={styles.shop} style={swatchVars(i)}>
              <Link
                href={`/${locale}/shop?category=${encodeURIComponent(c.slug)}`}
                className={styles.link}
              >
                <span className={styles.awning} aria-hidden />
                <span className={styles.front}>
                  {c.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.image} alt="" className={styles.img} />
                  ) : (
                    <Icon size={30} strokeWidth={1.7} />
                  )}
                </span>
                <span className={styles.name}>{c.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
