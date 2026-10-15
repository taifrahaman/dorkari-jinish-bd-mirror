// src/components/admin/media/MediaDeleteDialog.tsx

"use client";

import { useMemo } from "react";
import { AlertTriangle, Loader2, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { MediaAsset, UsageRef } from "@/services/media.service";
import { useDeleteMedia } from "@/hooks/admin/use-media";

/* ============================================================
 * Types
 * ============================================================ */

export type MediaDeleteDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** One or more assets to delete. Empty = closed. */
  assets: MediaAsset[];
  /** Called after successful delete (before closing). */
  onDeleted?: (deletedIds: string[]) => void;
};

/* ============================================================
 * Component
 * ============================================================ */

export function MediaDeleteDialog({
  open,
  onOpenChange,
  assets,
  onDeleted,
}: MediaDeleteDialogProps) {
  const mutation = useDeleteMedia();

  /* Collect every usage ref across all selected assets. */
  const usageRefs = useMemo<UsageRef[]>(() => {
    const seen = new Set<string>();
    const out: UsageRef[] = [];
    for (const a of assets) {
      for (const ref of a.usedBy) {
        const key = `${ref.kind}:${ref.id}`;
        if (seen.has(key)) continue;
        seen.add(key);
        out.push(ref);
      }
    }
    return out;
  }, [assets]);

  const hasUsage = usageRefs.length > 0;
  const count = assets.length;
  const isBusy = mutation.isPending;

  const handleConfirm = async () => {
    if (count === 0) return;

    const publicIds = assets.map((a) => a.publicId);
    const res = await mutation.mutateAsync({
      publicIds,
      force: hasUsage,
    });

    onDeleted?.(res.deleted);
    onOpenChange(false);
  };

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (isBusy) return; // don't close mid-delete
        onOpenChange(next);
      }}
    >
      <AlertDialogContent className="max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            {hasUsage ? (
              <>
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                Delete {count === 1 ? "this image" : `${count} images`}?
              </>
            ) : (
              <>
                <Trash2 className="h-5 w-5 text-destructive" />
                Delete {count === 1 ? "this image" : `${count} images`}?
              </>
            )}
          </AlertDialogTitle>

          <AlertDialogDescription>
            {hasUsage
              ? `${count === 1 ? "This image is" : "Some of these images are"} currently in use. Deleting will remove the reference from the items listed below and permanently delete the file from Cloudinary.`
              : "These files will be permanently deleted from Cloudinary. This cannot be undone."}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* Usage list */}
        {hasUsage && (
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-text-secondary">
              Used by {usageRefs.length}{" "}
              {usageRefs.length === 1 ? "item" : "items"}
            </p>

            <ScrollArea className="max-h-48 rounded-md border border-brand-border bg-muted/20">
              <ul className="divide-y divide-brand-border">
                {usageRefs.map((ref) => (
                  <UsageListItem key={`${ref.kind}-${ref.id}`} ref_={ref} />
                ))}
              </ul>
            </ScrollArea>

            <p className="text-xs text-amber-700">
              Their image references will be removed automatically.
            </p>
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isBusy}>Cancel</AlertDialogCancel>

          <Button
            variant="destructive"
            onClick={(e) => {
              e.preventDefault();
              void handleConfirm();
            }}
            disabled={isBusy}
          >
            {isBusy ? (
              <>
                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                Deleting…
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-3.5 w-3.5" />
                {hasUsage ? "Remove & delete" : "Delete"}
              </>
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/* ============================================================
 * Row
 * ============================================================ */

function UsageListItem({ ref_ }: { ref_: UsageRef }) {
  return (
    <li className="flex items-center justify-between gap-3 px-3 py-2 text-xs">
      <span className="flex min-w-0 items-center gap-2">
        <span className="shrink-0 rounded bg-brand-surface px-1.5 py-0.5 text-[10px] font-semibold uppercase text-brand-text-secondary">
          {ref_.kind}
        </span>
        <span className="truncate text-brand-primary">{ref_.name}</span>
      </span>
      <code className="shrink-0 text-[10px] text-brand-text-secondary">
        {ref_.slug}
      </code>
    </li>
  );
}
