// src/components/admin/product/ProductDeleteDialog.tsx

"use client";

import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import {
  useArchiveProduct,
  useRestoreProduct,
  usePermanentDeleteProduct,
} from "@/hooks/admin";
import type { ProductResponse } from "@/lib/validations/product.schema";

/* ============================================================
 * Types
 * ============================================================ */

export type ProductDialogMode = "archive" | "restore" | "permanent-delete";

export type ProductDeleteDialogProps = {
  /** Product the action targets. `null` closes the dialog. */
  product: ProductResponse | null;
  /** Which action to perform. */
  mode: ProductDialogMode;
  /** Called when the dialog should close (cancel, success, backdrop). */
  onClose: () => void;
};

/* ============================================================
 * Copy
 * ============================================================ */

type Copy = {
  title: string;
  description: React.ReactNode;
  confirmLabel: string;
  variant: "default" | "destructive";
};

function buildCopy(product: ProductResponse, mode: ProductDialogMode): Copy {
  const name = product.name.en;

  switch (mode) {
    case "archive":
      return {
        title: "Archive this product?",
        description: (
          <>
            <strong>{name}</strong> will be hidden from the storefront and
            marked inactive. You can restore it anytime from the archived
            filter.
          </>
        ),
        confirmLabel: "Archive",
        variant: "default",
      };

    case "restore":
      return {
        title: "Restore this product?",
        description: (
          <>
            <strong>{name}</strong> will be visible again. If its category is
            archived, restore the category first.
          </>
        ),
        confirmLabel: "Restore",
        variant: "default",
      };

    case "permanent-delete":
      return {
        title: "Permanently delete this product?",
        description: (
          <>
            <strong>{name}</strong> and all{" "}
            <strong>
              {product.images.length} image
              {product.images.length === 1 ? "" : "s"}
            </strong>{" "}
            will be removed from Cloudinary. This action cannot be undone.
          </>
        ),
        confirmLabel: "Delete forever",
        variant: "destructive",
      };
  }
}

/* ============================================================
 * Component
 * ============================================================ */

export function ProductDeleteDialog({
  product,
  mode,
  onClose,
}: ProductDeleteDialogProps) {
  const archive = useArchiveProduct();
  const restore = useRestoreProduct();
  const permanentDelete = usePermanentDeleteProduct();

  const open = product !== null;
  const copy = product ? buildCopy(product, mode) : null;

  const handleConfirm = async () => {
    if (!product) return;

    if (mode === "archive") {
      await archive.mutateAsync(product._id);
    } else if (mode === "restore") {
      await restore.mutateAsync(product._id);
    } else {
      await permanentDelete.mutateAsync(product._id);
    }

    onClose();
  };

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      title={copy?.title ?? ""}
      description={copy?.description}
      confirmLabel={copy?.confirmLabel}
      variant={copy?.variant ?? "default"}
      onConfirm={handleConfirm}
    />
  );
}

export default ProductDeleteDialog;
