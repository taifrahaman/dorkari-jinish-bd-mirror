// src/components/navigation/SearchOverlay.tsx

"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import Link from "next/link";
import { ArrowRight, Search as SearchIcon, X, Loader2 } from "lucide-react";
import gsap from "gsap";

import { useUIStore } from "@/lib/stores/useUIStore";
import type { StorefrontProduct } from "@/lib/storefront/product-mapper";
import { toShopProducts } from "@/lib/shop/adapter";

export default function SearchOverlay() {
  const router = useRouter();
  const locale = useLocale();
  const { isSearchOpen, setIsSearchOpen } = useUIStore();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<StorefrontProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const overlayRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [mounted, setMounted] = useState(false);
  const [isDomReady, setIsDomReady] = useState(false);

  // 1. Debounced Search Logic
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    // Wait 350ms after the user stops typing before hitting the API
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/storefront/search?q=${encodeURIComponent(query)}&limit=4`,
        );
        const json = await res.json();
        if (json.success) setResults(json.data);
      } catch (err) {
        console.error("Search failed", err);
      } finally {
        setIsLoading(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [query]);

  // 2. Animation & Scroll Lock
  useEffect(() => {
    setIsDomReady(true);
  }, []);

  useEffect(() => {
    if (isSearchOpen) setMounted(true);
  }, [isSearchOpen]);

  useEffect(() => {
    if (!mounted) return;
    const overlay = overlayRef.current;
    const panel = panelRef.current;
    if (!overlay || !panel) return;

    if (isSearchOpen) {
      document.body.style.overflow = "hidden";
      gsap.to(overlay, { opacity: 1, duration: 0.25, ease: "power2.out" });
      gsap.fromTo(
        panel,
        { y: -20, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.35,
          ease: "power3.out",
          onComplete: () => inputRef.current?.focus(),
        },
      );
    } else {
      document.body.style.overflow = "";
      gsap.to(overlay, { opacity: 0, duration: 0.2, ease: "power2.in" });
      gsap.to(panel, {
        y: -20,
        opacity: 0,
        duration: 0.2,
        ease: "power2.in",
        onComplete: () => {
          setMounted(false);
          setQuery(""); // Clear on close
          setResults([]);
        },
      });
    }

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsSearchOpen(false);
    };
    window.addEventListener("keydown", handleKey);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKey);
    };
  }, [isSearchOpen, mounted, setIsSearchOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setIsSearchOpen(false);
    router.push(`/${locale}/search?q=${encodeURIComponent(query.trim())}`);
  };

  const handleViewAll = () => {
    if (!query.trim()) return;
    setIsSearchOpen(false);
    router.push(`/${locale}/search?q=${encodeURIComponent(query.trim())}`);
  };

  if (!mounted || !isDomReady) return null;

  return createPortal(
    <div className="fixed inset-0 z-[110] flex flex-col items-center pt-[10vh] sm:pt-[15vh]">
      {/* Blurred Backdrop */}
      <div
        ref={overlayRef}
        onClick={() => setIsSearchOpen(false)}
        className="absolute inset-0 bg-brand-background/80 opacity-0 backdrop-blur-md"
        aria-hidden="true"
      />

      {/* Search Panel */}
      <div ref={panelRef} className="relative w-full max-w-2xl px-4 sm:px-6">
        <form
          onSubmit={handleSubmit}
          className="relative flex w-full items-center"
        >
          <SearchIcon className="absolute left-5 h-5 w-5 text-brand-text-secondary" />

          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              locale === "bn" ? "পণ্য খুঁজুন..." : "Search products..."
            }
            className="h-14 w-full rounded-full border-none bg-brand-surface pl-14 pr-24 text-base text-brand-text shadow-2xl outline-none ring-1 ring-brand-border focus:ring-2 focus:ring-brand-primary sm:h-16 sm:text-lg"
          />

          <div className="absolute right-3 flex items-center gap-1">
            {isLoading ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin text-brand-text-secondary" />
            ) : query ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="grid h-8 w-8 place-items-center rounded-full text-brand-text-secondary hover:bg-brand-navbar"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}

            <button
              type="submit"
              disabled={!query.trim()}
              className="grid h-10 w-10 place-items-center rounded-full bg-brand-primary text-white transition-transform active:scale-95 disabled:opacity-50"
            >
              <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        </form>

        {/* Elastic Results Dropdown */}
        {query.trim().length > 0 && !isLoading && (
          <div className="mt-4 overflow-hidden rounded-2xl border border-brand-border bg-brand-surface shadow-2xl">
            {results.length > 0 ? (
              <div className="flex flex-col">
                {results.map((product) => (
                  <Link
                    key={product.id}
                    href={`/${locale}/product/${product.slug}`}
                    onClick={() => setIsSearchOpen(false)}
                    className="flex items-center gap-4 border-b border-brand-border/50 p-3 transition-colors hover:bg-brand-navbar last:border-0"
                  >
                    <div className="h-12 w-12 flex-none overflow-hidden rounded-lg bg-brand-navbar">
                      <img
                        src={
                          product.images[0]?.url || "/placeholder-product.svg"
                        }
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <p className="line-clamp-1 text-sm font-medium text-brand-text">
                        {product.name[locale as "en" | "bn"]}
                      </p>
                      <p className="text-xs text-brand-text-secondary">
                        ৳{product.price}
                      </p>
                    </div>
                  </Link>
                ))}

                {/* See All Button */}
                <button
                  onClick={handleViewAll}
                  className="flex items-center justify-center gap-2 bg-brand-navbar/50 p-3 text-sm font-semibold text-brand-primary transition-colors hover:bg-brand-navbar"
                >
                  {locale === "bn" ? "সব ফলাফল দেখুন" : "See all results"}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="p-6 text-center text-sm text-brand-text-secondary">
                {locale === "bn"
                  ? "কোনো পণ্য পাওয়া যায়নি"
                  : "No products found."}
              </div>
            )}
          </div>
        )}

        <button
          onClick={() => setIsSearchOpen(false)}
          className="mt-6 block w-full text-center text-sm font-medium text-brand-text-secondary hover:text-brand-text sm:hidden"
        >
          {locale === "bn" ? "বাতিল করুন" : "Cancel"}
        </button>
      </div>
    </div>,
    document.body,
  );
}
