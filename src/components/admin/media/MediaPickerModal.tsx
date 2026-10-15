// src/components/admin/media/MediaPickerModal.tsx

"use client";

import { useEffect, useMemo, useState } from "react";
import { ImageIcon, Loader2, Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { MediaTile } from "./MediaTile";
import { useMediaList, flattenMediaPages } from "@/hooks/admin/use-media";
import type { MediaAsset } from "@/services/media.service";

/* ============================================================
 * Types
 * ============================================================ */

export type MediaPickerEntity = "all" | "products" | "categories" | "brands";

export type MediaPickerModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;

  /** Max items that can be added in one pick. */
  maxSelectable: number;

  /** publicIds that are already on the target and cannot be re-picked. */
  disabledIds?: Set<string>;

  /** Called with the picked assets when user clicks "Add". */
  onConfirm: (assets: MediaAsset[]) => void;

  /** Default folder filter. Defaults to "products". */
  defaultEntity?: MediaPickerEntity;
};

/* ============================================================
 * Component
 * ============================================================ */

export function MediaPickerModal({
  open,
  onOpenChange,
  maxSelectable,
  disabledIds,
  onConfirm,
  defaultEntity = "products",
}: MediaPickerModalProps) {
  const [q, setQ] = useState("");
  const [entity, setEntity] = useState<MediaPickerEntity>(defaultEntity);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  /* Reset state when the modal closes. */
  useEffect(() => {
    if (!open) {
      setSelectedIds(new Set());
      setQ("");
      setEntity(defaultEntity);
    }
  }, [open, defaultEntity]);

  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } =
    useMediaList({
      entity,
      q: q.trim() || undefined,
      limit: 60,
    });

  const assets = useMemo(() => flattenMediaPages(data?.pages), [data?.pages]);

  /* ----------------------------------------------------------
   * Selection
   * ---------------------------------------------------------- */

  const atCap = selectedIds.size >= maxSelectable;

  const toggleSelect = (publicId: string) => {
    if (disabledIds?.has(publicId)) return;

    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(publicId)) {
        next.delete(publicId);
      } else {
        if (next.size >= maxSelectable) return prev;
        next.add(publicId);
      }
      return next;
    });
  };

  const selectedAssets = useMemo(
    () => assets.filter((a) => selectedIds.has(a.publicId)),
    [assets, selectedIds],
  );

  /* ----------------------------------------------------------
   * Confirm
   * ---------------------------------------------------------- */

  const handleConfirm = () => {
    if (selectedAssets.length === 0) return;
    onConfirm(selectedAssets);
    onOpenChange(false);
  };

  /* ----------------------------------------------------------
   * Render
   * ---------------------------------------------------------- */

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "flex h-[85vh] max-w-5xl flex-col gap-0 overflow-hidden p-0",
        )}
      >
        <DialogHeader className="border-b border-brand-border px-5 py-4">
          <DialogTitle>Choose from library</DialogTitle>
          <DialogDescription className="text-xs">
            Pick images already uploaded. Click a tile to select or deselect.
          </DialogDescription>
        </DialogHeader>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2 border-b border-brand-border px-5 py-3">
          <div className="relative min-w-64 flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-text-secondary" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by filename…"
              className="pl-8"
            />
          </div>

          <div className="flex items-center gap-1">
            {(["products", "categories", "brands", "all"] as const).map(
              (option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setEntity(option)}
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-xs font-medium capitalize transition-colors",
                    entity === option
                      ? "border-brand-accent bg-brand-accent text-white"
                      : "border-brand-border text-brand-text-secondary hover:border-brand-accent/60 hover:text-brand-primary",
                  )}
                >
                  {option}
                </button>
              ),
            )}
          </div>
        </div>

        {/* Slot counter */}
        <div className="border-b border-brand-border bg-muted/20 px-5 py-2 text-xs text-brand-text-secondary">
          {maxSelectable} slot{maxSelectable === 1 ? "" : "s"} available ·{" "}
          <span
            className={cn(
              "font-medium",
              atCap ? "text-amber-700" : "text-brand-primary",
            )}
          >
            {selectedIds.size} selected
          </span>
          {atCap && " · limit reached"}
        </div>

        {/* Grid */}
        <ScrollArea className="flex-1">
          <div className="p-5">
            {isLoading && <LoadingGrid />}

            {!isLoading && assets.length === 0 && (
              <PickerEmpty hasQuery={q.trim().length > 0} />
            )}

            {!isLoading && assets.length > 0 && (
              <>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                  {assets.map((asset) => {
                    const isDisabled =
                      disabledIds?.has(asset.publicId) ?? false;
                    const isSelected = selectedIds.has(asset.publicId);
                    const blockedByCap = atCap && !isSelected;

                    return (
                      <MediaTile
                        key={asset.publicId}
                        asset={asset}
                        onClick={() => toggleSelect(asset.publicId)}
                        selectable
                        selected={isSelected}
                        onToggleSelect={() => toggleSelect(asset.publicId)}
                        disabled={isDisabled || blockedByCap}
                      />
                    );
                  })}
                </div>

                {hasNextPage && (
                  <div className="flex justify-center pt-5">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchNextPage()}
                      disabled={isFetchingNextPage}
                    >
                      {isFetchingNextPage ? (
                        <>
                          <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                          Loading…
                        </>
                      ) : (
                        "Load more"
                      )}
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 border-t border-brand-border bg-brand-surface px-5 py-3">
          <p className="text-xs text-brand-text-secondary">
            {selectedIds.size === 0
              ? "Select images to add"
              : `${selectedIds.size} of ${maxSelectable} selected`}
          </p>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleConfirm}
              disabled={selectedIds.size === 0}
            >
              Add {selectedIds.size > 0 ? selectedIds.size : ""} image
              {selectedIds.size === 1 ? "" : "s"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ============================================================
 * States
 * ============================================================ */

function LoadingGrid() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {Array.from({ length: 15 }).map((_, i) => (
        <Skeleton key={i} className="aspect-square rounded-md" />
      ))}
    </div>
  );
}

function PickerEmpty({ hasQuery }: { hasQuery: boolean }) {
  return (
    <div className="grid place-items-center px-6 py-16 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-full bg-muted text-brand-text-secondary">
        <ImageIcon className="h-6 w-6" />
      </div>
      <h3 className="mt-3 text-sm font-medium text-brand-primary">
        {hasQuery ? "No matching images" : "No images in this folder yet"}
      </h3>
      <p className="mt-1 max-w-sm text-xs text-brand-text-secondary">
        {hasQuery
          ? "Try a different search term."
          : "Upload images from a product form first, or switch to another folder."}
      </p>
    </div>
  );
}
