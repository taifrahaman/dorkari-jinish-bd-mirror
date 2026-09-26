// src/components/shared/ProductCardSkeleton.tsx

"use client";

import styles from "./ProductCard.module.css";

type Palette = "cream" | "sage" | "neutral" | "slate";

const PALETTE_CLASS = {
  cream: styles.cream,
  sage: styles.sage,
  neutral: styles.neutral,
  slate: styles.neutral,
} as const;

type ProductCardSkeletonProps = {
  palette?: Palette;
  className?: string;
};

export default function ProductCardSkeleton({
  palette = "cream",
  className = "",
}: ProductCardSkeletonProps) {
  return (
    <article
      aria-hidden="true"
      className={`group relative rounded-[26px] bg-brand-surface p-2.5 ring-1 ring-brand-primary/6 shadow-[0_1px_2px_rgba(23,38,66,0.05),0_12px_28px_-16px_rgba(23,38,66,0.18)] ${className}`}
    >
      <div className={`${styles.shape} ${PALETTE_CLASS[palette]}`}>
        <div className={styles.frame}>
          <div className={styles.media}>
            {/* Image placeholder — inset by the exact same padding
                            the real <Image> uses, so the silhouette matches. */}
            <div
              className="absolute animate-pulse rounded-xl bg-brand-primary/[0.06]"
              style={{
                top: "var(--img-top)",
                left: 12,
                right: 12,
                bottom: "var(--img-bottom)",
              }}
            />

            {/* Top-left: discount + tag placeholders */}
            <div className={styles.pills}>
              <span className="h-[22px] w-11 animate-pulse rounded-full bg-brand-primary/10" />
              <span className="h-[22px] w-14 animate-pulse rounded-full bg-brand-surface/70" />
            </div>

            {/* Bottom-left: swatches + rating placeholders.
                            Reuse .chip / .colors / .rating / .swatch so the
                            pill heights, widths and corner radii are identical. */}
            <div className={styles.chips}>
              <span className={`${styles.chip} ${styles.colors}`}>
                <span className={styles.swatch}>
                  <span className="h-3 w-3 animate-pulse rounded-full bg-brand-primary/15" />
                </span>
                <span className={styles.swatch}>
                  <span className="h-3 w-3 animate-pulse rounded-full bg-brand-primary/15" />
                </span>
                <span className={styles.swatch}>
                  <span className="h-3 w-3 animate-pulse rounded-full bg-brand-primary/15" />
                </span>
              </span>

              <span className={`${styles.chip} ${styles.rating}`}>
                <span className="h-2.5 w-7 animate-pulse rounded bg-brand-primary/15" />
              </span>
            </div>
          </div>

          <span aria-hidden="true" className={styles.notch} />
        </div>

        <div className={styles.bar}>
          <div className={styles.tab}>
            <div className={styles.tabActions}>
              {/* These are chrome, not data — leave them static
                                so the card's shape reads clearly as "loaded
                                shell, pending content". */}
              <span className={styles.tabBtn} />
              <span className={`${styles.tabBtn} ${styles.tabBtnPrimary}`} />
            </div>
          </div>

          <div className={styles.info}>
            <div className={styles.text}>
              {/* brand line */}
              <span className="mb-1 block h-2.5 w-16 animate-pulse rounded bg-brand-primary/10" />
              {/* name line */}
              <span className="block h-4 w-3/4 animate-pulse rounded bg-brand-primary/15" />
            </div>

            <div className={styles.priceBlock}>
              {/* was-price line */}
              <span className="mb-1 h-2.5 w-10 animate-pulse rounded bg-brand-primary/10" />
              {/* now-price line */}
              <span className="h-5 w-16 animate-pulse rounded bg-brand-primary/15" />
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
