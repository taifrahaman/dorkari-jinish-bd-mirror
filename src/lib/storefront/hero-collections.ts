// src/lib/storefront/hero-collections.ts

import type { StorefrontProduct } from "./product-mapper";
import type { CategoryTreeNode } from "@/lib/validations/category.schema";
import type {
  HeroCollection,
  HeroPick,
} from "@/components/home-hero/heroCollections";
import type { Locale } from "@/lib/shop/types";

// A set of vibrant glow colors for the collections
const GLOWS = [
  "251,167,5", // amber
  "96,190,255", // blue
  "255,226,80", // yellow
  "255,138,170", // pink
  "94,214,160", // green
];

export function buildHeroCollections(
  tree: CategoryTreeNode[],
  products: StorefrontProduct[],
  locale: Locale,
): HeroCollection[] {
  // 1. Group products by their parent category
  const productsByRoot = new Map<string, StorefrontProduct[]>();

  for (const product of products) {
    const rootSlug = product.mainCategory?.slug || product.category.slug;
    if (!rootSlug) continue;
    const arr = productsByRoot.get(rootSlug) || [];
    arr.push(product);
    productsByRoot.set(rootSlug, arr);
  }

  // 2. Find the top 5 parent categories that actually have products
  const topRoots = tree
    .filter((r) => r.children && r.children.length > 0)
    .map((r) => {
      const items = productsByRoot.get(r.slug) || [];
      return { root: r, items };
    })
    // Only include categories with at least 4 products
    .filter((x) => x.items.length >= 4)
    .sort((a, b) => b.items.length - a.items.length)
    .slice(0, 5); // Max 5 collections

  // 3. Build the collections
  return topRoots.map(({ root, items }, index) => {
    // Sort products by Featured first, then by Highest Rated
    const sortedItems = [...items].sort((a, b) => {
      if (a.isFeatured !== b.isFeatured) return a.isFeatured ? -1 : 1;
      return b.averageRating - a.averageRating;
    });

    // Get the top 4 products
    const picks: HeroPick[] = sortedItems.slice(0, 4).map((p) => ({
      id: p.id,
      name: p.name,
      price: p.price,
      compareAt: p.compareAtPrice ?? undefined,
      image: p.images[0]?.url ?? null,
      slug: p.slug,
    }));

    return {
      id: root.slug,
      label: {
        en: root.name.en,
        bn: root.name.bn ?? root.name.en,
      },
      categorySlug: root.slug,
      glow: GLOWS[index % GLOWS.length],
      picks,
    };
  });
}
