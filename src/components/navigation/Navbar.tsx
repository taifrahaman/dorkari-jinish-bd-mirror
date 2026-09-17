// src/components/navigation/Navbar.tsx
"use client";

import { useNavVisibility } from "./useNavVisibility";
import DesktopNav from "./DesktopNav";
import MobileNav from "./MobileNav";
import styles from "./Navbar.module.css";

export default function Navbar() {
  const visible = useNavVisibility();

  return (
    <header className={styles.shell} data-visible={visible}>
      <div className={styles.bar}>
        <DesktopNav />
        <MobileNav />
      </div>
    </header>
  );
}
