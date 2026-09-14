// src/components/navigation/mobile/header/MobileHeaderMenu.tsx

"use client";

import { Menu } from "lucide-react";
import styles from "./MobileHeader.module.css";

export default function MobileHeaderMenu() {
  const handleMenuClick = () => {
    console.log("Category menu clicked");
  };

  return (
    <button
      type="button"
      className={styles.iconButton}
      onClick={handleMenuClick}
      aria-label="Open categories"
    >
      <Menu size={22} strokeWidth={2} />
    </button>
  );
}
