// src/components/admin/category/CategoryDeleteDialog.tsx

"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  useArchiveCategory,
  useRestoreCategory,
  usePermanentDeleteCategory,
} from "@/hooks/admin";
import type { CategoryResponse } from "@/lib/validations/category.schema";

/* ============================================================
 * Types
 * ============================================================ */

export type CategoryDialogMode = "archive" | "restore" | "permanent-delete";

export type CategoryDeleteDialogProps = {
  category: CategoryResponse | null;
  mode: CategoryDialogMode;
  /** Number of descendants (recursively). Computed by the caller. */
  descendantCount?: number;
  /** Number of products in this category + descendants. */
  productCount?: number;
  onClose: () => void;
};

/* ============================================================
 * Component
 * ============================================================ */

export function CategoryDeleteDialog({
  category,
  mode,
  descendantCount = 0,
  productCount = 0,
  onClose,
}: CategoryDeleteDialogProps) {
  const archive = useArchiveCategory();
  const restore = useRestoreCategory();
  const permanentDelete = usePermanentDeleteCategory();

  const [cascade, setCascade] = useState(false);
  const [running, setRunning] = useState(false);

  /* Reset cascade when dialog opens/closes */
  useEffect(() => {
    if (!category) setCascade(false);
  }, [category]);

  const open = category !== null;
  const isPending =
    running ||
    archive.isPending ||
    restore.isPending ||
    permanentDelete.isPending;

  const handleConfirm = async () => {
    if (!category) return;
    setRunning(true);

    try {
      if (mode === "archive") {
        await archive.mutateAsync(category._id);
      } else if (mode === "restore") {
        await restore.mutateAsync(category._id);
      } else {
        await permanentDelete.mutateAsync({
          id: category._id,
          cascade,
        });
      }
      onClose();
    } finally {
      setRunning(false);
    }
  };

  /* ----------------------------------------------------------
   * Content per mode
   * ---------------------------------------------------------- */

  const { title, body, confirmLabel, variant } = buildCopy({
    category,
    mode,
    descendantCount,
    productCount,
  });

  const canConfirmPermanent =
    mode !== "permanent-delete" || descendantCount === 0 || cascade;

  const blockedByProducts = mode === "permanent-delete" && productCount > 0;

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (!next && !isPending) onClose();
      }}
    >
      <AlertDialogContent className="max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle className="font-heading text-lg text-brand-primary">
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm text-brand-text-secondary">
            {body}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* Cascade checkbox (permanent delete only) */}
        {mode === "permanent-delete" &&
          descendantCount > 0 &&
          !blockedByProducts && (
            <div className="mt-2 flex items-start gap-3 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2.5">
              <Checkbox
                id="cascade"
                checked={cascade}
                onCheckedChange={(v) => setCascade(!!v)}
                className="mt-0.5"
              />
              <div>
                <Label
                  htmlFor="cascade"
                  className="text-sm font-medium text-brand-primary"
                >
                  Also delete {descendantCount} subcategor
                  {descendantCount === 1 ? "y" : "ies"}
                </Label>
                <p className="mt-0.5 text-xs text-brand-text-secondary">
                  Check this box to remove the whole subtree.
                </p>
              </div>
            </div>
          )}

        {/* Product block warning */}
        {blockedByProducts && (
          <div className="mt-2 flex items-start gap-3 rounded-md border border-amber-300 bg-amber-50 px-3 py-2.5 text-amber-900">
            <AlertTriangle
              className="mt-0.5 h-4 w-4 shrink-0"
              aria-hidden="true"
            />
            <div className="text-xs">
              <p className="font-medium">Cannot delete yet</p>
              <p className="mt-0.5">
                {productCount} product{productCount === 1 ? "" : "s"} still
                reference this category. Reassign or delete them first.
              </p>
            </div>
          </div>
        )}

        <AlertDialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isPending}
          >
            Cancel
          </Button>

          <Button
            type="button"
            variant={variant}
            onClick={handleConfirm}
            disabled={isPending || blockedByProducts || !canConfirmPermanent}
            aria-busy={isPending}
          >
            {isPending && (
              <Loader2
                className="mr-2 h-4 w-4 animate-spin"
                aria-hidden="true"
              />
            )}
            {confirmLabel}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default CategoryDeleteDialog;

/* ============================================================
 * Copy builder
 * ============================================================ */

function buildCopy({
  category,
  mode,
  descendantCount,
  productCount,
}: {
  category: CategoryResponse | null;
  mode: CategoryDialogMode;
  descendantCount: number;
  productCount: number;
}): {
  title: string;
  body: React.ReactNode;
  confirmLabel: string;
  variant: "default" | "destructive";
} {
  if (!category) {
    return {
      title: "",
      body: null,
      confirmLabel: "Confirm",
      variant: "default",
    };
  }

  const name = category.name;

  switch (mode) {
    case "archive":
      return {
        title: "Archive this category?",
        body: (
          <>
            <strong>{name.en}</strong>
            {descendantCount > 0 && (
              <>
                {" "}
                and {descendantCount} subcategor
                {descendantCount === 1 ? "y" : "ies"}
              </>
            )}{" "}
            will be hidden from the storefront. Products remain but lose their
            category. Restore anytime from the archived filter.
          </>
        ),
        confirmLabel: "Archive",
        variant: "default",
      };

    case "restore":
      return {
        title: "Restore this category?",
        body: (
          <>
            <strong>{name.en}</strong>
            {descendantCount > 0 && (
              <>
                {" "}
                and {descendantCount} subcategor
                {descendantCount === 1 ? "y" : "ies"}
              </>
            )}{" "}
            will be visible again. If the parent category is archived, restore
            it first.
          </>
        ),
        confirmLabel: "Restore",
        variant: "default",
      };

    case "permanent-delete":
      return {
        title: "Permanently delete this category?",
        body: (
          <>
            <strong>{name.en}</strong> will be removed from the database
            {category.image && " along with its cover image"}. This action
            cannot be undone.
            {productCount > 0 && (
              <>
                {" "}
                <strong>{productCount}</strong> product
                {productCount === 1 ? "" : "s"} reference this category — they
                must be reassigned first.
              </>
            )}
          </>
        ),
        confirmLabel: "Delete forever",
        variant: "destructive",
      };
  }
}
