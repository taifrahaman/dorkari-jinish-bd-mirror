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
import { primaryNavLinks, categoryTree } from "./navItems";
import { useHydration } from "@/lib/stores/useHydration";
import { useCartStore } from "@/lib/stores/useCartStore";
import styles from "./DesktopNav.module.css";

export default function DesktopNav() {
  const pathname = usePathname();
  const [categoryOpen, setCategoryOpen] = useState(false);
  const hydrated = useHydration();
  const totalItems = useCartStore((s) => s.totalItems);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <div className={styles.root}>
      {/* Logo */}
      <Link href="/" className={styles.logo} aria-label="Dorkari Jinish — Home">
        <Image
          src="/logo/logo.png"
          alt=""
          width={48}
          height={48}
          className={styles.logoMark}
        />
      </Link>

      {/* Center nav */}
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
          categories={categoryTree}
          onClose={() => setCategoryOpen(false)}
        />
      </nav>

      {/* Right cluster */}
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

        <button type="button" className={styles.iconButton} aria-label="Cart">
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
