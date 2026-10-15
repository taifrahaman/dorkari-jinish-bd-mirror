// src/components/shared/ProductCard.tsx

// "use client";

// import Image from "next/image";
// import Link from "next/link";
// import { Heart, ShoppingBag, Star } from "lucide-react";
// import { useState } from "react";

// import styles from "./ProductCard.module.css";

// type Locale = "en" | "bn";

// type LocalizedText = {
//   en: string;
//   bn: string;
// };

// export type ProductColor = {
//   hex: string;
//   name?: LocalizedText;
// };

// export type ProductCardData = {
//   id: string;
//   name: LocalizedText;
//   brand?: LocalizedText;
//   tag?: LocalizedText;
//   price: number;
//   originalPrice?: number;
//   rating?: number;
//   /** Hex strings ("#c0c0c0") or { hex, name } objects. */
//   colors?: (string | ProductColor)[];
//   image: string;
//   href: string;
// };

// type ProductCardProps = {
//   product: ProductCardData;
//   locale?: Locale;
//   palette?: "cream" | "sage" | "neutral" | "slate";
//   onWishlist?: (id: string) => void;
//   /** Second argument is the colour currently selected on the card. */
//   onAddToCart?: (id: string, color?: ProductColor) => void;
//   className?: string;
// };

// const PALETTE_CLASS = {
//   cream: styles.cream,
//   sage: styles.sage,
//   neutral: styles.neutral,
//   slate: styles.neutral,
// } as const;

// /**
//  * Max colour slots in the chip. When there are more colours than this,
//  * the last slot becomes a "+N" label instead of a dot.
//  */
// const MAX_SWATCHES = 3;

// function formatPrice(price: number, locale: Locale) {
//   const value = new Intl.NumberFormat(locale === "bn" ? "bn-BD" : "en-BD", {
//     maximumFractionDigits: 0,
//   }).format(price);

//   return `৳${value}`;
// }

// function calculateDiscount(price: number, original: number) {
//   return Math.round(((original - price) / original) * 100);
// }

// export default function ProductCard({
//   product,
//   locale = "en",
//   palette = "cream",
//   onWishlist,
//   onAddToCart,
//   className = "",
// }: ProductCardProps) {
//   const [wishlisted, setWishlisted] = useState(false);
//   const [colorIndex, setColorIndex] = useState(0);

//   const isBangla = locale === "bn";

//   const name = product.name[locale];
//   const brand = product.brand?.[locale];
//   const tag = product.tag?.[locale];

//   const discount =
//     product.originalPrice && product.originalPrice > product.price
//       ? calculateDiscount(product.price, product.originalPrice)
//       : null;

//   const swatches: ProductColor[] = (product.colors ?? []).map((c) =>
//     typeof c === "string" ? { hex: c } : c,
//   );
//   const visibleSwatches =
//     swatches.length > MAX_SWATCHES
//       ? swatches.slice(0, MAX_SWATCHES - 1)
//       : swatches;
//   const hiddenCount = swatches.length - visibleSwatches.length;
//   const selectedColor = swatches[colorIndex] ?? swatches[0];

//   const hasChips = swatches.length > 0 || product.rating !== undefined;

//   const handleWishlist = (e: React.MouseEvent) => {
//     e.preventDefault();
//     e.stopPropagation();
//     setWishlisted((p) => !p);
//     onWishlist?.(product.id);
//   };

//   const handleAddToCart = (e: React.MouseEvent) => {
//     e.preventDefault();
//     e.stopPropagation();
//     onAddToCart?.(product.id, selectedColor);
//   };

