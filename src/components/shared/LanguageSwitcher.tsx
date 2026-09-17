// src/components/shared/LanguageSwitcher.tsx
"use client";

import { usePathname, useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { useTransition } from "react";
import styles from "./LanguageSwitcher.module.css";

export default function LanguageSwitcher() {
  const pathname = usePathname();
  const router = useRouter();
  const locale = useLocale();
  const [isPending, startTransition] = useTransition();

  const toggle = () => {
    const next = locale === "bn" ? "en" : "bn";
    const segments = pathname.split("/");
    // segments[0] is "" (leading slash), segments[1] is the locale
    segments[1] = next;
    const nextPath = segments.join("/") || `/${next}`;
    startTransition(() => router.replace(nextPath));
  };

  return (
    <button
      type="button"
      className={styles.switcher}
      data-locale={locale}
      onClick={toggle}
      aria-label={`Switch to ${locale === "bn" ? "English" : "বাংলা"}`}
      aria-busy={isPending}
    >
      <span className={styles.thumb} aria-hidden />
      <span className={styles.option} data-lang="en">
        EN
      </span>
      <span className={styles.option} data-lang="bn">
        বাং
      </span>
    </button>
  );
}
