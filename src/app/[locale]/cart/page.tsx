// src/app/cart/page.tsx

import CartPage from "@/components/cart";
import type { Locale } from "@/lib/shop/types";

function resolveLocale(searchParams?: { lang?: string }): Locale {
  return searchParams?.lang === "bn" ? "bn" : "en";
}

export default function Page({
  searchParams,
}: {
  searchParams?: { lang?: string };
}) {
  return <CartPage locale={resolveLocale(searchParams)} />;
}
