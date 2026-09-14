// src/components/navigation/mobile/header/MobileHeaderLogo.tsx

"use client";

import Image from "next/image";
import Link from "next/link";
import styles from "./MobileHeader.module.css";

export default function MobileHeaderLogo() {
  return (
    <Link href="/" className={styles.logo} aria-label="Dorkari Jinish home">
      <Image
        src="/logo/logo.png"
        alt="Dorkari Jinish"
        width={38}
        height={38}
        priority
        className={styles.logoImage}
      />

      <span className={styles.logoText}>Dorkari Jinish</span>
    </Link>
  );
}
