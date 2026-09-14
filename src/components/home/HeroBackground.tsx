// src/components/home/HeroBackground.tsx

"use client";

import styles from "./HeroBackground.module.css";

export default function HeroBackground() {
  return (
    <div className={styles.wrapper} aria-hidden="true">
      <div className={styles.blur}>
        <div className={styles.spin} />
      </div>
    </div>
  );
}
