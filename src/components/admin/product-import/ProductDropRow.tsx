// src/components/admin/product-import/ProductDropRow.tsx

"use client";

import { useDroppable } from "@dnd-kit/core";
import { ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/admin/format";
import { ProductImageSlot } from "./ProductImageSlot";
import type { ParsedCsvRow, StagedImage } from "./useImportStore";

/* ============================================================
 * Types
 * ============================================================ */

export type ProductDropRowProps = {
  row: ParsedCsvRow;
  images: StagedImage[];
  onRemoveImage: (imageId: string) => void;
  disabled?: boolean;
};

/* ============================================================
 * Component
 * ============================================================ */

export function ProductDropRow({
  row,
  images,
  onRemoveImage,
  disabled = false,
}: ProductDropRowProps) {
  const droppableId = `row-${row.rowIndex}`;

  const { setNodeRef, isOver, active } = useDroppable({
    id: droppableId,
    data: {
      type: "row",
      rowIndex: row.rowIndex,
    },
    disabled,
  });

  const data = row.data;
  const hasImages = images.length > 0;

  // Highlight only when the user is actively dragging something that can land here
  const activeData = active?.data?.current as
    { type?: string; fromRow?: number } | undefined;
  const isDragRelevant =
    activeData?.type === "tray" || activeData?.type === "slot";
  const isWrongRow =
    activeData?.type === "slot" && activeData.fromRow === row.rowIndex;

  const showHighlight = isOver && isDragRelevant && !isWrongRow;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex items-start gap-3 rounded-md border border-brand-border bg-brand-surface p-3 transition-colors",
        showHighlight && "border-brand-accent bg-brand-accent-light",
        !hasImages && "bg-muted/20",
      )}
    >
      {/* Left — product info */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-brand-primary">
          {data?.name_en ?? row.raw.name_en ?? "—"}
        </p>

        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-brand-text-secondary">
          {data?.sku && (
            <span className="font-mono tabular-nums">{data.sku}</span>
          )}
          {data?.category_slug && (
            <>
              <span aria-hidden="true">·</span>
              <span>{data.category_slug}</span>
            </>
          )}
          {data && (
            <>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums">{formatPrice(data.price)}</span>
            </>
          )}
        </div>

        {!hasImages && (
          <div className="mt-2 flex items-center gap-1.5 text-xs text-brand-text-secondary">
            <ImageOff className="h-3 w-3" aria-hidden="true" />
            <span>No images — drop some here</span>
          </div>
        )}
      </div>

      {/* Right — image slots */}
      <div className="flex w-60 shrink-0 flex-wrap items-start gap-1.5">
        {images.map((image, i) => (
          <div key={image.id} className="w-18">
            <ProductImageSlot
              image={image}
              index={i}
              onRemove={onRemoveImage}
              disabled={disabled}
            />
          </div>
        ))}

        {/* Empty slot placeholder — visible only when row has no images */}
        {!hasImages && (
          <div
            className={cn(
              "grid h-18 w-18 place-items-center rounded-md border-2 border-dashed border-brand-border text-brand-text-secondary/60",
              showHighlight && "border-brand-accent text-brand-accent",
            )}
          >
            <ImageOff className="h-4 w-4" aria-hidden="true" />
          </div>
        )}
      </div>
    </div>
  );
}

export default ProductDropRow;