//   return (
//     <article
//       className={`group relative rounded-[26px] bg-brand-surface p-2.5 ring-1 ring-brand-primary/6 shadow-[0_1px_2px_rgba(23,38,66,0.05),0_12px_28px_-16px_rgba(23,38,66,0.18)] transition-shadow duration-300 hover:shadow-[0_2px_4px_rgba(23,38,66,0.06),0_20px_40px_-16px_rgba(23,38,66,0.26)] ${className}`}
//     >
//       <div
//         className={`${styles.shape} ${PALETTE_CLASS[palette]}`}
//         data-locale={locale}
//       >
//         {/* ===================== IMAGE + NOTCH ===================== */}
//         <div className={styles.frame}>
//           <div className={styles.media}>
//             {/* Product image */}
//             <Link
//               href={product.href}
//               aria-label={name}
//               className={styles.imageLink}
//             >
//               <Image
//                 src={product.image}
//                 alt={name}
//                 fill
//                 sizes="(max-width: 768px) 70vw, 260px"
//                 className={`${styles.image} transition-transform duration-500 ease-out group-hover:scale-[1.03]`}
//               />
//             </Link>

//             {/* Top-left: discount + tag */}
//             <div className={styles.pills}>
//               {discount !== null && (
//                 <span className="inline-flex items-center rounded-full bg-brand-accent px-2.5 py-1 text-[11px] font-semibold leading-none text-brand-primary">
//                   −{discount}%
//                 </span>
//               )}

//               {tag && (
//                 <span className="inline-flex items-center rounded-full bg-brand-surface px-2.5 py-1 text-[11px] font-medium leading-none text-brand-primary shadow-[0_1px_2px_rgba(23,38,66,0.08)]">
//                   {tag}
//                 </span>
//               )}
//             </div>

//             {/* Bottom-left: colour options + rating */}
//             {hasChips && (
//               <div className={styles.chips}>
//                 {swatches.length > 0 && (
//                   <div
//                     className={`${styles.chip} ${styles.colors}`}
//                     role="group"
//                     aria-label={isBangla ? "রং" : "Color options"}
//                   >
//                     {visibleSwatches.map((color, i) => (
//                       <button
//                         key={`${color.hex}-${i}`}
//                         type="button"
//                         onClick={() => setColorIndex(i)}
//                         aria-label={color.name?.[locale] ?? color.hex}
//                         aria-pressed={i === colorIndex}
//                         className={styles.swatch}
//                       >
//                         <span
//                           className={styles.dot}
//                           style={{
//                             backgroundColor: color.hex,
//                           }}
//                         />
//                       </button>
//                     ))}

//                     {hiddenCount > 0 && (
//                       <span className={styles.more}>+{hiddenCount}</span>
//                     )}
//                   </div>
//                 )}

//                 {product.rating !== undefined && (
//                   <span className={`${styles.chip} ${styles.rating}`}>
//                     <Star
//                       className="h-3 w-3 shrink-0 fill-brand-accent text-brand-accent"
//                       strokeWidth={0}
//                     />
//                     {product.rating.toFixed(1)}
//                   </span>
//                 )}
//               </div>
//             )}
//           </div>

//           {/* The cut-out that the wishlist + cart buttons sit in */}
//           <span aria-hidden="true" className={styles.notch} />
//         </div>

//         {/* ===================== TAB + BAR ===================== */}
//         <div className={styles.bar}>
//           {/* Wishlist + cart (absolutely positioned above the bar, inside the notch) */}
//           <div className={styles.tab}>
//             <div className={styles.tabActions}>
//               <button
//                 type="button"
//                 onClick={handleWishlist}
//                 aria-label={
//                   isBangla ? "পছন্দের তালিকায় যোগ করুন" : "Add to wishlist"
//                 }
//                 aria-pressed={wishlisted}
//                 className={styles.tabBtn}
//               >
//                 <Heart
//                   className={`h-4 w-4 transition-colors ${wishlisted
//                     ? "fill-red-500 text-red-500"
//                     : "text-brand-primary"
//                     }`}
//                   strokeWidth={1.7}
//                 />
//               </button>

//               <button
//                 type="button"
//                 onClick={handleAddToCart}
//                 aria-label={isBangla ? "কার্টে যোগ করুন" : "Add to cart"}
//                 className={`${styles.tabBtn} ${styles.tabBtnPrimary}`}
//               >
//                 <ShoppingBag className="h-4 w-4" strokeWidth={1.7} />
//               </button>
//             </div>
//           </div>

