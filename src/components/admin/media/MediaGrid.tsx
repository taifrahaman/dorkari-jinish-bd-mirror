// src/components/admin/media/MediaGrid.tsx

"use client";

import { MediaTile } from "./MediaTile";
import type { MediaAsset } from "@/services/media.service";

export type MediaGridProps = {
  assets: MediaAsset[];
  onOpen: (asset: MediaAsset) => void;
  selectable?: boolean;
  selectedIds?: Set<string>;
  onToggleSelect?: (publicId: string) => void;
  disabledIds?: Set<string>;
};

export function MediaGrid({
  assets,
  onOpen,
  selectable = false,
  selectedIds,
  onToggleSelect,
  disabledIds,
}: MediaGridProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {assets.map((asset) => (
        <MediaTile
          key={asset.publicId}
          asset={asset}
          onClick={() => onOpen(asset)}
          selectable={selectable}
          selected={selectedIds?.has(asset.publicId) ?? false}
          onToggleSelect={() => onToggleSelect?.(asset.publicId)}
          disabled={disabledIds?.has(asset.publicId) ?? false}
        />
      ))}
    </div>
  );
}
