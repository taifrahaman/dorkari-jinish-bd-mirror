// src/components/cart/CartBadge.tsx

"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";

import { useCartStore } from "@/lib/stores/useCartStore";
import { useHydration } from "@/lib/stores/useHydration";

export default function CartBadge({ locale = "en" }: { locale?: "en" | "bn" }) {
  const hydrated = useHydration();
  const totalItems = useCartStore((s) => s.totalItems);

  return (
    <Link
      href="/cart"
      aria-label={locale === "bn" ? "কার্ট" : "Cart"}
      className="relative grid h-10 w-10 place-items-center rounded-full text-brand-text hover:bg-brand-navbar"
    >
      <ShoppingCart className="h-5 w-5" />
      {/* Rendered only after hydration, so the server-rendered (always-0) badge never mismatches localStorage's value. */}
      {hydrated && totalItems > 0 && (
        <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-brand-accent px-1 text-[10px] font-bold text-brand-primary">
          {totalItems > 99 ? "99+" : totalItems}
        </span>
      )}
    </Link>
  );
}
