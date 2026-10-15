// src/components/admin/media/MediaLibrary.tsx

"use client";

import { useCallback, useMemo, useState } from "react";
import { ImageIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MediaFilters, MEDIA_FILTER_DEFAULTS } from "./MediaFilters";
import { MediaGrid } from "./MediaGrid";
import { MediaDetailDrawer } from "./MediaDetailDrawer";
import { MediaDeleteDialog } from "./MediaDeleteDialog";
import { MediaBulkBar } from "./MediaBulkBar";
import { useMediaList, flattenMediaPages } from "@/hooks/admin/use-media";
import type { MediaAsset } from "@/services/media.service";
import type { MediaFilterState } from "./MediaFilters";

export function MediaLibrary() {
  const [filters, setFilters] = useState<MediaFilterState>(
    MEDIA_FILTER_DEFAULTS,
  );
  const [openAsset, setOpenAsset] = useState<MediaAsset | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleteTargets, setDeleteTargets] = useState<MediaAsset[]>([]);

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    isError,
    error,
  } = useMediaList({
    entity: filters.entity,
    used: filters.used,
    sort: filters.sort,
    q: filters.q || undefined,
    limit: 60,
  });

  const assets = useMemo(() => flattenMediaPages(data?.pages), [data?.pages]);

  const usedCount = useMemo(
    () => assets.filter((a) => a.used).length,
    [assets],
  );
  const unusedCount = assets.length - usedCount;

  /* ----------------------------------------------------------
   * Selection
   * ---------------------------------------------------------- */

  const toggleSelect = useCallback((publicId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(publicId)) next.delete(publicId);
      else next.add(publicId);
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const selectedAssets = useMemo(
    () => assets.filter((a) => selectedIds.has(a.publicId)),
    [assets, selectedIds],
  );

  /* ----------------------------------------------------------
   * Delete flow
   * ---------------------------------------------------------- */

  const requestDeleteSingle = useCallback((asset: MediaAsset) => {
    setDeleteTargets([asset]);
  }, []);

  const requestDeleteSelected = useCallback(() => {
    if (selectedAssets.length === 0) return;
    setDeleteTargets(selectedAssets);
  }, [selectedAssets]);

  const handleDeleted = useCallback((deletedIds: string[]) => {
    // Close drawer if the open asset was deleted
    setOpenAsset((cur) =>
      cur && deletedIds.includes(cur.publicId) ? null : cur,
    );
    // Drop deleted ids from selection
    setSelectedIds((prev) => {
      const next = new Set(prev);
      for (const id of deletedIds) next.delete(id);
      return next;
    });
    setDeleteTargets([]);
  }, []);

  /* ----------------------------------------------------------
   * Render
   * ---------------------------------------------------------- */

  return (
    <div className="space-y-5">
      <MediaFilters
        value={filters}
        onChange={setFilters}
        usedCount={usedCount}
        unusedCount={unusedCount}
      />

      {isLoading && <LoadingGrid />}

      {isError && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error instanceof Error ? error.message : "Failed to load media."}
        </div>
      )}

      {!isLoading && !isError && assets.length === 0 && (
        <EmptyState filtered={filters !== MEDIA_FILTER_DEFAULTS} />
      )}

      {assets.length > 0 && (
        <>
          <MediaGrid
            assets={assets}
            onOpen={setOpenAsset}
            selectable
            selectedIds={selectedIds}
            onToggleSelect={toggleSelect}
          />

          {hasNextPage && (
            <div className="flex justify-center pt-2">
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

          <p className="text-center text-xs text-brand-text-secondary">
            Showing {assets.length} asset{assets.length === 1 ? "" : "s"}
            {hasNextPage ? " · more available" : " · end of library"}
          </p>
        </>
      )}

      {/* Detail drawer */}
      <MediaDetailDrawer
        asset={openAsset}
        open={openAsset !== null}
        onOpenChange={(open) => {
          if (!open) setOpenAsset(null);
        }}
        onRequestDelete={requestDeleteSingle}
      />

      {/* Bulk bar */}
      <MediaBulkBar
        count={selectedIds.size}
        onClear={clearSelection}
        onDelete={requestDeleteSelected}
      />

      {/* Delete dialog */}
      <MediaDeleteDialog
        open={deleteTargets.length > 0}
        onOpenChange={(open) => {
          if (!open) setDeleteTargets([]);
        }}
        assets={deleteTargets}
        onDeleted={handleDeleted}
      />
    </div>
  );
}

/* ============================================================
 * States
 * ============================================================ */

function LoadingGrid() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {Array.from({ length: 18 }).map((_, i) => (
        <Skeleton key={i} className="aspect-square rounded-md" />
      ))}
    </div>
  );
}

function EmptyState({ filtered }: { filtered: boolean }) {
  return (
    <div className="grid place-items-center rounded-lg border border-dashed border-brand-border bg-muted/20 px-6 py-16 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-full bg-brand-surface text-brand-text-secondary">
        <ImageIcon className="h-6 w-6" />
      </div>
      <h3 className="mt-3 text-sm font-medium text-brand-primary">
        {filtered ? "No media matches these filters" : "No media yet"}
      </h3>
      <p className="mt-1 max-w-sm text-xs text-brand-text-secondary">
        {filtered
          ? "Try clearing the filters or searching for a different term."
          : "Upload images from a product, category, or brand form — they'll appear here."}
      </p>
    </div>
  );
}
