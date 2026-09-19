// src/components/navigation/Navbar.tsx

"use client";

import DesktopNav from "./DesktopNav";
import MobileNav from "./MobileNav";
import styles from "./Navbar.module.css";
import { useNavVisibility } from "./useNavVisibility";

export default function Navbar() {
  const { visible, scrolledUp } = useNavVisibility();

  return (
    <header
      className={styles.shell}
      data-visible={visible}
      data-scrolled-up={scrolledUp}
    >
      <div className={styles.bar}>
        <DesktopNav />
        <MobileNav />
      </div>
    </header>
  );
}
