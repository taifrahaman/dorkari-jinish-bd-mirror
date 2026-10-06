// src/components/admin/category-combobox/CategoryCombobox.tsx

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
import {
  useCategorySuggest,
  useCategoryTree,
  useCreateCategory,
} from "@/hooks/admin";
import type { CategoryTreeNode } from "@/lib/validations/category.schema";

/* ============================================================
 * Types
 * ============================================================ */

export type CategoryOption = {
  _id: string;
  name: string;
  path?: string;
  specTemplate?: string[];
};

export type CategoryComboboxProps = {
  value: string | undefined;
  onChange: (value: string | undefined) => void;
  /** Optional pre-flattened list. If omitted or empty, the
   *  combobox fetches the tree itself. */
  initialCategories?: CategoryOption[];
  allowCreate?: boolean;
  disabled?: boolean;
  placeholder?: string;
  emptyMessage?: string;
  className?: string;
};

/* ============================================================
 * Flatten helper
 * ============================================================ */

function flattenTree(nodes: CategoryTreeNode[]): CategoryOption[] {
  const out: CategoryOption[] = [];

  function walk(list: CategoryTreeNode[]) {
    for (const node of list) {
      out.push({
        _id: node._id,
        name: node.name.en,
        path: node.path,
        specTemplate: node.specTemplate,
      });
      if (node.children && node.children.length > 0) walk(node.children);
    }
  }

  walk(nodes);
  return out;
}

/* ============================================================
 * Component
 * ============================================================ */

export function CategoryCombobox({
  value,
  onChange,
  initialCategories,
  allowCreate = true,
  disabled = false,
  placeholder = "Select category…",
  emptyMessage = "No categories found.",
  className,
}: CategoryComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  /* Debounce the query */
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedQuery(query), 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  /* Suggestions — only fires when the query has content */
  const suggest = useCategorySuggest(debouncedQuery, 10);
  const createCategory = useCreateCategory();

  /* Fallback tree — shares the React Query cache with any parent
       that also calls `useCategoryTree()`, so no duplicate fetch. */
  const treeQuery = useCategoryTree();

  /* ----------------------------------------------------------
   * Base list — shown when the query is empty
   * ---------------------------------------------------------- */

  const baseList = useMemo<CategoryOption[]>(() => {
    if (initialCategories && initialCategories.length > 0) {
      return initialCategories;
    }
    return flattenTree(treeQuery.data ?? []);
  }, [initialCategories, treeQuery.data]);

  const isBaseLoading =
    baseList.length === 0 &&
    treeQuery.isLoading &&
    (!initialCategories || initialCategories.length === 0);

  /* ----------------------------------------------------------
   * Selected option
   * ---------------------------------------------------------- */

  const selected = useMemo<CategoryOption | null>(() => {
    const fromBase = baseList.find((c) => c._id === value);
    if (fromBase) return fromBase;

    const fromSuggest = suggest.data?.find((c) => c._id === value);
    if (fromSuggest) {
      return {
        _id: fromSuggest._id,
        name: fromSuggest.name.en,
        path: fromSuggest.path,
        specTemplate: fromSuggest.specTemplate,
      };
    }
    return null;
  }, [baseList, suggest.data, value]);

  /* ----------------------------------------------------------
   * Display options
   *
   * - Query empty     → full base list
   * - Query has text  → API results merged with any base-list
   *                     matches the API hasn't returned yet
   *
   * Merging avoids the "list flashes empty" feel while the API
   * round-trip is in flight.
   * ---------------------------------------------------------- */

  type DisplayOption = {
    _id: string;
    name: string;
    nameBn?: string;
    path?: string;
    slug?: string;
  };

  const options = useMemo<DisplayOption[]>(() => {
    const hasApiQuery = debouncedQuery.trim().length > 0;

    if (hasApiQuery) {
      const fromApi: DisplayOption[] = (suggest.data ?? []).map((c) => ({
        _id: c._id,
        name: c.name.en,
        nameBn: c.name.bn,
        path: c.path,
        slug: c.slug,
      }));

      const apiIds = new Set(fromApi.map((o) => o._id));
      const q = query.trim().toLowerCase();
      const fromBase: DisplayOption[] = baseList
        .filter((c) => !apiIds.has(c._id))
        .filter(
          (c) =>
            c.name.toLowerCase().includes(q) ||
            (c.path?.toLowerCase().includes(q) ?? false),
        )
        .map((c) => ({
          _id: c._id,
          name: c.name,
          path: c.path,
        }));

      return [...fromApi, ...fromBase];
    }

    /* No API query — filter base list locally for instant feedback */
    const q = query.trim().toLowerCase();
    const filtered = q
      ? baseList.filter(
          (c) =>
            c.name.toLowerCase().includes(q) ||
            (c.path?.toLowerCase().includes(q) ?? false),
        )
      : baseList;

    return filtered.map((c) => ({
      _id: c._id,
      name: c.name,
      path: c.path,
    }));
  }, [baseList, query, debouncedQuery, suggest.data]);

  /* ----------------------------------------------------------
   * Exact match / create
   * ---------------------------------------------------------- */

  const hasExactMatch = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return true;
    return options.some(
      (o) =>
        o.name.toLowerCase() === needle ||
        (o.slug && o.slug.toLowerCase() === needle),
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
      const created = await createCategory.mutateAsync({
        name: { en: name, bn: name },
        description: "",
        order: 0,
        isActive: true,
        specTemplate: [],
      });
      onChange(created._id);
      setOpen(false);
      setQuery("");
      setDebouncedQuery("");
    } catch {
      // Toast shown by mutation hook.
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
          {selected ? (
            <>
              {selected.path && selected.path !== selected.name && (
                <span className="text-brand-text-secondary">
                  {selected.path.split(" > ").slice(0, -1).join(" › ")} ›{" "}
                </span>
              )}
              {selected.name}
            </>
          ) : (
            placeholder
          )}
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
            placeholder="Search categories…"
            value={query}
            onValueChange={setQuery}
          />

          <CommandList>
            {isBaseLoading && (
              <div className="flex items-center gap-2 px-3 py-4 text-xs text-brand-text-secondary">
                <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
                Loading categories…
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
              <CommandGroup heading="Categories">
                {options.map((cat) => (
                  <CommandItem
                    key={cat._id}
                    value={cat._id}
                    onSelect={() => handleSelect(cat._id)}
                    className="flex items-center justify-between"
                  >
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate">{cat.name}</span>
                      {cat.nameBn && cat.nameBn !== cat.name && (
                        <span className="truncate text-[11px] text-brand-text-secondary">
                          {cat.nameBn}
                        </span>
                      )}
                    </div>
                    <Check
                      className={cn(
                        "ml-2 h-4 w-4 shrink-0",
                        value === cat._id ? "opacity-100" : "opacity-0",
                      )}
                      aria-hidden="true"
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {canCreate && (
              <>
                {options.length > 0 && <CommandSeparator />}
                <CommandGroup>
                  <CommandItem
                    value={`__create__${query}`}
                    onSelect={handleCreate}
                    disabled={createCategory.isPending}
                    className="text-brand-primary"
                  >
                    {createCategory.isPending ? (
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

export default CategoryCombobox;
