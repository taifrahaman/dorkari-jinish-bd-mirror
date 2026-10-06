// src/components/admin/product-import/MediaTrayItem.tsx

"use client";

import { GripVertical, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDraggable } from "@dnd-kit/core";
import type { StagedImage } from "./useImportStore";

/* ============================================================
 * Types
 * ============================================================ */

export type MediaTrayItemProps = {
  image: StagedImage;
  disabled?: boolean;
};

/* ============================================================
 * Component
 * ============================================================ */

export function MediaTrayItem({ image, disabled = false }: MediaTrayItemProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: `tray-${image.id}`,
      data: {
        type: "tray",
        imageId: image.id,
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
        "group/tray relative aspect-square overflow-hidden rounded-md border border-brand-border bg-muted",
        isDragging && "opacity-30",
        image.autoMatched && "ring-1 ring-brand-accent/60",
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

      {/* Subtle grip hint in the corner */}
      <div className="pointer-events-none absolute left-0.5 top-0.5 rounded-sm bg-black/50 p-0.5 opacity-0 transition-opacity group-hover/tray:opacity-100">
        <GripVertical className="h-2.5 w-2.5 text-white" aria-hidden="true" />
      </div>

      {image.autoMatched && (
        <div className="pointer-events-none absolute right-0.5 top-0.5 grid h-4 w-4 place-items-center rounded-full bg-brand-accent text-brand-primary">
          <Sparkles className="h-2.5 w-2.5" aria-hidden="true" />
        </div>
      )}
    </div>
  );
}

export default MediaTrayItem;
