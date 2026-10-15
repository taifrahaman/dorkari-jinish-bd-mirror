// src/components/admin/media/MediaFilters.tsx

"use client";

import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export type MediaFilterState = {
  entity: "all" | "products" | "categories" | "brands" | "tmp";
  used: "all" | "true" | "false";
  sort: "newest" | "oldest" | "name" | "size";
  q: string;
};

export const MEDIA_FILTER_DEFAULTS: MediaFilterState = {
  entity: "all",
  used: "all",
  sort: "newest",
  q: "",
};

export type MediaFiltersProps = {
  value: MediaFilterState;
  onChange: (next: MediaFilterState) => void;
  unusedCount?: number;
  usedCount?: number;
};

export function MediaFilters({
  value,
  onChange,
  unusedCount,
  usedCount,
}: MediaFiltersProps) {
  const patch = (p: Partial<MediaFilterState>) => onChange({ ...value, ...p });

  const isFiltered =
    value.entity !== "all" ||
    value.used !== "all" ||
    value.sort !== "newest" ||
    value.q.length > 0;

  return (
    <div className="space-y-3">
      {/* Row 1: search + sort */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-60 flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-text-secondary" />
          <Input
            value={value.q}
            onChange={(e) => patch({ q: e.target.value })}
            placeholder="Search by filename or path…"
            className="pl-8"
          />
        </div>

        <Select
          value={value.sort}
          onValueChange={(v) => patch({ sort: v as MediaFilterState["sort"] })}
        >
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest first</SelectItem>
            <SelectItem value="oldest">Oldest first</SelectItem>
            <SelectItem value="name">Name (A→Z)</SelectItem>
            <SelectItem value="size">Largest first</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Row 2: entity pills + used pills */}
      <div className="flex flex-wrap items-center gap-2">
        <PillGroup
          label="Type"
          options={[
            { value: "all", label: "All" },
            { value: "products", label: "Products" },
            { value: "categories", label: "Categories" },
            { value: "brands", label: "Brands" },
            { value: "tmp", label: "Tmp" },
          ]}
          value={value.entity}
          onChange={(v) => patch({ entity: v as MediaFilterState["entity"] })}
        />

        <span className="mx-1 h-5 w-px bg-brand-border" aria-hidden />

        <PillGroup
          label="Status"
          options={[
            { value: "all", label: "All" },
            {
              value: "true",
              label: usedCount != null ? `Used (${usedCount})` : "Used",
            },
            {
              value: "false",
              label: unusedCount != null ? `Unused (${unusedCount})` : "Unused",
              tone: "warn",
            },
          ]}
          value={value.used}
          onChange={(v) => patch({ used: v as MediaFilterState["used"] })}
        />

        {isFiltered && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onChange(MEDIA_FILTER_DEFAULTS)}
            className="ml-auto h-7 text-xs text-brand-text-secondary"
          >
            <X className="mr-1 h-3 w-3" />
            Clear filters
          </Button>
        )}
      </div>
    </div>
  );
}

/* ============================================================
 * Pill group
 * ============================================================ */

type PillOption = {
  value: string;
  label: string;
  tone?: "default" | "warn";
};

function PillGroup({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: PillOption[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-1">
      <span className="mr-1 text-xs font-medium text-brand-text-secondary">
        {label}:
      </span>
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
              active
                ? opt.tone === "warn"
                  ? "border-amber-300 bg-amber-100 text-amber-800"
                  : "border-brand-accent bg-brand-accent text-white"
                : "border-brand-border bg-transparent text-brand-text-secondary hover:border-brand-accent/60 hover:text-brand-primary",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
