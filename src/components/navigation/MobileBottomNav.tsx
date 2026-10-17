// src/components/navigation/MobileBottomNav.tsx

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale } from "next-intl";
import { Home, Search, ShoppingCart, MessageCircle, User } from "lucide-react";

import { bottomNavItems } from "./navItems";
import { useUIStore } from "@/lib/stores/useUIStore"; // <-- Added
import styles from "./MobileBottomNav.module.css";

const ICONS = { Home, Search, ShoppingCart, MessageCircle, User } as const;

export default function MobileBottomNav() {
  const pathname = usePathname();
  const locale = useLocale();

  // Get search state from UI store
  const { isSearchOpen, setIsSearchOpen } = useUIStore();

  // Strip the locale prefix: "/en/cart" → "/cart", "/en" → "/"
  const path = pathname.replace(new RegExp(`^/${locale}(?=/|$)`), "") || "/";

  const isActive = (href: string) =>
    href === "/" ? path === "/" : path === href || path.startsWith(`${href}/`);

  return (
    <nav className={styles.nav} aria-label="Primary">
      <ul className={styles.list}>
        {bottomNavItems.map((item) => {
          const Icon = ICONS[item.icon as keyof typeof ICONS];

          // Special handling for the search button
          if (item.id === "search") {
            return (
              <li key={item.id} className={styles.item}>
                <button
                  type="button"
                  onClick={() => setIsSearchOpen(true)}
                  className={styles.link}
                  data-active={isSearchOpen}
                  aria-label="Search"
                >
                  <span className={styles.iconWrap}>
                    <Icon size={20} strokeWidth={isSearchOpen ? 2.4 : 1.9} />
                  </span>
                  <span className={styles.label}>{item.label}</span>
                </button>
              </li>
            );
          }

          // Normal links for everything else
          const active = isActive(item.href);
          return (
            <li key={item.id} className={styles.item}>
              <Link
                href={item.href}
                className={styles.link}
                data-active={active}
                aria-current={active ? "page" : undefined}
              >
                <span className={styles.iconWrap}>
                  <Icon size={20} strokeWidth={active ? 2.4 : 1.9} />
                </span>
                <span className={styles.label}>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
