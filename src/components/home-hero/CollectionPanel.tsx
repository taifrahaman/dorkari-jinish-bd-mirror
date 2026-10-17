// src/components/home-hero/CollectionPanel.tsx
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  PLACEHOLDER_IMAGE,
  type CSSVars,
  type HeroCollection,
  type Lang,
} from "./heroCollections";
import styles from "./HomeHero.module.css";

type Props = {
  collection: HeroCollection;
  index: number;
  active: boolean;
  locale: Lang;
  eyebrow: string;
  seeAll: string;
  fmt: Intl.NumberFormat;
};

export default function CollectionPanel({
  collection,
  index,
  active,
  locale,
  eyebrow,
  seeAll,
  fmt,
}: Props) {
  const shopHref = `/${locale}/shop?category=${encodeURIComponent(collection.categorySlug)}`;

  // Only the first collection is visible on first paint. GSAP controls the rest
  // afterwards (these values never change between renders).
  const style: CSSVars = {
    "--rgb": collection.glow,
    ...(index === 0 ? {} : { opacity: 0, visibility: "hidden" }),
  };

  return (
    <div
      className={styles.panel}
      data-panel
      style={style}
      aria-hidden={!active}
    >
      <div className={styles.panelHead} data-anim>
        <div>
          <span className={styles.eyebrow}>{eyebrow}</span>
          <strong className={styles.collectionName}>
            {collection.label[locale]}
          </strong>
        </div>
        <Link href={shopHref} className={styles.seeAll}>
          {seeAll}
          <ArrowRight size={14} strokeWidth={2.2} />
        </Link>
      </div>

      <ul className={styles.picks}>
        {collection.picks.map((p) => {
          const href = p.slug ? `/${locale}/product/${p.slug}` : shopHref;
          const hasImage = Boolean(p.image);
          return (
            <li key={p.id} className={styles.pick} data-anim>
              <Link href={href} className={styles.pickLink}>
                <span className={styles.thumb}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.image || PLACEHOLDER_IMAGE}
                    alt=""
                    width={160}
                    height={160}
                    loading={index === 0 ? "eager" : "lazy"}
                    decoding="async"
                    data-real={hasImage}
                  />
                </span>
                <span className={styles.pickName}>{p.name[locale]}</span>
                <span className={styles.price}>
                  ৳{fmt.format(p.price)}
                  {p.compareAt ? <s>৳{fmt.format(p.compareAt)}</s> : null}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
