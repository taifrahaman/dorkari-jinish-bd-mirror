// src/components/navigation/DesktopNav.tsx

"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ChevronDown, ShoppingCart, User } from "lucide-react";
import { useState } from "react";

import CategoryMenu from "./CategoryMenu";
import NavSearch from "./NavSearch";
import LanguageSwitcher from "@/components/shared/LanguageSwitcher";
import NotificationBell from "@/components/shared/NotificationBell";
import { primaryNavLinks, type CategoryNode } from "./navItems";
import { useHydration } from "@/lib/stores/useHydration";
import { useCartStore } from "@/lib/stores/useCartStore";
import { useUIStore } from "@/lib/stores/useUIStore"; // Added
import styles from "./DesktopNav.module.css";

type Props = {
  categories: CategoryNode[];
};

export default function DesktopNav({ categories }: Props) {
  const pathname = usePathname();
  const [categoryOpen, setCategoryOpen] = useState(false);
  const hydrated = useHydration();
  const totalItems = useCartStore((s) => s.totalItems);
  const toggleCart = useUIStore((s) => s.toggleCart); // Added

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <div className={styles.root}>
      <Link href="/" className={styles.logo} aria-label="Dorkari Jinish — Home">
        <Image
          src="/logo/logo.png"
          alt=""
          width={48}
          height={48}
          className={styles.logoMark}
        />
      </Link>

      <nav className={styles.nav} aria-label="Primary">
        <button
          type="button"
          className={styles.navLink}
          onMouseEnter={() => setCategoryOpen(true)}
          onClick={() => setCategoryOpen((v) => !v)}
          aria-expanded={categoryOpen}
          aria-haspopup="menu"
        >
          Category
          <ChevronDown
            size={14}
            className={styles.chevron}
            data-open={categoryOpen}
          />
        </button>

        {primaryNavLinks.map((link) => (
          <Link
            key={link.id}
            href={link.href}
            className={styles.navLink}
            data-active={isActive(link.href)}
          >
            {link.label}
          </Link>
        ))}

        <CategoryMenu
          open={categoryOpen}
          categories={categories}
          onClose={() => setCategoryOpen(false)}
        />
      </nav>

      <div className={styles.actions}>
        <NavSearch />

        <button
          type="button"
          className={styles.iconButton}
          aria-label="Account"
        >
          <User size={18} />
        </button>

        <NotificationBell />

        {/* Added onClick={toggleCart} */}
        <button
          type="button"
          className={styles.iconButton}
          aria-label="Cart"
          onClick={toggleCart}
        >
          <ShoppingCart size={18} />
          {hydrated && totalItems > 0 && (
            <span className={styles.badge}>{totalItems}</span>
          )}
        </button>

        <LanguageSwitcher />
      </div>
    </div>
  );
}
