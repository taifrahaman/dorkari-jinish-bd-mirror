// src/components/admin/admin-sidebar/constants.ts

import {
  BarChart3,
  FolderTree,
  Image as ImageIcon,
  LayoutDashboard,
  Package,
  Palette,
  Receipt,
  Settings,
  Tag,
  Users,
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
  id: string;
  label: string;
  icon: LucideIcon;
  href?: string;
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
    id: "orders",
    label: "Orders",
    icon: Receipt,
    children: [
      { href: "/admin/orders", label: "All orders" },
      { href: "/admin/pos", label: "New sale (POS)" },
    ],
  },
  {
    id: "customers",
    label: "Customers",
    icon: Users,
    children: [
      { href: "/admin/customers", label: "All customers" },
      { href: "/admin/customers/new", label: "New customer" },
    ],
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
    id: "media",
    label: "Media Library",
    icon: ImageIcon,
    href: "/admin/media",
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
    id: "brands",
    label: "Brands",
    icon: Tag,
    children: [
      { href: "/admin/brands", label: "All brands" },
      { href: "/admin/brands/new", label: "New brand" },
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
  {
    id: "reports",
    label: "Reports",
    icon: BarChart3,
    children: [
      { href: "/admin/reports", label: "All reports" },
      { href: "/admin/reports/profit", label: "Profit" },
      { href: "/admin/reports/inventory", label: "Inventory" },
      { href: "/admin/reports/vat", label: "VAT" },
    ],
  },
  {
    id: "settings",
    label: "Settings",
    icon: Settings,
    href: "/admin/settings",
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
