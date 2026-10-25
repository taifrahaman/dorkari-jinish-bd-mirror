// src/components/cart/EmptyCart.tsx

"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";

import type { Locale } from "@/lib/shop/types";

export default function EmptyCart({ locale = "en" }: { locale?: Locale }) {
  return (
    <div className="flex flex-col items-center gap-4 py-20 text-center">
      <span className="grid h-20 w-20 place-items-center rounded-full bg-brand-navbar">
        <ShoppingBag className="h-9 w-9 text-brand-text-secondary" />
      </span>
      <div>
        <h1 className="font-heading text-xl font-bold text-brand-text">
          {locale === "bn" ? "আপনার কার্ট খালি" : "Your cart is empty"}
        </h1>
        <p className="mt-1 text-sm text-brand-text-secondary">
          {locale === "bn"
            ? "কেনাকাটা শুরু করতে শপে যান।"
            : "Start adding items you love."}
        </p>
      </div>
      <Link
        href={`/${locale}/shop`}
        className="rounded-full bg-brand-primary px-6 py-3 text-sm font-semibold text-white"
      >
        {locale === "bn" ? "শপিং করুন" : "Continue shopping"}
      </Link>
    </div>
  );
}
