// src/components/navigation/mobile/language/LanguageSwitcher.tsx

"use client";

import { usePathname, useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import styles from "./LanguageSwitcher.module.css";

const LOCALES = [
  { code: "en", label: "EN" },
  { code: "bn", label: "বাং" },
] as const;

export default function LanguageSwitcher() {
  const pathname = usePathname();
  const router = useRouter();
  const locale = useLocale();

  const handleToggle = () => {
    const nextLocale = locale === "en" ? "bn" : "en";

    // Replace the locale segment of the current path
    const segments = pathname.split("/");
    if (segments[1] === "en" || segments[1] === "bn") {
      segments[1] = nextLocale;
    } else {
      segments.splice(1, 0, nextLocale);
    }

    router.push(segments.join("/") || `/${nextLocale}`);
  };

  return (
    <button
      type="button"
      aria-label={locale === "en" ? "Switch to Bengali" : "Switch to English"}
      className={styles.switcher}
      data-locale={locale}
      onClick={handleToggle}
    >
      <span className={styles.thumb} aria-hidden="true" />
      {LOCALES.map((l) => (
        <span
          key={l.code}
          className={styles.option}
          data-lang={l.code}
          aria-hidden="true"
        >
          {l.label}
        </span>
      ))}
    </button>
  );
}
