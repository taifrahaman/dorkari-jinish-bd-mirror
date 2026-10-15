// src/components/admin/brand/BrandDeleteDialog.tsx

"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { BrandResponse } from "@/lib/validations/brand.schema";

export type BrandDialogMode = "archive" | "restore";

export type BrandDeleteDialogProps = {
  brand: BrandResponse | null;
  mode: BrandDialogMode;
  onClose: () => void;
  onConfirm: (brand: BrandResponse, mode: BrandDialogMode) => void;
  isPending?: boolean;
};

export function BrandDeleteDialog({
  brand,
  mode,
  onClose,
  onConfirm,
  isPending = false,
}: BrandDeleteDialogProps) {
  const open = Boolean(brand);
  const isArchive = mode === "archive";

  return (
    <AlertDialog open={open} onOpenChange={(v) => !v && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isArchive ? "Archive brand?" : "Restore brand?"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isArchive ? (
              <>
                <strong>{brand?.name.en}</strong> will be hidden from brand
                pickers on new products. Existing products keep the reference.
              </>
            ) : (
              <>
                <strong>{brand?.name.en}</strong> will become selectable again
                on products.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={isPending}
            onClick={(e) => {
              e.preventDefault();
              if (brand) onConfirm(brand, mode);
            }}
            className={
              isArchive
                ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                : undefined
            }
          >
            {isPending ? "Working…" : isArchive ? "Archive" : "Restore"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default BrandDeleteDialog;
