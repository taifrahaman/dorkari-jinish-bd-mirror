// src/components/navigation/MobileNav.tsx

"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Menu, ShoppingCart } from "lucide-react"; // Added ShoppingCart

import NotificationBell from "@/components/shared/NotificationBell";
import LanguageSwitcher from "@/components/shared/LanguageSwitcher";
import CategoryDrawer from "./CategoryDrawer";
import { primaryNavLinks, type CategoryNode } from "./navItems";
import { useHydration } from "@/lib/stores/useHydration"; // Added
import { useCartStore } from "@/lib/stores/useCartStore"; // Added
import { useUIStore } from "@/lib/stores/useUIStore"; // Added
import styles from "./MobileNav.module.css";

type Props = {
  categories: CategoryNode[];
};

export default function MobileNav({ categories }: Props) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const toggleCart = useUIStore((s) => s.toggleCart); // Added
  const hydrated = useHydration(); // Added
  const totalItems = useCartStore((s) => s.totalItems); // Added

  return (
    <div className={styles.root}>
      <div className={styles.left}>
        <button
          type="button"
          className={styles.iconButton}
          aria-label="Open menu"
          onClick={() => setDrawerOpen(true)}
        >
          <Menu size={20} />
        </button>
      </div>

      <Link href="/" className={styles.logo} aria-label="Dorkari Jinish — Home">
        <Image
          src="/logo/logo.png"
          alt=""
          width={36}
          height={36}
          className={styles.logoMark}
          priority
        />
      </Link>

      <div className={styles.right}>
        {/* Added Mobile Cart Button */}
        <button
          type="button"
          className={`${styles.iconButton} relative`}
          aria-label="Cart"
          onClick={toggleCart}
        >
          <ShoppingCart size={20} />
          {hydrated && totalItems > 0 && (
            <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-brand-accent px-1 text-[10px] font-bold text-brand-primary">
              {totalItems}
            </span>
          )}
        </button>

        <NotificationBell />
        <LanguageSwitcher />
      </div>

      <CategoryDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        categories={categories}
        links={primaryNavLinks}
      />
    </div>
  );
}
