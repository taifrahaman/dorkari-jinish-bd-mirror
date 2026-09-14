// src/components/navigation/mobile/hooks/useMobileNavScroll.ts

"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useLocale } from "next-intl";

const SCROLL_THRESHOLD = 160; // min scrollY before header can appear
const SCROLL_STOP_DELAY = 350; // ms of no scroll before header reveals

export function useMobileNavScroll() {
  const pathname = usePathname();
  const locale = useLocale();

  // Strip locale prefix so "/en" and "/bn" both map to "/"
  const stripped =
    pathname && pathname.startsWith(`/${locale}`)
      ? pathname.slice(`/${locale}`.length) || "/"
      : pathname || "/";
  const isHomePage = stripped === "/";

  const [scrollY, setScrollY] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let timeout: ReturnType<typeof setTimeout> | null = null;

    const handleScroll = () => {
      setScrollY(window.scrollY);
      setIsScrolling(true);

      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => setIsScrolling(false), SCROLL_STOP_DELAY);
    };

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (timeout) clearTimeout(timeout);
    };
  }, []);

  // Non-home: always visible.
  // Home: visible only when user has stopped scrolling AND passed threshold.
  const headerVisible = isHomePage
    ? !isScrolling && scrollY >= SCROLL_THRESHOLD
    : true;

  return { headerVisible, scrollY, isScrolling, isHomePage };
}
