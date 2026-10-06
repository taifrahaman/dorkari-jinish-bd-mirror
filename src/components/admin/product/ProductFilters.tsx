// src/components/admin/product/ProductFilters.tsx

"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { CategoryCombobox } from "@/components/admin/category-combobox/CategoryCombobox";

/* ============================================================
 * Types
 * ============================================================ */

export type ProductFiltersValue = {
  category?: string;
  stockStatus?: "in" | "low" | "out";
  isActive?: boolean;
  isFeatured?: boolean;
  includeDeleted?: boolean;
};

export type ProductFiltersProps = {
  value: ProductFiltersValue;
  onChange: (next: ProductFiltersValue) => void;
  /** Category options loaded by the parent (avoids duplicate fetch). */
  categories?: Array<{ _id: string; name: string; path?: string }>;
  className?: string;
};

/* ============================================================
 * Helpers
 * ============================================================ */

const STOCK_LABELS: Record<
  NonNullable<ProductFiltersValue["stockStatus"]>,
  string
> = {
  in: "In stock",
  low: "Low stock",
  out: "Out of stock",
};

function hasAnyFilter(value: ProductFiltersValue): boolean {
  return Boolean(
    value.category ||
    value.stockStatus ||
    value.isActive !== undefined ||
    value.isFeatured !== undefined ||
    value.includeDeleted,
  );
}

/* ============================================================
 * Component
 * ============================================================ */

export function ProductFilters({
  value,
  onChange,
  categories,
  className,
}: ProductFiltersProps) {
  const clearAll = () => onChange({});

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {/* Category */}
      <div className="w-50">
        <CategoryCombobox
          value={value.category}
          onChange={(id) => onChange({ ...value, category: id ?? undefined })}
          initialCategories={categories}
          allowCreate={false}
          placeholder="All categories"
        />
      </div>

      {/* Stock status */}
      <Select
        value={value.stockStatus ?? "any"}
        onValueChange={(v) =>
          onChange({
            ...value,
            stockStatus: v === "any" ? undefined : (v as "in" | "low" | "out"),
          })
        }
      >
        <SelectTrigger className="h-9 w-37.5" aria-label="Stock status">
          <SelectValue placeholder="Any stock" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="any">Any stock</SelectItem>
          <SelectItem value="in">{STOCK_LABELS.in}</SelectItem>
          <SelectItem value="low">{STOCK_LABELS.low}</SelectItem>
          <SelectItem value="out">{STOCK_LABELS.out}</SelectItem>
        </SelectContent>
      </Select>

      {/* Status */}
      <Select
        value={
          value.isActive === undefined
            ? "any"
            : value.isActive
              ? "active"
              : "draft"
        }
        onValueChange={(v) =>
          onChange({
            ...value,
            isActive: v === "any" ? undefined : v === "active",
          })
        }
      >
        <SelectTrigger className="h-9 w-32.5" aria-label="Status">
          <SelectValue placeholder="Any status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="any">Any status</SelectItem>
          <SelectItem value="active">Active</SelectItem>
          <SelectItem value="draft">Draft</SelectItem>
        </SelectContent>
      </Select>

      {/* Featured */}
      <Select
        value={
          value.isFeatured === undefined
            ? "any"
            : value.isFeatured
              ? "featured"
              : "not"
        }
        onValueChange={(v) =>
          onChange({
            ...value,
            isFeatured: v === "any" ? undefined : v === "featured",
          })
        }
      >
        <SelectTrigger className="h-9 w-37.5" aria-label="Featured">
          <SelectValue placeholder="Any featured" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="any">Any featured</SelectItem>
          <SelectItem value="featured">Featured only</SelectItem>
          <SelectItem value="not">Not featured</SelectItem>
        </SelectContent>
      </Select>

      {/* Include archived */}
      <Select
        value={value.includeDeleted ? "with" : "without"}
        onValueChange={(v) =>
          onChange({ ...value, includeDeleted: v === "with" })
        }
      >
        <SelectTrigger className="h-9 w-42.5" aria-label="Archived products">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="without">Hide archived</SelectItem>
          <SelectItem value="with">Include archived</SelectItem>
        </SelectContent>
      </Select>

      {/* Clear */}
      {hasAnyFilter(value) && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={clearAll}
          className="h-9 px-2 text-xs text-brand-text-secondary hover:text-brand-primary"
        >
          <X className="mr-1 h-3 w-3" aria-hidden="true" />
          Clear
        </Button>
      )}
    </div>
  );
}

export default ProductFilters;
