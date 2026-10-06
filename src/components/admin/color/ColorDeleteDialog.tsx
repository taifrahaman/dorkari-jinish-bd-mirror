// src/components/admin/color/ColorDeleteDialog.tsx

"use client";

import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { useDeleteColor } from "@/hooks/admin";
import type { ColorResponse } from "@/lib/validations/color.schema";

/* ============================================================
 * Types
 * ============================================================ */

export type ColorDeleteDialogProps = {
  color: ColorResponse | null;
  onClose: () => void;
};

/* ============================================================
 * Component
 * ============================================================ */

export function ColorDeleteDialog({ color, onClose }: ColorDeleteDialogProps) {
  const deleteMutation = useDeleteColor();

  const handleConfirm = async () => {
    if (!color) return;
    await deleteMutation.mutateAsync(color._id);
    onClose();
  };

  return (
    <ConfirmDialog
      open={color !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title="Delete this color?"
      description={
        color ? (
          <>
            <strong>{color.name.en}</strong> will be removed from the shared
            color library. Products that already use this color keep their
            current swatch — this only removes it from future pickers.
          </>
        ) : null
      }
      confirmLabel="Delete"
      variant="destructive"
      onConfirm={handleConfirm}
    />
  );
}

export default ColorDeleteDialog;
