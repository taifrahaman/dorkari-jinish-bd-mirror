// src/components/cart/CartDrawerItem.tsx

"use client";

import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useCartStore, type CartItem } from "@/lib/stores/useCartStore";
import type { Locale } from "@/lib/shop/types";

const fmtPrice = (n: number, locale: Locale) =>
  new Intl.NumberFormat(locale === "bn" ? "bn-BD" : "en-US", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 0,
  }).format(n);

export default function CartDrawerItem({
  item,
  locale = "en",
}: {
  item: CartItem;
  locale?: Locale;
}) {
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);

  return (
    <div className="flex gap-4 py-4">
      <Link
        href={item.slug ? `/product/${item.slug}` : "#"}
        className="relative h-20 w-20 flex-none overflow-hidden rounded-xl bg-brand-navbar"
      >
        {item.image ? (
          <img src={item.image} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-brand-text-secondary">
            No Img
          </div>
        )}
      </Link>

      <div className="flex flex-1 flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-2">
            <Link
              href={item.slug ? `/product/${item.slug}` : "#"}
              className="line-clamp-2 text-sm font-semibold text-brand-text hover:text-brand-primary"
            >
              {item.name}
            </Link>
            <button
              onClick={() => removeItem(item.productId)}
              className="flex-none text-brand-text-secondary transition-colors hover:text-red-600"
              aria-label="Remove item"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>

          {item.colorName && (
            <p className="mt-1 flex items-center gap-1.5 text-[11px] text-brand-text-secondary">
              {item.colorHex && (
                <span
                  className="h-2.5 w-2.5 rounded-full ring-1 ring-inset ring-black/10"
                  style={{ backgroundColor: item.colorHex }}
                />
              )}
              {item.colorName}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center rounded-full border border-brand-border">
            <button
              onClick={() => updateQuantity(item.productId, item.quantity - 1)}
              disabled={item.quantity <= 1}
              className="grid h-7 w-7 place-items-center text-brand-text disabled:opacity-30"
            >
              <Minus className="h-3 w-3" />
            </button>
            <span className="w-5 text-center text-xs font-semibold tabular-nums">
              {item.quantity}
            </span>
            <button
              onClick={() => updateQuantity(item.productId, item.quantity + 1)}
              disabled={
                item.stockCount ? item.quantity >= item.stockCount : false
              }
              className="grid h-7 w-7 place-items-center text-brand-text disabled:opacity-30"
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>

          <p className="text-sm font-bold text-brand-text">
            {fmtPrice(item.price * item.quantity, locale)}
          </p>
        </div>
      </div>
    </div>
  );
}
