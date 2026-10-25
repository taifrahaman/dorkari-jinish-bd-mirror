// src/components/shared/ProductCard.tsx

"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, ShoppingBag, Star } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

import { useCartStore } from "@/lib/stores/useCartStore";
import { useAuthStore } from "@/lib/stores/useAuthStore";
import { makeCartKey } from "@/lib/cart/cart-key";
import styles from "./ProductCard.module.css";

type Locale = "en" | "bn";
type LocalizedText = { en: string; bn: string };

export type ProductColor = { hex: string; name?: LocalizedText };

export type ProductCardData = {
  id: string;
  name: LocalizedText;
  brand?: LocalizedText;
  tag?: LocalizedText;
  price: number;
  originalPrice?: number;
  rating?: number;
  colors?: (string | ProductColor)[];
  image: string;
  href: string;
  /** Optional — defaults to available when undefined. */
  inStock?: boolean;
};

type ProductCardProps = {
  product: ProductCardData;
  locale?: Locale;
  palette?: "cream" | "sage" | "neutral" | "slate";
  className?: string;
};

const PALETTE_CLASS = {
  cream: styles.cream,
  sage: styles.sage,
  neutral: styles.neutral,
  slate: styles.neutral,
} as const;

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
  locale: propLocale,
  palette = "cream",
  className = "",
}: ProductCardProps) {
  const [colorIndex, setColorIndex] = useState(0);

  const nextLocale = useLocale() as "en" | "bn";
  const locale = propLocale || nextLocale || "en";
  const isBangla = locale === "bn";
  const router = useRouter();

  const addItem = useCartStore((s) => s.addItem);
  const { user, setUser } = useAuthStore();

  const name = product.name[locale];
  const brand = product.brand?.[locale];
  const tag = product.tag?.[locale];

  // Check if this product is in the user's wishlist
  const isWishlisted = user?.wishlist?.includes(product.id) || false;

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

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // OOS guard — the cart store caps quantity but doesn't know
    // availability. Reject the add here with a clear message so
    // the customer understands why nothing happened.
    if (product.inStock === false) {
      toast.error(
        isBangla
          ? "এই পণ্যটি বর্তমানে স্টকে নেই"
          : "This product is currently out of stock",
        {
          description: (
            <div className="mt-2 flex items-center gap-3">
              <img
                src={product.image}
                alt=""
                className="h-10 w-10 rounded-md object-cover bg-brand-navbar"
              />
              <span className="line-clamp-1 text-sm font-medium text-brand-text">
                {name}
              </span>
            </div>
          ),
        },
      );
      return;
    }

    const slug = product.href.split("/").pop();
    addItem({
      productId: makeCartKey(product.id, selectedColor?.hex ?? "default"),
      name: name,
      price: product.price,
      originalPrice: product.originalPrice,
      image: product.image,
      slug: slug,
      colorName: selectedColor?.name?.[locale],
      colorHex: selectedColor?.hex,
      quantity: 1,
      stock: "in-stock",
    });

    toast.success(isBangla ? "কার্টে যোগ করা হয়েছে" : "Added to cart", {
      description: (
        <div className="mt-2 flex items-center gap-3">
          <img
            src={product.image}
            alt=""
            className="h-10 w-10 rounded-md object-cover bg-brand-navbar"
          />
          <div className="flex flex-col">
            <span className="line-clamp-1 text-sm font-medium text-brand-text">
              {name}
            </span>
            <span className="text-xs text-brand-text-secondary">
              {formatPrice(product.price, locale)}
            </span>
          </div>
        </div>
      ),
    });
  };

  const handleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast.error(
        isBangla
          ? "উইশলিস্টে যোগ করতে লগইন করুন"
          : "Please login to add to wishlist",
      );
      router.push(`/${locale}/login`);
      return;
    }

    // Optimistic UI update
    const newWishlist = isWishlisted
      ? user.wishlist?.filter((id) => id !== product.id) || []
      : [...(user.wishlist || []), product.id];

    setUser({ ...user, wishlist: newWishlist });

    try {
      const res = await fetch("/api/auth/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id }),
      });

      if (!res.ok) throw new Error("Failed to update wishlist");

      toast.success(
        isWishlisted
          ? isBangla
            ? "উইশলিস্ট থেকে সরানো হয়েছে"
            : "Removed from wishlist"
          : isBangla
            ? "উইশলিস্টে যোগ করা হয়েছে"
            : "Added to wishlist",
      );
    } catch {
      // Revert if API fails
      setUser(user);
      toast.error("Something went wrong");
    }
  };

  return (
    <article
      className={`group relative flex h-full flex-col rounded-[26px] bg-brand-surface p-2.5 ring-1 ring-brand-primary/6 shadow-[0_1px_2px_rgba(23,38,66,0.05),0_12px_28px_-16px_rgba(23,38,66,0.18)] transition-shadow duration-300 hover:shadow-[0_2px_4px_rgba(23,38,66,0.06),0_20px_40px_-16px_rgba(23,38,66,0.26)] ${className}`}
    >
      <div
        className={`${styles.shape} ${PALETTE_CLASS[palette]}`}
        data-locale={locale}
      >
        <div className={styles.frame}>
          <div className={styles.media}>
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
                        onClick={(e) => {
                          e.preventDefault();
                          setColorIndex(i);
                        }}
                        aria-label={color.name?.[locale] ?? color.hex}
                        aria-pressed={i === colorIndex}
                        className={styles.swatch}
                      >
                        <span
                          className={styles.dot}
                          style={{ backgroundColor: color.hex }}
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
          <span aria-hidden="true" className={styles.notch} />
        </div>

        <div className={styles.bar}>
          <div className={styles.tab}>
            <div className={styles.tabActions}>
              <button
                type="button"
                onClick={handleWishlist}
                aria-label={
                  isBangla ? "পছন্দের তালিকায় যোগ করুন" : "Add to wishlist"
                }
                aria-pressed={isWishlisted}
                className={styles.tabBtn}
              >
                <Heart
                  className={`h-4 w-4 transition-colors ${
                    isWishlisted
                      ? "fill-red-500 text-red-500"
                      : "text-brand-primary"
                  }`}
                  strokeWidth={1.7}
                />
              </button>

              <button
                type="button"
                onClick={handleAddToCart}
                aria-label={
                  product.inStock === false
                    ? isBangla
                      ? "স্টকে নেই"
                      : "Out of stock"
                    : isBangla
                      ? "কার্টে যোগ করুন"
                      : "Add to cart"
                }
                className={`${styles.tabBtn} ${styles.tabBtnPrimary} ${
                  product.inStock === false ? "opacity-60" : ""
                }`}
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
