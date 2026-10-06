// src/components/admin/product/ProductBulkActions.tsx

"use client";

import { useState } from "react";
import { Archive, ArchiveRestore, Download, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTableBulkBar } from "@/components/admin/data-table";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { useArchiveProduct, useRestoreProduct } from "@/hooks/admin";
import { useExportProducts } from "@/hooks/admin";
import type { ProductResponse } from "@/lib/validations/product.schema";

/* ============================================================
 * Types
 * ============================================================ */

export type ProductBulkActionsProps = {
  /** Selected products from the table. */
  rows: ProductResponse[];
  /** Called after a bulk action completes (to clear selection). */
  onClearSelection: () => void;
};

type PendingAction = "archive" | "restore" | null;

/* ============================================================
 * Component
 * ============================================================ */

export function ProductBulkActions({
  rows,
  onClearSelection,
}: ProductBulkActionsProps) {
  const archive = useArchiveProduct();
  const restore = useRestoreProduct();
  const exportProducts = useExportProducts();

  const [pending, setPending] = useState<PendingAction>(null);

  const count = rows.length;

  /* Split selected into live vs archived — bulk archive and bulk
   * restore operate on different subsets. */
  const liveRows = rows.filter((r) => !r.deletedAt);
  const archivedRows = rows.filter((r) => Boolean(r.deletedAt));

  /* Sequential execution: the mutation hooks are single-item.
   * A future enhancement could add a bulk API endpoint; until
   * then, iterating is fine at 200–300 products. */
  const runSequential = async (
    items: ProductResponse[],
    action: (id: string) => Promise<unknown>,
  ) => {
    for (const item of items) {
      await action(item._id);
    }
  };

  const handleArchive = async () => {
    if (liveRows.length === 0) return;
    await runSequential(liveRows, (id) => archive.mutateAsync(id));
    onClearSelection();
  };

  const handleRestore = async () => {
    if (archivedRows.length === 0) return;
    await runSequential(archivedRows, (id) => restore.mutateAsync(id));
    onClearSelection();
  };

  const handleExport = () => {
    exportProducts.mutate({
      format: "csv",
      ids: rows.map((r) => r._id),
    });
  };

  const isWorking = archive.isPending || restore.isPending;

  return (
    <>
      <DataTableBulkBar count={count} noun="product" onClear={onClearSelection}>
        {liveRows.length > 0 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setPending("archive")}
            disabled={isWorking}
          >
            <Archive className="mr-2 h-3.5 w-3.5" aria-hidden="true" />
            Archive {liveRows.length > 1 ? `(${liveRows.length})` : ""}
          </Button>
        )}

        {archivedRows.length > 0 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setPending("restore")}
            disabled={isWorking}
          >
            <ArchiveRestore className="mr-2 h-3.5 w-3.5" aria-hidden="true" />
            Restore {archivedRows.length > 1 ? `(${archivedRows.length})` : ""}
          </Button>
        )}

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleExport}
          disabled={exportProducts.isPending || isWorking}
        >
          <Download className="mr-2 h-3.5 w-3.5" aria-hidden="true" />
          Export
        </Button>

        {/* Danger action — navigate to per-row delete flow rather
         * than bulk-deleting here. Bulk permanent delete is a
         * bigger footgun than it's worth for 2–3 hundred products;
         * the admin can archive first, then filter archived and
         * bulk-delete from there if a real need arises. */}
      </DataTableBulkBar>

      {/* Archive confirmation */}
      <ConfirmDialog
        open={pending === "archive"}
        onOpenChange={(open) => !open && setPending(null)}
        title={`Archive ${liveRows.length} product${liveRows.length === 1 ? "" : "s"}?`}
        description="They will be hidden from the storefront and marked inactive. You can restore them anytime from the archived filter."
        confirmLabel="Archive"
        onConfirm={handleArchive}
      />

      {/* Restore confirmation */}
      <ConfirmDialog
        open={pending === "restore"}
        onOpenChange={(open) => !open && setPending(null)}
        title={`Restore ${archivedRows.length} product${archivedRows.length === 1 ? "" : "s"}?`}
        description="They will be visible again. If any of their categories are archived, restore those first."
        confirmLabel="Restore"
        onConfirm={handleRestore}
      />
    </>
  );
}

export default ProductBulkActions;
