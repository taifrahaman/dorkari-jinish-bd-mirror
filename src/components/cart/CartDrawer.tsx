// src/components/cart/CartDrawer.tsx

"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { X, ShoppingBag, ArrowRight } from "lucide-react";
import gsap from "gsap";

import { useUIStore } from "@/lib/stores/useUIStore";
import { useCartStore } from "@/lib/stores/useCartStore";
import { useHydration } from "@/lib/stores/useHydration";
import type { Locale } from "@/lib/shop/types";

import CartDrawerItem from "./CartDrawerItem";

const fmtPrice = (n: number, locale: Locale) =>
  new Intl.NumberFormat(locale === "bn" ? "bn-BD" : "en-US", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 0,
  }).format(n);

export default function CartDrawer({ locale = "en" }: { locale?: Locale }) {
  const { isCartOpen, setIsCartOpen } = useUIStore();
  const { items, totalPrice, totalItems } = useCartStore();
  const hydrated = useHydration();

  const panelRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [isDomReady, setIsDomReady] = useState(false);

  useEffect(() => {
    setIsDomReady(true);
  }, []);

  useEffect(() => {
    if (isCartOpen) setMounted(true);
  }, [isCartOpen]);

  useEffect(() => {
    if (!mounted) return;
    const panel = panelRef.current;
    if (!panel) return;

    if (isCartOpen) {
      gsap.to(panel, { y: 0, opacity: 1, duration: 0.3, ease: "power2.out" });
    } else {
      gsap.to(panel, {
        y: -15,
        opacity: 0,
        duration: 0.2,
        ease: "power2.in",
        onComplete: () => setMounted(false),
      });
    }

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsCartOpen(false);
    };

    // Close on window scroll
    const handleScroll = () => {
      if (isCartOpen) setIsCartOpen(false);
    };

    window.addEventListener("keydown", handleKey);
    // Use passive listener for scroll performance
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("keydown", handleKey);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [isCartOpen, mounted, setIsCartOpen]);

  if (!mounted || !isDomReady) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100]">
      {/* Invisible Click-Catcher Backdrop */}
      <div
        onClick={() => setIsCartOpen(false)}
        className="absolute inset-0 bg-transparent"
        aria-hidden="true"
      />

      {/* Dropdown Panel Container */}
      <div className="absolute right-4 top-[72px] flex w-[calc(100vw-32px)] max-w-md flex-col sm:right-6 sm:top-[88px]">
        <div
          ref={panelRef}
          className="relative flex max-h-[calc(100vh-120px)] w-full -translate-y-4 flex-col overflow-hidden rounded-2xl border border-brand-border bg-brand-surface opacity-0 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.2)]"
          role="dialog"
          aria-modal="true"
          aria-label="Shopping Cart"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-brand-border px-5 py-4">
            <h2 className="font-heading text-lg font-bold text-brand-text">
              {locale === "bn" ? "আপনার কার্ট" : "Your Cart"}{" "}
              {hydrated && totalItems > 0 && (
                <span className="text-brand-text-secondary">
                  ({totalItems})
                </span>
              )}
            </h2>
            <button
              onClick={() => setIsCartOpen(false)}
              className="grid h-8 w-8 place-items-center rounded-full text-brand-text-secondary transition-colors hover:bg-brand-navbar"
              aria-label="Close cart"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Scrollable Body - Added overscroll-contain so scrolling inside doesn't trigger window scroll */}
          <div className="flex-1 overflow-y-auto overscroll-contain px-5">
            {!hydrated ? (
              <div className="flex h-full min-h-[150px] items-center justify-center">
                <span className="text-sm text-brand-text-secondary">
                  Loading...
                </span>
              </div>
            ) : items.length === 0 ? (
              <div className="flex h-full min-h-[200px] flex-col items-center justify-center gap-4 text-center">
                <div className="grid h-16 w-16 place-items-center rounded-full bg-brand-navbar text-brand-text-secondary">
                  <ShoppingBag className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-base font-semibold text-brand-text">
                    {locale === "bn" ? "কার্টটি খালি" : "Your cart is empty"}
                  </p>
                  <p className="mt-1 text-xs text-brand-text-secondary">
                    {locale === "bn"
                      ? "কেনাকাটা শুরু করতে পণ্য দেখুন।"
                      : "Looks like you haven't added anything yet."}
                  </p>
                </div>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="mt-2 rounded-full bg-brand-primary px-6 py-2 text-sm font-semibold text-white transition-transform active:scale-95"
                >
                  {locale === "bn" ? "কেনাকাটা করুন" : "Start Shopping"}
                </button>
              </div>
            ) : (
              <div className="divide-y divide-brand-border">
                {items.map((item) => (
                  <CartDrawerItem
                    key={item.productId}
                    item={item}
                    locale={locale}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Sticky Footer */}
          {hydrated && items.length > 0 && (
            <div className="border-t border-brand-border bg-brand-surface p-5">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm font-medium text-brand-text-secondary">
                  {locale === "bn" ? "সাবটোটাল" : "Subtotal"}
                </span>
                <span className="font-heading text-xl font-bold text-brand-text">
                  {fmtPrice(totalPrice, locale)}
                </span>
              </div>
              <div className="flex flex-col gap-2">
                <Link
                  href="/checkout"
                  onClick={() => setIsCartOpen(false)}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-brand-primary text-sm font-semibold text-white transition-transform active:scale-95"
                >
                  {locale === "bn" ? "চেকআউট করুন" : "Checkout"}{" "}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/cart"
                  onClick={() => setIsCartOpen(false)}
                  className="flex h-11 w-full items-center justify-center rounded-full border border-brand-border bg-transparent text-sm font-semibold text-brand-text transition-colors hover:bg-brand-navbar"
                >
                  {locale === "bn" ? "কার্ট দেখুন" : "View Cart"}
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
