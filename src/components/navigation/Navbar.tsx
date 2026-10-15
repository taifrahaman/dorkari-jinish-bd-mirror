// src/components/navigation/Navbar.tsx
"use client";

import DesktopNav from "./DesktopNav";
import MobileNav from "./MobileNav";
import type { CategoryNode } from "./navItems";
import styles from "./Navbar.module.css";
import { useNavVisibility } from "./useNavVisibility";

type Props = {
  categories: CategoryNode[];
};

export default function Navbar({ categories }: Props) {
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
    </header>
  );
}
