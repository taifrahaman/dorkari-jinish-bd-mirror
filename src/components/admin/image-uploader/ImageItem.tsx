// src/components/admin/image-uploader/ImageItem.tsx

"use client";

import { Loader2, RotateCw, Star, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { UploadItem } from "./useCloudinaryUpload";

/* ============================================================
 * Types
 * ============================================================ */

export type ImageItemProps = {
  item: UploadItem;
  onRemove: (id: string) => void;
  onRetry?: (id: string) => void;

  isPrimary?: boolean;
  onSetPrimary?: (id: string) => void;

  draggable?: boolean;
  showCaption?: boolean;

  className?: string;
};

/* ============================================================
 * Component
 * ============================================================ */

export function ImageItem({
  item,
  onRemove,
  onRetry,
  isPrimary = false,
  onSetPrimary,
  draggable = false,
  showCaption = false,
  className,
}: ImageItemProps) {
  const { status, progress, previewUrl, error, filename } = item;

  return (
    <div
      className={cn(
        "group relative aspect-square overflow-hidden rounded-md border border-brand-border bg-muted",
        status === "error" && "border-destructive/50",
        isPrimary && "ring-2 ring-brand-accent ring-offset-1",
        draggable && "cursor-grab active:cursor-grabbing",
        className,
      )}
    >
      <img
        src={previewUrl}
        alt={filename}
        className={cn(
          "h-full w-full object-cover transition-opacity",
          status === "uploading" && "opacity-60",
          status === "error" && "opacity-40",
        )}
        draggable={false}
        loading="lazy"
      />

      {status === "uploading" && (
        <div className="absolute inset-0 grid place-items-center bg-black/30">
          <ProgressRing value={progress} />
        </div>
      )}

      {status === "pending" && (
        <div className="absolute inset-0 grid place-items-center bg-black/30">
          <Loader2
            className="h-6 w-6 animate-spin text-white"
            aria-hidden="true"
          />
        </div>
      )}

      {status === "error" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/60 p-2 text-center">
          <p className="line-clamp-2 text-[10px] leading-tight text-white">
            {error ?? "Upload failed"}
          </p>

          {onRetry && (
            <button
              type="button"
              onClick={() => onRetry(item.id)}
              className="grid h-7 w-7 place-items-center rounded-full bg-white/90 text-brand-primary transition-colors hover:bg-white"
              aria-label="Retry upload"
            >
              <RotateCw className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          )}
        </div>
      )}

      {isPrimary && status === "done" && (
        <div className="pointer-events-none absolute left-1 top-1 rounded-full bg-brand-accent px-1.5 py-0.5 text-[10px] font-semibold text-brand-primary shadow-sm">
          Primary
        </div>
      )}

      {(status === "done" || status === "error") && (
        <div
          className={cn(
            "absolute right-1 top-1 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100",
            status === "error" && "opacity-100",
          )}
        >
          {onSetPrimary && status === "done" && (
            <button
              type="button"
              onClick={() => onSetPrimary(item.id)}
              className={cn(
                "grid h-6 w-6 place-items-center rounded-full text-white shadow-sm transition-colors",
                isPrimary
                  ? "bg-brand-accent text-brand-primary"
                  : "bg-black/60 hover:bg-black/80",
              )}
              aria-label={isPrimary ? "Primary image" : "Set as primary"}
              aria-pressed={isPrimary}
            >
              <Star
                className="h-3 w-3"
                fill={isPrimary ? "currentColor" : "none"}
                aria-hidden="true"
              />
            </button>
          )}

          <button
            type="button"
            onClick={() => onRemove(item.id)}
            className="grid h-6 w-6 place-items-center rounded-full bg-black/60 text-white shadow-sm transition-colors hover:bg-destructive"
            aria-label="Remove image"
          >
            <X className="h-3 w-3" aria-hidden="true" />
          </button>
        </div>
      )}

      {showCaption && (
        <div className="absolute inset-x-0 bottom-0 truncate bg-black/50 px-2 py-1 text-[10px] text-white">
          {filename}
        </div>
      )}
    </div>
  );
}

export default ImageItem;

/* ============================================================
 * Progress ring
 * ============================================================ */

function ProgressRing({ value }: { value: number }) {
  const size = 40;
  const stroke = 3;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, value));
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div
      className="relative grid place-items-center"
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
        aria-hidden="true"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.25)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="white"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-150"
        />
      </svg>
      <span className="absolute text-[10px] font-medium tabular-nums text-white">
        {clamped}%
      </span>
    </div>
  );
}
