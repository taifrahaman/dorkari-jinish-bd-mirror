// src/components/layout/PageShell.tsx

"use client";

import { usePathname } from "next/navigation";
import { useLocale } from "next-intl";

const HEADER_HEIGHT = 64;

export default function PageShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const locale = useLocale();

  const stripped =
    pathname && pathname.startsWith(`/${locale}`)
      ? pathname.slice(`/${locale}`.length) || "/"
      : pathname || "/";

  const isHomePage = stripped === "/";

  return (
    <main style={isHomePage ? undefined : { paddingTop: `${HEADER_HEIGHT}px` }}>
      {children}
    </main>
  );
}
