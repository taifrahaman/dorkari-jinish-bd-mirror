// src/components/admin/confirm-dialog/index.tsx

"use client";

import { useState, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/* ============================================================
 * Types
 * ============================================================ */

export type ConfirmDialogVariant = "default" | "destructive";

export type ConfirmDialogProps = {
  /** Controls visibility. */
  open: boolean;
  /** Called when the dialog should close (cancel, backdrop click, Esc). */
  onOpenChange: (open: boolean) => void;

  /** Dialog title — usually a question. */
  title: string;
  /** Body copy explaining the consequences. */
  description?: ReactNode;

  /** Confirm button label. Defaults to "Confirm". */
  confirmLabel?: string;
  /** Cancel button label. Defaults to "Cancel". */
  cancelLabel?: string;

  /** Visual + semantic variant. */
  variant?: ConfirmDialogVariant;

  /**
   * Called when the user confirms. Return a promise to show a
   * loading state on the confirm button until it resolves.
   */
  onConfirm: () => void | Promise<void>;
};

/* ============================================================
 * Component
 * ============================================================ */

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "default",
  onConfirm,
}: ConfirmDialogProps) {
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    setLoading(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (loading && !nextOpen) return;
        onOpenChange(nextOpen);
      }}
    >
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="font-heading text-lg text-brand-primary">
            {title}
          </AlertDialogTitle>

          {description && (
            <AlertDialogDescription
              className={cn(
                "text-sm text-brand-text-secondary",
                variant === "destructive" && "text-brand-text-secondary",
              )}
            >
              {description}
            </AlertDialogDescription>
          )}
        </AlertDialogHeader>

        <AlertDialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            {cancelLabel}
          </Button>

          <Button
            type="button"
            variant={variant === "destructive" ? "destructive" : "default"}
            onClick={handleConfirm}
            disabled={loading}
            aria-busy={loading}
          >
            {loading && (
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

export default ConfirmDialog;