//           <Link href={product.href} className={styles.info}>
//             <div className={styles.text}>
//               {brand ? <p className={styles.brand}>{brand}</p> : null}
//               <h3 className={styles.name}>{name}</h3>
//             </div>

//             <div className={styles.priceBlock}>
//               {discount !== null && product.originalPrice !== undefined && (
//                 <span className={styles.was}>
//                   {formatPrice(product.originalPrice, locale)}
//                 </span>
//               )}

//               <span className={styles.now}>
//                 {formatPrice(product.price, locale)}
//               </span>
//             </div>
//           </Link>
//         </div>
//       </div>
//     </article>
//   );
// }

// src/components/shared/ProductCard.tsx

"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, ShoppingBag, Star } from "lucide-react";
import { useState } from "react";

import styles from "./ProductCard.module.css";

type Locale = "en" | "bn";

type LocalizedText = {
  en: string;
  bn: string;
};

export type ProductColor = {
  hex: string;
  name?: LocalizedText;
};

export type ProductCardData = {
  id: string;
  name: LocalizedText;
  brand?: LocalizedText;
  tag?: LocalizedText;
  price: number;
  originalPrice?: number;
  rating?: number;
  /** Hex strings ("#c0c0c0") or { hex, name } objects. */
  colors?: (string | ProductColor)[];
  image: string;
  href: string;
};

type ProductCardProps = {
  product: ProductCardData;
  locale?: Locale;
  palette?: "cream" | "sage" | "neutral" | "slate";
  onWishlist?: (id: string) => void;
  /** Second argument is the colour currently selected on the card. */
  onAddToCart?: (id: string, color?: ProductColor) => void;
  className?: string;
};

const PALETTE_CLASS = {
  cream: styles.cream,
  sage: styles.sage,
  neutral: styles.neutral,
  slate: styles.neutral,
} as const;

/**
 * Max colour slots in the chip. When there are more colours than this,
 * the last slot becomes a "+N" label instead of a dot.
 */
const MAX_SWATCHES = 3;

function formatPrice(price: number, locale: Locale) {
  const value = new Intl.NumberFormat(locale === "bn" ? "bn-BD" : "en-BD", {
    maximumFractionDigits: 0,
  }).format(price);

  return `৳${value}`;
}

function calculateDiscount(price: number, original: number) {
  return Math.round(((original - price) / original) * 100);
}

