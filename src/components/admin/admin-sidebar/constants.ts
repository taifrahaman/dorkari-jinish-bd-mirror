// src/components/admin/admin-sidebar/constants.ts

import { LayoutDashboard, Package } from "lucide-react";

export const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/products", label: "Products", icon: Package },
] as const;

export const EXPANDED_W = 256;
export const COLLAPSED_W = 72;
export const STORAGE_KEY = "admin-sidebar-collapsed";

export const gradientBg =
  "bg-linear-to-b from-brand-primary to-brand-primary-dark text-white";

export const itemBase =
  "group relative flex h-10 w-full items-center rounded-md text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70";
