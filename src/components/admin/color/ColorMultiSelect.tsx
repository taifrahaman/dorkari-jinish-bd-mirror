// src/components/admin/color/ColorMultiSelect.tsx

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Loader2, Palette, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { useColors, useColorSuggest, useCreateColor } from "@/hooks/admin";
import { ColorChip } from "./ColorChip";
import { ColorEyedropperButton } from "./ColorEyedropperButton";

/* ============================================================
 * Types
 * ============================================================ */

export type ProductColorValue = {
  hex: string;
  name?: { en?: string; bn?: string };
};

export type ColorMultiSelectProps = {
  value: ProductColorValue[];
  onChange: (next: ProductColorValue[]) => void;
  imageUrls?: string[];
  disabled?: boolean;
  placeholder?: string;
  maxColors?: number;
  className?: string;
};

/* ============================================================
 * Helpers
 * ============================================================ */

const HEX_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

function normalizeHex(hex: string): string {
  return hex.trim().toLowerCase();
}

function sameColor(a: ProductColorValue, b: ProductColorValue): boolean {
  return normalizeHex(a.hex) === normalizeHex(b.hex);
}

/* ============================================================
 * Component
 * ============================================================ */

export function ColorMultiSelect({
  value,
  onChange,
  imageUrls = [],
  disabled = false,
  placeholder = "Add colors…",
  maxColors = 12,
  className,
}: ColorMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [customMode, setCustomMode] = useState(false);

  const [customHex, setCustomHex] = useState("#000000");
  const [customNameEn, setCustomNameEn] = useState("");
  const [customNameBn, setCustomNameBn] = useState("");

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedQuery(query), 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  /* ----------------------------------------------------------
   * Data sources
   *
   * - `colorsList` = the full library, loaded eagerly. Used as
   *   the base list when the query is empty.
   * - `suggest` = the fuzzy search endpoint, fires only when the
   *   user has typed something.
   *
   * Both share the same React Query cache with other pages that
   * call these hooks, so no duplicate fetches.
   * ---------------------------------------------------------- */

  const colorsList = useColors({ limit: 200 });
  const suggest = useColorSuggest(debouncedQuery);
  const createColor = useCreateColor();

  const baseColors = colorsList.data?.items ?? [];
  const isBaseLoading = colorsList.isLoading && baseColors.length === 0;

  const atMax = value.length >= maxColors;

  /* ----------------------------------------------------------
   * Handlers
   * ---------------------------------------------------------- */

  const handleRemove = (index: number) => {
    const next = value.slice();
    next.splice(index, 1);
    onChange(next);
  };

  const handleAddFromLibrary = async (colorId: string) => {
    const color =
      baseColors.find((c) => c._id === colorId) ??
      suggest.data?.find((c) => c._id === colorId);
    if (!color) return;

    const candidate: ProductColorValue = {
      hex: normalizeHex(color.hex),
      name: { en: color.name.en, bn: color.name.bn },
    };

    if (value.some((c) => sameColor(c, candidate))) {
      setOpen(false);
      setQuery("");
      return;
    }

    onChange([...value, candidate]);
    setOpen(false);
    setQuery("");
  };

  const openCustomForm = () => {
    const trimmed = query.trim();
    if (HEX_RE.test(trimmed)) {
      setCustomHex(normalizeHex(trimmed));
      setCustomNameEn("");
      setCustomNameBn("");
    } else if (trimmed.length > 0) {
      setCustomHex("#000000");
      setCustomNameEn(trimmed);
      setCustomNameBn("");
    } else {
      setCustomHex("#000000");
      setCustomNameEn("");
      setCustomNameBn("");
    }
    setCustomMode(true);
  };

  const cancelCustomForm = () => {
    setCustomMode(false);
  };

  const confirmCustomForm = async () => {
    if (!HEX_RE.test(customHex)) return;

    const name =
      customNameEn.trim() || customNameBn.trim()
        ? {
            en: customNameEn.trim() || customNameBn.trim(),
            bn: customNameBn.trim() || customNameEn.trim(),
          }
        : undefined;

    const candidate: ProductColorValue = {
      hex: normalizeHex(customHex),
      name,
    };

    if (value.some((c) => sameColor(c, candidate))) {
      setCustomMode(false);
      setOpen(false);
      setQuery("");
      return;
    }

    if (name && customNameEn.trim() && customNameBn.trim()) {
      try {
        await createColor.mutateAsync({
          name: { en: customNameEn.trim(), bn: customNameBn.trim() },
          hex: normalizeHex(customHex),
          order: 0,
          isActive: true,
        });
      } catch {
        // non-fatal
      }
    }

    onChange([...value, candidate]);
    setCustomMode(false);
    setOpen(false);
    setQuery("");
  };

  const handleEyedropper = (hex: string) => {
    const candidate: ProductColorValue = { hex: normalizeHex(hex) };
    if (value.some((c) => sameColor(c, candidate))) return;

    setCustomHex(normalizeHex(hex));
    setCustomNameEn("");
    setCustomNameBn("");
    setCustomMode(true);
  };

  /* ----------------------------------------------------------
   * Display options
   *
   * Empty query  → full base list
   * Typed query  → API + base merged, deduped by _id
   * Already-selected colors are filtered out.
   * ---------------------------------------------------------- */

  const options = useMemo(() => {
    const hasApiQuery = debouncedQuery.trim().length > 0;
    const q = query.trim().toLowerCase();

    type Row = {
      _id: string;
      hex: string;
      name: { en: string; bn: string };
    };

    let rows: Row[];

    if (hasApiQuery) {
      const fromApi: Row[] = (suggest.data ?? []).map((c) => ({
        _id: c._id,
        hex: c.hex,
        name: { en: c.name.en, bn: c.name.bn },
      }));
      const apiIds = new Set(fromApi.map((r) => r._id));

      const fromBase: Row[] = baseColors
        .filter((c) => !apiIds.has(c._id))
        .filter(
          (c) =>
            c.name.en.toLowerCase().includes(q) ||
            c.name.bn.toLowerCase().includes(q),
        )
        .map((c) => ({
          _id: c._id,
          hex: c.hex,
          name: { en: c.name.en, bn: c.name.bn },
        }));

      rows = [...fromApi, ...fromBase];
    } else {
      const filtered = q
        ? baseColors.filter(
            (c) =>
              c.name.en.toLowerCase().includes(q) ||
              c.name.bn.toLowerCase().includes(q),
          )
        : baseColors;

      rows = filtered.map((c) => ({
        _id: c._id,
        hex: c.hex,
        name: { en: c.name.en, bn: c.name.bn },
      }));
    }

    /* Drop anything already on the product */
    return rows.filter(
      (r) => !value.some((v) => normalizeHex(v.hex) === normalizeHex(r.hex)),
    );
  }, [baseColors, suggest.data, query, debouncedQuery, value]);

  const isSearchingApi = debouncedQuery.trim().length > 0 && suggest.isFetching;

  const canOfferCustom =
    !atMax && (query.trim().length === 0 || options.length === 0 || customMode);

  const showEmptyState =
    !isBaseLoading &&
    !isSearchingApi &&
    options.length === 0 &&
    !canOfferCustom;

  /* ----------------------------------------------------------
   * Render
   * ---------------------------------------------------------- */

  return (
    <div className={cn("space-y-2", className)}>
      {/* Selected chips */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((c, i) => (
            <ColorChip
              key={`${c.hex}-${i}`}
              hex={c.hex}
              label={c.name?.en}
              sublabel={
                c.name?.bn && c.name.bn !== c.name.en ? c.name.bn : undefined
              }
              onRemove={disabled ? undefined : () => handleRemove(i)}
            />
          ))}
        </div>
      )}

      <Popover
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) {
            setQuery("");
            setDebouncedQuery("");
            setCustomMode(false);
          }
        }}
      >
        <PopoverTrigger
          render={
            <Button
              type="button"
              variant="outline"
              disabled={disabled || atMax}
              className="h-9 w-full justify-start font-normal"
            />
          }
        >
          <Palette
            className="mr-2 h-4 w-4 text-brand-text-secondary"
            aria-hidden="true"
          />
          <span className="truncate text-brand-text-secondary">
            {atMax
              ? `Maximum ${maxColors} colors reached`
              : value.length === 0
                ? placeholder
                : "Add more colors…"}
          </span>
        </PopoverTrigger>

        <PopoverContent
          align="start"
          className="w-[--radix-popover-trigger-width] min-w-[320px] p-0"
        >
          {customMode ? (
            <CustomColorForm
              hex={customHex}
              nameEn={customNameEn}
              nameBn={customNameBn}
              imageUrls={imageUrls}
              submitting={createColor.isPending}
              onChangeHex={setCustomHex}
              onChangeNameEn={setCustomNameEn}
              onChangeNameBn={setCustomNameBn}
              onCancel={cancelCustomForm}
              onConfirm={confirmCustomForm}
            />
          ) : (
            <Command shouldFilter={false}>
              <div className="flex items-center gap-1 border-b border-brand-border pr-1">
                <CommandInput
                  placeholder="Search colors…"
                  value={query}
                  onValueChange={setQuery}
                  className="flex-1 border-0"
                />
                <ColorEyedropperButton
                  compact
                  onPick={handleEyedropper}
                  imageUrls={imageUrls}
                  disabled={disabled}
                />
              </div>

              <CommandList>
                {isBaseLoading && (
                  <div className="flex items-center gap-2 px-3 py-4 text-xs text-brand-text-secondary">
                    <Loader2
                      className="h-3 w-3 animate-spin"
                      aria-hidden="true"
                    />
                    Loading colors…
                  </div>
                )}

                {isSearchingApi && !isBaseLoading && (
                  <div className="flex items-center gap-2 px-3 py-4 text-xs text-brand-text-secondary">
                    <Loader2
                      className="h-3 w-3 animate-spin"
                      aria-hidden="true"
                    />
                    Searching…
                  </div>
                )}

                {showEmptyState && (
                  <CommandEmpty>No colors found.</CommandEmpty>
                )}

                {options.length > 0 && (
                  <CommandGroup heading="Colors">
                    {options.map((color) => (
                      <CommandItem
                        key={color._id}
                        value={color._id}
                        onSelect={() => handleAddFromLibrary(color._id)}
                        className="flex items-center justify-between"
                      >
                        <div className="flex min-w-0 items-center gap-2">
                          <span
                            className="h-5 w-5 shrink-0 rounded-full border border-black/10"
                            style={{ backgroundColor: color.hex }}
                            aria-hidden="true"
                          />
                          <div className="flex min-w-0 flex-col">
                            <span className="truncate">{color.name.en}</span>
                            {color.name.bn &&
                              color.name.bn !== color.name.en && (
                                <span className="truncate text-[11px] text-brand-text-secondary">
                                  {color.name.bn}
                                </span>
                              )}
                          </div>
                        </div>
                        <Check
                          className="ml-2 h-4 w-4 shrink-0 opacity-0"
                          aria-hidden="true"
                        />
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}

                {canOfferCustom && (
                  <>
                    {options.length > 0 && <CommandSeparator />}
                    <CommandGroup>
                      <CommandItem
                        value={`__custom__${query}`}
                        onSelect={openCustomForm}
                        className="text-brand-primary"
                      >
                        <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
                        {query.trim()
                          ? `Add custom "${query.trim()}"`
                          : "Add custom color"}
                      </CommandItem>
                    </CommandGroup>
                  </>
                )}
              </CommandList>
            </Command>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}

export default ColorMultiSelect;

/* ============================================================
 * Custom color form
 * ============================================================ */

function CustomColorForm({
  hex,
  nameEn,
  nameBn,
  imageUrls,
  submitting,
  onChangeHex,
  onChangeNameEn,
  onChangeNameBn,
  onCancel,
  onConfirm,
}: {
  hex: string;
  nameEn: string;
  nameBn: string;
  imageUrls: string[];
  submitting: boolean;
  onChangeHex: (v: string) => void;
  onChangeNameEn: (v: string) => void;
  onChangeNameBn: (v: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const hexValid = HEX_RE.test(hex);

  return (
    <div className="space-y-3 p-3">
      <div className="flex items-center gap-2">
        <div
          className="h-9 w-9 shrink-0 rounded-md border border-brand-border"
          style={{ backgroundColor: hexValid ? hex : "transparent" }}
          aria-hidden="true"
        />
        <Input
          value={hex}
          onChange={(e) => onChangeHex(e.target.value)}
          placeholder="#c0c0c0"
          className={cn(
            "h-9 flex-1 font-mono text-xs",
            !hexValid && "border-destructive",
          )}
          autoFocus
        />
        <ColorEyedropperButton
          compact
          onPick={(picked) => onChangeHex(picked)}
          imageUrls={imageUrls}
        />
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <Input
          value={nameEn}
          onChange={(e) => onChangeNameEn(e.target.value)}
          placeholder="Name (EN) — optional"
          className="h-9"
        />
        <Input
          value={nameBn}
          onChange={(e) => onChangeNameBn(e.target.value)}
          placeholder="নাম (বাংলা) — ঐচ্ছিক"
          className="h-9"
        />
      </div>

      {!hexValid && (
        <p className="text-xs text-destructive">
          Enter a valid hex like #c0c0c0.
        </p>
      )}

      <div className="flex justify-end gap-2 pt-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onCancel}
          disabled={submitting}
        >
          Cancel
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={onConfirm}
          disabled={!hexValid || submitting}
        >
          {submitting && (
            <Loader2
              className="mr-2 h-3.5 w-3.5 animate-spin"
              aria-hidden="true"
            />
          )}
          Add color
        </Button>
      </div>
    </div>
  );
}
