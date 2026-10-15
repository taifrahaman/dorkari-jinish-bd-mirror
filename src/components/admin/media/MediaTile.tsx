// src/components/admin/media/MediaTile.tsx

"use client";

import { ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MediaAsset } from "@/services/media.service";

/* ============================================================
 * Entity chip
 * ============================================================ */

const ENTITY_META: Record<
  MediaAsset["entity"],
  { label: string; className: string }
> = {
  products: {
    label: "P",
    className: "bg-blue-100 text-blue-700 border-blue-200",
  },
  categories: {
    label: "C",
    className: "bg-violet-100 text-violet-700 border-violet-200",
  },
  brands: {
    label: "B",
    className: "bg-emerald-100 text-emerald-700 border-emerald-200",
  },
  tmp: {
    label: "T",
    className: "bg-amber-100 text-amber-700 border-amber-200",
  },
  unknown: {
    label: "?",
    className: "bg-neutral-100 text-neutral-600 border-neutral-200",
  },
};

/* ============================================================
 * Tile
 * ============================================================ */

export type MediaTileProps = {
  asset: MediaAsset;
  onClick: () => void;
  selected?: boolean;
  selectable?: boolean;
  onToggleSelect?: () => void;
  disabled?: boolean;
};

export function MediaTile({
  asset,
  onClick,
  selected = false,
  selectable = false,
  onToggleSelect,
  disabled = false,
}: MediaTileProps) {
  const entity = ENTITY_META[asset.entity];

  return (
    <div
      className={cn(
        "group relative aspect-square overflow-hidden rounded-md border bg-muted/30 transition-all",
        selected
          ? "border-brand-accent ring-2 ring-brand-accent/40"
          : "border-brand-border hover:border-brand-accent/60",
        disabled && "cursor-not-allowed opacity-50",
      )}
    >
      {/* Clickable image area */}
      <button
        type="button"
        onClick={disabled ? undefined : onClick}
        disabled={disabled}
        className="absolute inset-0 cursor-pointer"
        aria-label={asset.publicId}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={asset.thumbnailUrl}
          alt={asset.publicId}
          loading="lazy"
          className="h-full w-full object-cover"
        />
      </button>

      {/* Top-left: entity chip */}
      <span
        className={cn(
          "pointer-events-none absolute left-1.5 top-1.5 grid h-5 min-w-5 place-items-center rounded border px-1 text-[10px] font-bold uppercase tracking-wide",
          entity.className,
        )}
        title={asset.entity}
      >
        {entity.label}
      </span>

      {/* Top-right: used/unused badge */}
      {asset.used ? (
        <span className="pointer-events-none absolute right-1.5 top-1.5 rounded border border-neutral-200 bg-white/95 px-1.5 py-0.5 text-[10px] font-medium text-neutral-700 shadow-sm">
          Used{asset.usedBy.length > 1 ? ` ×${asset.usedBy.length}` : ""}
        </span>
      ) : (
        <span className="pointer-events-none absolute right-1.5 top-1.5 rounded border border-amber-200 bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-800 shadow-sm">
          Unused
        </span>
      )}

      {/* Multi-select checkbox (hover or when selected) */}
      {selectable && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleSelect?.();
          }}
          aria-label={selected ? "Deselect" : "Select"}
          className={cn(
            "absolute bottom-1.5 left-1.5 grid h-5 w-5 place-items-center rounded border bg-white/95 transition-opacity",
            selected
              ? "border-brand-accent opacity-100"
              : "border-neutral-300 opacity-0 group-hover:opacity-100",
          )}
        >
          {selected && (
            <svg viewBox="0 0 12 12" className="h-3 w-3 text-brand-accent">
              <path
                d="M2 6l3 3 5-6"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </button>
      )}

      {/* No-image fallback (only if thumbnail failed) */}
      <noscript>
        <div className="absolute inset-0 grid place-items-center text-brand-text-secondary">
          <ImageIcon className="h-6 w-6" />
        </div>
      </noscript>
    </div>
  );
}
