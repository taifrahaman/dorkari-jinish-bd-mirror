// src/components/hero/HeroBackground.tsx
import type { CSSProperties } from "react";
import styles from "./HeroBackground.module.css";

export type HeroBgHeight = "sm" | "md" | "lg" | "full" | (string & {});

type Props = {
  height?: HeroBgHeight;
  className?: string;
};

const PRESETS: Record<string, string> = {
  sm: "60vh",
  md: "80vh",
  lg: "100vh",
  full: "100%",
};

export default function HeroBackground({ height = "full", className }: Props) {
  const value = PRESETS[height] ?? height;
  const style = { "--hero-bg-height": value } as CSSProperties;

  return (
    <div
      className={[styles.wrapper, className].filter(Boolean).join(" ")}
      style={style}
      aria-hidden
    >
      <div className={styles.blur}>
        <div className={styles.ellipse}>
          <div className={`${styles.spin} ${styles.spinA}`} />
          <div className={`${styles.spin} ${styles.spinB}`} />
        </div>
      </div>
    </div>
  );
}
