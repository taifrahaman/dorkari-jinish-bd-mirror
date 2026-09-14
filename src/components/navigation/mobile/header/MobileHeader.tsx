// src/components/navigation/mobile/header/MobileHeader.tsx

"use client";

import MobileHeaderLogo from "./MobileHeaderLogo";
import MobileHeaderMenu from "./MobileHeaderMenu";
import MobileHeaderNotification from "./MobileHeaderNotification";
import LanguageSwitcher from "../language/LanguageSwitcher";
import { useMobileNavScroll } from "../hooks/useMobileNavScroll";
import styles from "./MobileHeader.module.css";

export default function MobileHeader() {
  const { headerVisible } = useMobileNavScroll();

  return (
    <header
      className={styles.header}
      data-visible={headerVisible ? "true" : "false"}
      aria-hidden={!headerVisible}
    >
      <div className={styles.left}>
        <MobileHeaderMenu />
      </div>
      <div className={styles.center}>
        <MobileHeaderLogo />
      </div>
      <div className={styles.right}>
        <LanguageSwitcher />
        <MobileHeaderNotification />
      </div>
    </header>
  );
}
