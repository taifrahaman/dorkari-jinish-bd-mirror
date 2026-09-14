// src/components/navigation/mobile/bottom-nav/MobileBottomNav.tsx

"use client";

import { usePathname } from "next/navigation";
import BottomNavItem from "./BottomNavItem";
import styles from "./MobileBottomNav.module.css";
import { mobileNavItems } from "../constants/mobileNavItems";

export default function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className={styles.container} aria-label="Mobile navigation">
      <div className={styles.nav}>
        {mobileNavItems.map((item) => (
          <BottomNavItem key={item.id} item={item} pathname={pathname} />
        ))}
      </div>
    </nav>
  );
}
