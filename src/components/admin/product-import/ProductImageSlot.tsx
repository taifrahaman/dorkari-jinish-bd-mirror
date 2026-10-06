// src/components/admin/product-import/ProductImageSlot.tsx

"use client";

import { Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDraggable } from "@dnd-kit/core";
import type { StagedImage } from "./useImportStore";

/* ============================================================
 * Types
 * ============================================================ */

export type ProductImageSlotProps = {
  image: StagedImage;
  onRemove: (imageId: string) => void;
  /** Rendered slot index (0-based) — used for the primary badge. */
  index: number;
  disabled?: boolean;
};

/* ============================================================
 * Component
 * ============================================================ */

export function ProductImageSlot({
  image,
  onRemove,
  index,
  disabled = false,
}: ProductImageSlotProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: `slot-${image.id}`,
      data: {
        type: "slot",
        imageId: image.id,
        fromRow: image.assignedToRow,
        filename: image.filename,
      },
      disabled,
    });

  const style: React.CSSProperties | undefined = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group/slot relative aspect-square w-full overflow-hidden rounded-md border border-brand-border bg-muted",
        isDragging && "opacity-30",
        index === 0 && "ring-1 ring-brand-accent",
      )}
      {...attributes}
      {...listeners}
      title={image.filename}
    >
      <img
        src={image.url}
        alt={image.filename}
        className="h-full w-full cursor-grab object-cover active:cursor-grabbing"
        draggable={false}
        loading="lazy"
      />

      {index === 0 && (
        <div className="pointer-events-none absolute left-0.5 top-0.5 rounded-sm bg-brand-accent px-1 py-px text-[8px] font-semibold uppercase tracking-wide text-brand-primary">
          Primary
        </div>
      )}

      {image.autoMatched && (
        <div
          className="pointer-events-none absolute right-0.5 top-0.5 grid h-4 w-4 place-items-center rounded-full bg-brand-accent text-brand-primary"
          title="Auto-matched — drag to correct"
        >
          <Sparkles className="h-2.5 w-2.5" aria-hidden="true" />
        </div>
      )}

      {!disabled && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove(image.id);
          }}
          onPointerDown={(e) => e.stopPropagation()}
          className="absolute bottom-0.5 right-0.5 grid h-5 w-5 place-items-center rounded-full bg-black/70 text-white opacity-0 transition-opacity hover:bg-destructive group-hover/slot:opacity-100 focus-visible:opacity-100"
          aria-label={`Remove ${image.filename}`}
        >
          <X className="h-2.5 w-2.5" aria-hidden="true" />
        </button>
      )}

      <div className="pointer-events-none absolute inset-x-0 bottom-0 truncate bg-linear-to-t from-black/70 to-transparent px-1 pb-0.5 pt-3 text-[9px] leading-tight text-white">
        {image.filename}
      </div>
    </div>
  );
}

export default ProductImageSlot;
