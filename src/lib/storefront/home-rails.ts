// src/lib/storefront/home-rails.ts

import type { CategoryTreeNode } from "@/lib/validations/category.schema";
import type { StorefrontProduct } from "./product-mapper";
import type { Locale } from "@/lib/shop/types";
import type { ProductCardData } from "@/components/shared/ProductCard";

const LIMIT = 8;
const PALETTES = ["sage", "cream", "neutral", "slate"] as const;

export type HomeRail = {
  id: string;
  title: { en: string; bn: string };
  shopHref: string;
  products: ProductCardData[];
  palette: (typeof PALETTES)[number];
};

function toCard(p: StorefrontProduct): ProductCardData {
  return {
    id: p.id,
    name: p.name,
    brand: p.brand?.name,
    price: p.price,
    originalPrice: p.compareAtPrice ?? undefined,
    rating: p.averageRating,
    colors: p.colors.map((c) => ({ hex: c.hex, name: c.name ?? undefined })),
    image: p.images[0]?.url ?? "/placeholder-product.svg",
    href: `/product/${p.slug}`,
    inStock: p.inStock,
  };
}

export function buildHomeRails(
  tree: CategoryTreeNode[],
  products: StorefrontProduct[],
  locale: Locale,
  excludeIds: string[] = [],
) {
  const usedProductIds = new Set<string>(excludeIds);

  const take = (
    pool: StorefrontProduct[],
    count = LIMIT,
  ): HomeRail["products"] => {
    const picked = pool
      .filter((p) => !usedProductIds.has(p.id))
      .slice(0, count);
    picked.forEach((p) => usedProductIds.add(p.id));
    return picked.map(toCard);
  };

  const makeRail = (
    id: string,
    titleEn: string,
    titleBn: string,
    href: string,
    pool: StorefrontProduct[],
    palette: HomeRail["palette"],
  ): HomeRail | null => {
    const products = take(pool);
    if (products.length === 0) return null;
    return {
      id,
      title: { en: titleEn, bn: titleBn },
      shopHref: href,
      products,
      palette,
    };
  };

  // 1. Trending
  // 1. Trending
  const trendingPool = [...products].sort((a, b) => {
    // 1. Featured items first
    if (a.isFeatured !== b.isFeatured) return a.isFeatured ? -1 : 1;

    // 2. Highest rated
    if (a.averageRating !== b.averageRating) {
      return b.averageRating - a.averageRating;
    }

    // 3. Newest (fallback if everything is 0-star rated)
    return b.createdAt.localeCompare(a.createdAt);
  });
  const trending = makeRail(
    "trending",
    "Trending Now",
    "জনপ্রিয় পণ্য",
    `/${locale}/shop`,
    trendingPool,
    "sage",
  );

  // 2. New Arrivals
  const newPool = [...products].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );
  const newArrivals = makeRail(
    "new-arrivals",
    "New Arrivals",
    "নতুন পণ্য",
    `/${locale}/shop`,
    newPool,
    "cream",
  );

  // 3. Discounted Products
  const discountPool = products
    .filter((p) => p.compareAtPrice && p.compareAtPrice > p.price)
    .sort((a, b) => {
      const discA = (a.compareAtPrice! - a.price) / a.compareAtPrice!;
      const discB = (b.compareAtPrice! - b.price) / b.compareAtPrice!;
      return discB - discA;
    });
  const discounted = makeRail(
    "discounted",
    "More Great Deals",
    "আরও সেরা অফার",
    `/${locale}/shop`,
    discountPool,
    "neutral",
  );

  // 4. Top in [Categories] (Only parents with > 20 products)
  const categoryStats = tree
    .filter((root) => root.children && root.children.length > 0)
    .map((root) => {
      // Count products by looking at their mainCategory (the root ancestor)
      // If mainCategory is missing, fallback to category.slug
      const pool = products.filter((p) => {
        const rootSlug = p.mainCategory?.slug ?? p.category.slug;
        return rootSlug === root.slug;
      });
      return { root, pool, count: pool.length };
    })
    .filter((stat) => stat.count > 20) // <--- Only keep parents with more than 20 products
    .sort((a, b) => b.count - a.count); // Sort biggest first

  const topCategories = categoryStats
    .map(({ root, pool }, index) => {
      const topPool = [...pool].sort(
        (a, b) => b.averageRating - a.averageRating,
      );

      return makeRail(
        `top-${root.slug}`,
        `Top in ${root.name.en}`,
        `${root.name.bn ?? root.name.en} এ সেরা`,
        `/${locale}/shop?category=${root.slug}`,
        topPool,
        PALETTES[index % PALETTES.length], // Rotate colors
      );
    })
    .filter((rail): rail is HomeRail => rail !== null); // Remove empty ones

  return { trending, newArrivals, discounted, topCategories };
}
