// src/components/navigation/MobileNav.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Menu } from "lucide-react";

import NotificationBell from "@/components/shared/NotificationBell";
import LanguageSwitcher from "@/components/shared/LanguageSwitcher";
import CategoryDrawer from "./CategoryDrawer";
import { primaryNavLinks, type CategoryNode } from "./navItems";
import styles from "./MobileNav.module.css";

type Props = {
  categories: CategoryNode[];
};

export default function MobileNav({ categories }: Props) {
  const [drawerOpen, setDrawerOpen] = useState(false);

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
