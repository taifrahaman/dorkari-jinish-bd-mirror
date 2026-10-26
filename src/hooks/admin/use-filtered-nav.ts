// src/hooks/admin/use-filtered-nav.ts

"use client";

import { useMemo } from "react";
import { useAuthStore } from "@/lib/stores/useAuthStore";
import { NAV, type NavItem } from "@/components/admin/admin-sidebar/constants";

/**
 * Returns the sidebar NAV list filtered by the current user's role
 * and permissions.
 *
 * - adminOnly items (Reports, Settings, Staff) — hidden for moderators
 * - requiresCreateProduct children (New product, Import) — hidden for
 *   moderators without canCreateProduct
 *
 * While the auth user is loading (user === null), only universally
 * visible items are shown. This avoids briefly flashing admin-only
 * items to moderators on page load.
 */
export function useFilteredNav(): NavItem[] {
  const user = useAuthStore((s) => s.user);

  return useMemo(() => {
    return NAV.filter((item) => {
      if (item.adminOnly) return user?.role === "admin";
      return true;
    }).map((item) => {
      if (!item.children) return item;

      const filteredChildren = item.children.filter((child) => {
        if (child.requiresCreateProduct) {
          return user?.canCreateProduct === true;
        }
        return true;
      });

      return { ...item, children: filteredChildren };
    });
  }, [user]);
}
