// src/components/admin/admin-sidebar/constants.ts

import {
  FolderTree,
  LayoutDashboard,
  Package,
  Palette,
  type LucideIcon,
} from "lucide-react";

/* ============================================================
 * Types
 * ============================================================ */

export type NavChild = {
  href: string;
  label: string;
};

export type NavItem = {
  /** Stable id for persisted open-state. */
  id: string;
  label: string;
  icon: LucideIcon;
  /** Direct link — no children (e.g. Dashboard). */
  href?: string;
  /** Section — click to expand/collapse. */
  children?: NavChild[];
};

/* ============================================================
 * Nav config
 * ============================================================ */

export const NAV: NavItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/admin",
  },
  {
    id: "products",
    label: "Products",
    icon: Package,
    children: [
      { href: "/admin/products", label: "All products" },
      { href: "/admin/products/new", label: "New product" },
      { href: "/admin/products/import", label: "Import" },
    ],
  },
  {
    id: "categories",
    label: "Categories",
    icon: FolderTree,
    children: [
      { href: "/admin/categories", label: "All categories" },
      { href: "/admin/categories/new", label: "New category" },
    ],
  },
  {
    id: "colors",
    label: "Colors",
    icon: Palette,
    children: [
      { href: "/admin/colors", label: "All colors" },
      { href: "/admin/colors/new", label: "New color" },
    ],
  },
];

/* ============================================================
 * Layout constants
 * ============================================================ */

export const EXPANDED_W = 256;
export const COLLAPSED_W = 72;
export const STORAGE_KEY = "admin-sidebar-collapsed";
export const OPEN_SECTIONS_KEY = "admin-sidebar-open-sections";

export const gradientBg =
  "bg-linear-to-b from-brand-primary to-brand-primary-dark text-white";

export const itemBase =
  "group relative flex h-10 w-full items-center rounded-md text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70";
