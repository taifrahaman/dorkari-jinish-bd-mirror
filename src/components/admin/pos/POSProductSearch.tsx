// src/components/admin/pos/POSProductSearch.tsx

"use client";

import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/* ============================================================
 * Types
 * ============================================================ */

export type POSProductSearchProps = {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  /** Focus the input on mount so barcode scanning works immediately. */
  autoFocus?: boolean;
  className?: string;
};

/* ============================================================
 * Component
 * ============================================================ */

export function POSProductSearch({
  value,
  onChange,
  placeholder = "Search products or scan barcode…",
  autoFocus = true,
  className,
}: POSProductSearchProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (autoFocus) {
      inputRef.current?.focus();
    }
  }, [autoFocus]);

  // Re-focus the search input after a barcode scan (if focus was lost)
  useEffect(() => {
    const handler = () => {
      if (
        document.activeElement !== inputRef.current &&
        !(document.activeElement as HTMLElement)?.closest(
          "[data-pos-no-refocus]",
        )
      ) {
        inputRef.current?.focus();
      }
    };
    window.addEventListener("focus", handler);
    return () => window.removeEventListener("focus", handler);
  }, []);

  return (
    <div className={cn("relative", className)}>
      <Search
        className={cn(
          "pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transition-colors",
          focused ? "text-brand-primary" : "text-brand-text-secondary",
        )}
        aria-hidden="true"
      />
      <Input
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        className="h-11 pl-9 pr-9 text-sm"
        autoComplete="off"
      />
      {value.length > 0 && (
        <button
          type="button"
          onClick={() => {
            onChange("");
            inputRef.current?.focus();
          }}
          className="absolute right-2 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-full text-brand-text-secondary transition-colors hover:bg-muted hover:text-brand-primary"
          aria-label="Clear search"
        >
          <X className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

export default POSProductSearch;
