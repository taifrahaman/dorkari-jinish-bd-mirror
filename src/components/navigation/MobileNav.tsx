// src/components/navigation/MobileNav.tsx

"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Menu, ShoppingCart, User } from "lucide-react";
import { useLocale } from "next-intl";

import NotificationBell from "@/components/shared/NotificationBell";
import LanguageSwitcher from "@/components/shared/LanguageSwitcher";
import CategoryDrawer from "./CategoryDrawer";
import { primaryNavLinks, type CategoryNode } from "./navItems";
import { useHydration } from "@/lib/stores/useHydration";
import { useCartStore } from "@/lib/stores/useCartStore";
import { useUIStore } from "@/lib/stores/useUIStore";
import { useAuthStore } from "@/lib/stores/useAuthStore"; // <-- Added
import styles from "./MobileNav.module.css";

type Props = {
  categories: CategoryNode[];
};

export default function MobileNav({ categories }: Props) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const locale = useLocale();

  const toggleCart = useUIStore((s) => s.toggleCart);
  const hydrated = useHydration();
  const totalItems = useCartStore((s) => s.totalItems);
  const user = useAuthStore((s) => s.user); // <-- Added

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

      <Link
        href={`/${locale}`}
        className={styles.logo}
        aria-label="Dorkari Jinish — Home"
      >
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
        {/* Added User Profile Icon */}
        <Link
          href={user ? `/${locale}/profile` : `/${locale}/login`}
          className={styles.iconButton}
          aria-label="Account"
        >
          <User size={20} />
        </Link>

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
