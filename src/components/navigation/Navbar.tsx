// src/components/navigation/Navbar.tsx

"use client";

import DesktopNav from "./DesktopNav";
import MobileNav from "./MobileNav";
import type { CategoryNode } from "./navItems";
import styles from "./Navbar.module.css";
import { useNavVisibility } from "./useNavVisibility";

import CartDrawer from "@/components/cart/CartDrawer";
import SearchOverlay from "./SearchOverlay"; // <-- Import this

type Props = {
  categories: CategoryNode[];
  locale: "en" | "bn";
};

export default function Navbar({ categories, locale }: Props) {
  const { visible, scrolledUp } = useNavVisibility();

  return (
    <header
      className={styles.shell}
      data-visible={visible}
      data-scrolled-up={scrolledUp}
    >
      <div className={styles.bar}>
        <DesktopNav categories={categories} />
        <MobileNav categories={categories} />
      </div>
      {/* Global Overlays */}
      <CartDrawer locale={locale} />
      <SearchOverlay /> {/* <-- Render it here */}
    </header>
  );
}
