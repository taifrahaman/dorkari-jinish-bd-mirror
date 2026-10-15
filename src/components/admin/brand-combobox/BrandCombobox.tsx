// src/components/admin/brand-combobox/BrandCombobox.tsx

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronsUpDown, Loader2, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useBrandSuggest, useCreateBrand, useBrands } from "@/hooks/admin";

/* ============================================================
 * Types
 * ============================================================ */

export type BrandOption = {
  _id: string;
  name: string;
  slug: string;
  productCount?: number;
};

export type BrandComboboxProps = {
  value: string | undefined;
  onChange: (value: string | undefined) => void;
  allowCreate?: boolean;
  disabled?: boolean;
  placeholder?: string;
  emptyMessage?: string;
  className?: string;
};

/* ============================================================
 * Component
 * ============================================================ */

export function BrandCombobox({
  value,
  onChange,
  allowCreate = true,
  disabled = false,
  placeholder = "Select brand…",
  emptyMessage = "No brands found.",
  className,
}: BrandComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedQuery(query), 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const suggest = useBrandSuggest(debouncedQuery, 20);
  const createBrand = useCreateBrand();

  /* Base list — first page of active brands, cached by React Query */
  const listQuery = useBrands({ isActive: true, page: 1, limit: 200 });

  const baseList = useMemo<BrandOption[]>(() => {
    const items = listQuery.data?.items ?? [];
    return items.map((b) => ({
      _id: b._id,
      name: b.name.en,
      slug: b.slug,
      productCount: b.productCount,
    }));
  }, [listQuery.data]);

  const isBaseLoading = baseList.length === 0 && listQuery.isLoading;

  /* ----------------------------------------------------------
   * Selected option
   * ---------------------------------------------------------- */

  const selected = useMemo<BrandOption | null>(() => {
    const fromBase = baseList.find((b) => b._id === value);
    if (fromBase) return fromBase;

    const fromSuggest = suggest.data?.find((b) => b._id === value);
    if (fromSuggest) {
      return {
        _id: fromSuggest._id,
        name: fromSuggest.name.en,
        slug: fromSuggest.slug,
        productCount: fromSuggest.productCount,
      };
    }
    return null;
  }, [baseList, suggest.data, value]);

  /* ----------------------------------------------------------
   * Display options
   * ---------------------------------------------------------- */

  const options = useMemo<BrandOption[]>(() => {
    const hasApiQuery = debouncedQuery.trim().length > 0;

    if (hasApiQuery) {
      const fromApi: BrandOption[] = (suggest.data ?? []).map((b) => ({
        _id: b._id,
        name: b.name.en,
        slug: b.slug,
        productCount: b.productCount,
      }));

      const apiIds = new Set(fromApi.map((o) => o._id));
      const q = query.trim().toLowerCase();
      const fromBase = baseList
        .filter((b) => !apiIds.has(b._id))
        .filter(
          (b) =>
            b.name.toLowerCase().includes(q) ||
            b.slug.toLowerCase().includes(q),
        );

      return [...fromApi, ...fromBase];
    }

    const q = query.trim().toLowerCase();
    if (!q) return baseList;
    return baseList.filter(
      (b) =>
        b.name.toLowerCase().includes(q) || b.slug.toLowerCase().includes(q),
    );
  }, [baseList, query, debouncedQuery, suggest.data]);

  /* ----------------------------------------------------------
   * Exact match / create
   * ---------------------------------------------------------- */

  const hasExactMatch = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return true;
    return options.some(
      (b) => b.name.toLowerCase() === needle || b.slug.toLowerCase() === needle,
    );
  }, [options, query]);

  const canCreate = allowCreate && query.trim().length >= 2 && !hasExactMatch;
  const isSearchingApi = debouncedQuery.trim().length > 0 && suggest.isFetching;
  const showEmptyState =
    !isBaseLoading && !isSearchingApi && options.length === 0 && !canCreate;

  /* ----------------------------------------------------------
   * Handlers
   * ---------------------------------------------------------- */

  const handleSelect = (id: string) => {
    onChange(id);
    setOpen(false);
    setQuery("");
    setDebouncedQuery("");
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(undefined);
  };

  const handleCreate = async () => {
    const name = query.trim();
    if (!name) return;

    try {
      const created = await createBrand.mutateAsync({
        name: { en: name, bn: name },
        isActive: true,
      });
      onChange(created._id);
      setOpen(false);
      setQuery("");
      setDebouncedQuery("");
    } catch {
      // Toast shown by mutation hook
    }
  };

  /* ----------------------------------------------------------
   * Render
   * ---------------------------------------------------------- */

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-haspopup="listbox"
            disabled={disabled}
            className={cn(
              "h-9 w-full justify-between font-normal",
              !selected && "text-brand-text-secondary",
              className,
            )}
          />
        }
      >
        <span className="truncate">
          {selected ? selected.name : placeholder}
        </span>

        <span className="ml-2 flex shrink-0 items-center gap-1">
          {selected && !disabled && (
            <span
              role="button"
              tabIndex={0}
              onClick={handleClear}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onChange(undefined);
                }
              }}
              className="grid h-4 w-4 place-items-center rounded-full text-brand-text-secondary hover:bg-muted hover:text-brand-primary"
              aria-label="Clear selection"
            >
              <X className="h-3 w-3" aria-hidden="true" />
            </span>
          )}
          <ChevronsUpDown
            className="h-4 w-4 shrink-0 opacity-50"
            aria-hidden="true"
          />
        </span>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        className="w-[--radix-popover-trigger-width] min-w-[260px] p-0"
      >
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search brands…"
            value={query}
            onValueChange={setQuery}
          />

          <CommandList>
            {isBaseLoading && (
              <div className="flex items-center gap-2 px-3 py-4 text-xs text-brand-text-secondary">
                <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
                Loading brands…
              </div>
            )}

            {isSearchingApi && !isBaseLoading && (
              <div className="flex items-center gap-2 px-3 py-4 text-xs text-brand-text-secondary">
                <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
                Searching…
              </div>
            )}

            {showEmptyState && <CommandEmpty>{emptyMessage}</CommandEmpty>}

            {options.length > 0 && (
              <CommandGroup heading="Brands">
                {options.map((brand) => {
                  const showCount =
                    typeof brand.productCount === "number" &&
                    brand.productCount > 0;

                  return (
                    <CommandItem
                      key={brand._id}
                      value={brand._id}
                      onSelect={() => handleSelect(brand._id)}
                      className="flex items-center justify-between"
                    >
                      <span className="truncate">
                        {brand.name}
                        {showCount && (
                          <span className="ml-1.5 text-[11px] text-brand-text-secondary">
                            ({brand.productCount})
                          </span>
                        )}
                      </span>
                      <Check
                        className={cn(
                          "ml-2 h-4 w-4 shrink-0",
                          value === brand._id ? "opacity-100" : "opacity-0",
                        )}
                        aria-hidden="true"
                      />
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            )}

            {canCreate && (
              <>
                {options.length > 0 && <CommandSeparator />}
                <CommandGroup>
                  <CommandItem
                    value={`__create__${query}`}
                    onSelect={handleCreate}
                    disabled={createBrand.isPending}
                    className="text-brand-primary"
                  >
                    {createBrand.isPending ? (
                      <Loader2
                        className="mr-2 h-4 w-4 animate-spin"
                        aria-hidden="true"
                      />
                    ) : (
                      <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
                    )}
                    Create &quot;{query.trim()}&quot;
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export default BrandCombobox;
