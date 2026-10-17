// src/components/navigation/SearchOverlay.tsx

"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { ArrowRight, Search, X } from "lucide-react";
import gsap from "gsap";

import { useUIStore } from "@/lib/stores/useUIStore";

export default function SearchOverlay() {
  const router = useRouter();
  const locale = useLocale();
  const { isSearchOpen, setIsSearchOpen } = useUIStore();
  const [query, setQuery] = useState("");

  const overlayRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [mounted, setMounted] = useState(false);
  const [isDomReady, setIsDomReady] = useState(false);

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
      document.body.style.overflow = "hidden"; // Lock body scroll

      // Animate in
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

      // Animate out
      gsap.to(overlay, { opacity: 0, duration: 0.2, ease: "power2.in" });
      gsap.to(panel, {
        y: -20,
        opacity: 0,
        duration: 0.2,
        ease: "power2.in",
        onComplete: () => {
          setMounted(false);
          setQuery(""); // Clear query on close
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
          <Search className="absolute left-5 h-5 w-5 text-brand-text-secondary" />

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
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="grid h-8 w-8 place-items-center rounded-full text-brand-text-secondary hover:bg-brand-navbar"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            <button
              type="submit"
              disabled={!query.trim()}
              className="grid h-10 w-10 place-items-center rounded-full bg-brand-primary text-white transition-transform active:scale-95 disabled:opacity-50"
              aria-label="Search"
            >
              <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        </form>

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
