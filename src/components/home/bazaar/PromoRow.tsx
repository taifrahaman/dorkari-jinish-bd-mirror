// src/components/home/bazaar/PromoRow.tsx
import Link from "next/link";
import type {
  HeroCollection,
  Lang,
} from "@/components/home-hero/heroCollections";
import { swatchVars } from "./bazaarPalette";
import styles from "./PromoRow.module.css";

const CTA: Record<Lang, string> = { bn: "দেখে আসুন", en: "Take a look" };

/** magenta, peacock, leaf: the colours not used by the neighbouring sections */
const TILE_SWATCHES = [3, 4, 2];

type Props = { collections: HeroCollection[]; locale: Lang };

export default function PromoRow({ collections, locale }: Props) {
  const tiles = collections.slice(0, 3);
  if (tiles.length === 0) return null;

  return (
    <section className={styles.section}>
      <ul className={styles.grid}>
        {tiles.map((c, i) => {
          const images = c.picks
            .map((p) => p.image)
            .filter((src): src is string => Boolean(src))
            .slice(0, 2);
          return (
            <li key={c.id}>
              <Link
                href={`/${locale}/shop?category=${encodeURIComponent(c.categorySlug)}`}
                className={styles.tile}
                style={swatchVars(TILE_SWATCHES[i % TILE_SWATCHES.length])}
              >
                <span className={styles.text}>
                  <span className={styles.label}>{c.label[locale]}</span>
                  <span className={styles.cta}>{CTA[locale]}</span>
                </span>
                {images.length > 0 && (
                  <span className={styles.pics} aria-hidden>
                    {images.map((src, n) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={src}
                        src={src}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        className={n === 0 ? styles.picA : styles.picB}
                      />
                    ))}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
