// src/lib/storefront/category-nav.ts

import "server-only";
import { unstable_cache } from "next/cache";

import { connectToDatabase } from "@/lib/db";
import { getCategoryTree } from "@/services/category.service";
import type { CategoryTreeNode } from "@/lib/validations/category.schema";
import type { CategoryNode } from "@/components/navigation/navItems";
import type { Locale } from "@/i18n/routing";
import { STOREFRONT_CATEGORIES_TAG } from "./cache-tags";

/* ============================================================
 * Cached fetch — 1h TTL as a safety net, but primary
 * invalidation is on-demand via revalidateTag(...)
 * ============================================================ */

export const getStorefrontCategoryTree = unstable_cache(
  async () => {
    // Service functions assume the DB is already connected
    // (usually via withDb in API routes). We connect here since
    // this is called directly from server components.
    await connectToDatabase();

    return getCategoryTree({
      includeDeleted: false,
      includeInactive: false,
    });
  },
  ["storefront:category-tree"],
  {
    tags: [STOREFRONT_CATEGORIES_TAG],
    revalidate: 60 * 60,
  },
);

/* ============================================================
 * Mapper — CategoryTreeNode[] → nav-friendly CategoryNode[]
 *
 * Truncates to 2 levels (root + children), which matches the
 * current CategoryMenu / CategoryDrawer UI and the real data.
 * ============================================================ */

export function toCategoryNav(
  tree: CategoryTreeNode[],
  locale: Locale,
): CategoryNode[] {
  return tree.map((node) => ({
    id: node._id,
    slug: node.slug,
    label: node.name[locale] || node.name.en,
    href: `/c/${node.slug}`,
    image: node.image?.url, // <-- Add this
    children: node.children?.length
      ? node.children.map((child) => ({
          id: child._id,
          slug: child.slug,
          label: child.name[locale] || child.name.en,
          href: `/c/${child.slug}`,
        }))
      : undefined,
  }));
}