export default function ProductCard({
  product,
  locale = "en",
  palette = "cream",
  onWishlist,
  onAddToCart,
  className = "",
}: ProductCardProps) {
  const [wishlisted, setWishlisted] = useState(false);
  const [colorIndex, setColorIndex] = useState(0);

  const isBangla = locale === "bn";

  const name = product.name[locale];
  const brand = product.brand?.[locale];
  const tag = product.tag?.[locale];

  const discount =
    product.originalPrice && product.originalPrice > product.price
      ? calculateDiscount(product.price, product.originalPrice)
      : null;

  const swatches: ProductColor[] = (product.colors ?? []).map((c) =>
    typeof c === "string" ? { hex: c } : c,
  );
  const visibleSwatches =
    swatches.length > MAX_SWATCHES
      ? swatches.slice(0, MAX_SWATCHES - 1)
      : swatches;
  const hiddenCount = swatches.length - visibleSwatches.length;
  const selectedColor = swatches[colorIndex] ?? swatches[0];

  const hasRating = (product.rating ?? 0) > 0;
  const hasChips = swatches.length > 0 || hasRating;

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setWishlisted((p) => !p);
    onWishlist?.(product.id);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onAddToCart?.(product.id, selectedColor);
  };

  return (
    <article
      className={`group relative rounded-[26px] bg-brand-surface p-2.5 ring-1 ring-brand-primary/6 shadow-[0_1px_2px_rgba(23,38,66,0.05),0_12px_28px_-16px_rgba(23,38,66,0.18)] transition-shadow duration-300 hover:shadow-[0_2px_4px_rgba(23,38,66,0.06),0_20px_40px_-16px_rgba(23,38,66,0.26)] ${className}`}
    >
      <div
        className={`${styles.shape} ${PALETTE_CLASS[palette]}`}
        data-locale={locale}
      >
        {/* ===================== IMAGE + NOTCH ===================== */}
        <div className={styles.frame}>
          <div className={styles.media}>
            {/* Product image */}
            <Link
              href={product.href}
              aria-label={name}
              className={styles.imageLink}
            >
              <Image
                src={product.image}
                alt={name}
                fill
                sizes="(max-width: 768px) 70vw, 260px"
                className={`${styles.image} transition-transform duration-500 ease-out group-hover:scale-[1.03]`}
              />
            </Link>

            {/* Top-left: discount + tag */}
            <div className={styles.pills}>
              {discount !== null && (
                <span className="inline-flex items-center rounded-full bg-brand-accent px-2.5 py-1 text-[11px] font-semibold leading-none text-brand-primary">
                  −{discount}%
                </span>
              )}

              {tag && (
                <span className="inline-flex items-center rounded-full bg-brand-surface px-2.5 py-1 text-[11px] font-medium leading-none text-brand-primary shadow-[0_1px_2px_rgba(23,38,66,0.08)]">
                  {tag}
                </span>
              )}
            </div>

            {/* Bottom-left: colour options + rating */}
            {hasChips && (
              <div className={styles.chips}>
                {swatches.length > 0 && (
                  <div
                    className={`${styles.chip} ${styles.colors}`}
                    role="group"
                    aria-label={isBangla ? "রং" : "Color options"}
                  >
                    {visibleSwatches.map((color, i) => (
                      <button
                        key={`${color.hex}-${i}`}
                        type="button"
                        onClick={() => setColorIndex(i)}
                        aria-label={color.name?.[locale] ?? color.hex}
                        aria-pressed={i === colorIndex}
                        className={styles.swatch}
                      >
                        <span
                          className={styles.dot}
                          style={{
                            backgroundColor: color.hex,
                          }}
                        />
                      </button>
                    ))}

                    {hiddenCount > 0 && (
                      <span className={styles.more}>+{hiddenCount}</span>
                    )}
                  </div>
                )}

                {hasRating && (
                  <span className={`${styles.chip} ${styles.rating}`}>
                    <Star
                      className="h-3 w-3 shrink-0 fill-brand-accent text-brand-accent"
                      strokeWidth={0}
                    />
                    {product.rating!.toFixed(1)}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* The cut-out that the wishlist + cart buttons sit in */}
          <span aria-hidden="true" className={styles.notch} />
        </div>

        {/* ===================== TAB + BAR ===================== */}
        <div className={styles.bar}>
          {/* Wishlist + cart (absolutely positioned above the bar, inside the notch) */}
          <div className={styles.tab}>
            <div className={styles.tabActions}>
              <button
                type="button"
                onClick={handleWishlist}
                aria-label={
                  isBangla ? "পছন্দের তালিকায় যোগ করুন" : "Add to wishlist"
                }
                aria-pressed={wishlisted}
                className={styles.tabBtn}
              >
                <Heart
                  className={`h-4 w-4 transition-colors ${
                    wishlisted
                      ? "fill-red-500 text-red-500"
                      : "text-brand-primary"
                  }`}
                  strokeWidth={1.7}
                />
              </button>

              <button
                type="button"
                onClick={handleAddToCart}
                aria-label={isBangla ? "কার্টে যোগ করুন" : "Add to cart"}
                className={`${styles.tabBtn} ${styles.tabBtnPrimary}`}
              >
                <ShoppingBag className="h-4 w-4" strokeWidth={1.7} />
              </button>
            </div>
          </div>

          <Link href={product.href} className={styles.info}>
            <div className={styles.text}>
              {brand ? <p className={styles.brand}>{brand}</p> : null}
              <h3 className={styles.name}>{name}</h3>
            </div>

            <div className={styles.priceBlock}>
              {discount !== null && product.originalPrice !== undefined && (
                <span className={styles.was}>
                  {formatPrice(product.originalPrice, locale)}
                </span>
              )}

              <span className={styles.now}>
                {formatPrice(product.price, locale)}
              </span>
            </div>
          </Link>
        </div>
      </div>
    </article>
  );
}
