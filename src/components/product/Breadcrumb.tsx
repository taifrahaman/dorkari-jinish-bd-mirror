// src/components/product/Breadcrumb.tsx

"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";

import type { Locale } from "@/lib/shop/types";

type Crumb = { label: string; href?: string };

export default function Breadcrumb({
  items,
  locale = "en",
}: {
  items: Crumb[];
  locale?: Locale;
}) {
  return (
    <nav
      aria-label={locale === "bn" ? "ব্রেডক্রাম্ব" : "Breadcrumb"}
      className="mb-4"
    >
      <ol className="flex flex-wrap items-center gap-1.5 text-xs text-brand-text-secondary sm:text-sm">
        {items.map((item, i) => {
          const last = i === items.length - 1;
          return (
            <li key={item.label} className="flex items-center gap-1.5">
              {item.href && !last ? (
                <Link
                  href={item.href}
                  className="transition-colors hover:text-brand-primary"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  className={last ? "font-medium text-brand-text" : ""}
                  aria-current={last ? "page" : undefined}
                >
                  {item.label}
                </span>
              )}
              {!last && (
                <ChevronRight className="h-3.5 w-3.5 flex-none" aria-hidden />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
