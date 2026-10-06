// src/components/admin/product/SpecKeyCombobox.tsx

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useSpecSuggestions } from "@/hooks/admin";

/* ============================================================
 * Types
 * ============================================================ */

export type SpecKeyComboboxProps = {
  value: string;
  onChange: (next: string) => void;
  categoryId?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  usedKeys?: Set<string>;
};

/* ============================================================
 * Component
 * ============================================================ */

export function SpecKeyCombobox({
  value,
  onChange,
  categoryId,
  placeholder = "key",
  disabled = false,
  className,
  usedKeys,
}: SpecKeyComboboxProps) {
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const suggestionsQuery = useSpecSuggestions(value, categoryId);
  const suggestions = suggestionsQuery.data ?? [];

  const filtered = useMemo(
    () => suggestions.filter((s) => s.key !== value),
    [suggestions, value],
  );

  useEffect(() => {
    setHighlighted(0);
  }, [filtered.length]);

  /* Click-outside to close */
  useEffect(() => {
    if (!open) return;

    const handler = (e: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  /* ----------------------------------------------------------
   * Keyboard
   *
   * Enter NEVER submits the outer form from this input —
   * it always "accepts the current value" and closes the
   * dropdown. This matches the "press Enter to use this one"
   * hint users see when there are no suggestions.
   * ---------------------------------------------------------- */

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();

      if (open && filtered.length > 0) {
        const pick = filtered[highlighted];
        if (pick) onChange(pick.key);
      }
      setOpen(false);
      return;
    }

    if (e.key === "Escape") {
      setOpen(false);
      return;
    }

    if (e.key === "Tab") {
      setOpen(false);
      return;
    }

    if (!open) {
      if (e.key === "ArrowDown") {
        setOpen(true);
        setHighlighted(0);
        e.preventDefault();
      }
      return;
    }

    if (filtered.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlighted((i) => (i + 1) % filtered.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted((i) => (i - 1 + filtered.length) % filtered.length);
    }
  };

  const selectKey = (key: string) => {
    onChange(key);
    setOpen(false);
    inputRef.current?.focus();
  };

  return (
    <div ref={wrapperRef} className="relative">
      <Input
        ref={inputRef}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={cn("h-9 font-mono text-xs", className)}
        disabled={disabled}
        autoComplete="off"
      />

      {open && (
        <div
          role="listbox"
          className="absolute left-0 right-0 top-full z-50 mt-1 max-h-64 overflow-auto rounded-md border border-brand-border bg-popover py-1 shadow-lg"
        >
          {suggestionsQuery.isLoading && filtered.length === 0 && (
            <div className="flex items-center gap-2 px-3 py-2 text-xs text-brand-text-secondary">
              <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
              Loading suggestions…
            </div>
          )}

          {!suggestionsQuery.isLoading && filtered.length === 0 && (
            <div className="px-3 py-2 text-xs text-brand-text-secondary">
              {value.trim()
                ? "No matching keys — press Enter to use this one."
                : "No existing keys yet."}
            </div>
          )}

          {filtered.length > 0 && (
            <ul>
              {filtered.map((s, i) => {
                const isHighlighted = i === highlighted;
                const isUsedElsewhere = usedKeys?.has(s.key) ?? false;

                return (
                  <li key={s.key}>
                    <button
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                      }}
                      onMouseEnter={() => setHighlighted(i)}
                      onClick={() => selectKey(s.key)}
                      className={cn(
                        "flex w-full items-center justify-between gap-3 px-3 py-1.5 text-left transition-colors",
                        isHighlighted && "bg-muted",
                      )}
                      role="option"
                      aria-selected={isHighlighted}
                    >
                      <div className="flex min-w-0 flex-col">
                        <span className="truncate font-mono text-xs text-brand-primary">
                          {s.key}
                        </span>
                        {s.exampleValue && (
                          <span className="truncate text-[10px] text-brand-text-secondary">
                            e.g. {s.exampleValue}
                          </span>
                        )}
                      </div>

                      <div className="flex shrink-0 items-center gap-2">
                        {isUsedElsewhere && (
                          <span className="text-[10px] text-brand-text-secondary">
                            already used
                          </span>
                        )}
                        <span className="text-[10px] tabular-nums text-brand-text-secondary">
                          {s.usageCount}×
                        </span>
                        {isHighlighted && (
                          <Check
                            className="h-3 w-3 text-brand-primary"
                            aria-hidden="true"
                          />
                        )}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export default SpecKeyCombobox;
