// src/components/footer/BackToTopButton.tsx

"use client";

import { ArrowUp } from "lucide-react";

import styles from "./Footer.module.css";

export default function BackToTopButton() {
  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className={styles.backToTop}
      aria-label="Back to top"
    >
      <ArrowUp className={styles.backToTopIcon} aria-hidden="true" />
    </button>
  );
}
