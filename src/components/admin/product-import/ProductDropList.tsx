// src/components/admin/product-import/ProductDropList.tsx

"use client";

import { useMemo } from "react";
import { Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { ProductDropRow } from "./ProductDropRow";
import {
  useImportStore,
  type ParsedCsvRow,
  type StagedImage,
} from "./useImportStore";

/* ============================================================
 * Types
 * ============================================================ */

type FilterMode = "all" | "with-images" | "without-images";

export type ProductDropListProps = {
  filter: FilterMode;
  disabled?: boolean;
};

/* ============================================================
 * Component
 * ============================================================ */

export function ProductDropList({
  filter,
  disabled = false,
}: ProductDropListProps) {
  const csvRows = useImportStore((s) => s.csvRows);
  const stagedImages = useImportStore((s) => s.stagedImages);
  const removeStagedImage = useImportStore((s) => s.removeStagedImage);

  const validRows = useMemo(
    () => csvRows.filter((r) => r.status === "valid"),
    [csvRows],
  );

  /* Group images by row index for O(1) lookup */
  const imagesByRow = useMemo(() => {
    const map = new Map<number, StagedImage[]>();
    for (const img of stagedImages) {
      if (img.assignedToRow === undefined) continue;
      const arr = map.get(img.assignedToRow) ?? [];
      arr.push(img);
      map.set(img.assignedToRow, arr);
    }
    // Sort each row's images by filename for stable ordering
    for (const arr of map.values()) {
      arr.sort((a, b) =>
        a.filename.localeCompare(b.filename, undefined, { numeric: true }),
      );
    }
    return map;
  }, [stagedImages]);

  /* Filter rows */
  const visibleRows = useMemo(() => {
    if (filter === "all") return validRows;
    return validRows.filter((row) => {
      const has = (imagesByRow.get(row.rowIndex)?.length ?? 0) > 0;
      return filter === "with-images" ? has : !has;
    });
  }, [validRows, imagesByRow, filter]);

  if (visibleRows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-md border border-brand-border bg-brand-surface px-6 py-16 text-center">
        <div className="grid h-12 w-12 place-items-center rounded-full bg-muted text-brand-text-secondary">
          <Package className="h-5 w-5" aria-hidden="true" />
        </div>
        <div>
          <p className="font-heading text-sm font-semibold text-brand-primary">
            {filter === "without-images"
              ? "Every product has an image"
              : filter === "with-images"
                ? "No products have images yet"
                : "No rows to display"}
          </p>
          <p className="mt-0.5 text-xs text-brand-text-secondary">
            {filter === "without-images"
              ? "Switch the filter to see all rows."
              : "Try a different filter."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-2")}>
      {visibleRows.map((row) => (
        <ProductDropRow
          key={row.rowIndex}
          row={row}
          images={imagesByRow.get(row.rowIndex) ?? []}
          onRemoveImage={removeStagedImage}
          disabled={disabled}
        />
      ))}
    </div>
  );
}

export type { FilterMode };

export default ProductDropList;
