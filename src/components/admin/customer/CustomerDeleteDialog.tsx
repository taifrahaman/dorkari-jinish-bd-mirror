// src/components/admin/customer/CustomerDeleteDialog.tsx

"use client";

import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import {
  useArchiveCustomer,
  useRestoreCustomer,
  usePermanentDeleteCustomer,
} from "@/hooks/admin";
import type { CustomerResponse } from "@/lib/validations/customer.schema";

/* ============================================================
 * Types
 * ============================================================ */

export type CustomerDialogMode = "archive" | "restore" | "permanent-delete";

export type CustomerDeleteDialogProps = {
  customer: CustomerResponse | null;
  mode: CustomerDialogMode;
  onClose: () => void;
};

/* ============================================================
 * Component
 * ============================================================ */

export function CustomerDeleteDialog({
  customer,
  mode,
  onClose,
}: CustomerDeleteDialogProps) {
  const archive = useArchiveCustomer();
  const restore = useRestoreCustomer();
  const permanentDelete = usePermanentDeleteCustomer();

  const handleConfirm = async () => {
    if (!customer) return;

    if (mode === "archive") {
      await archive.mutateAsync(customer._id);
    } else if (mode === "restore") {
      await restore.mutateAsync(customer._id);
    } else {
      await permanentDelete.mutateAsync(customer._id);
    }

    onClose();
  };

  const copy = customer ? buildCopy(customer, mode) : null;

  return (
    <ConfirmDialog
      open={customer !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={copy?.title ?? ""}
      description={copy?.description}
      confirmLabel={copy?.confirmLabel}
      variant={copy?.variant ?? "default"}
      onConfirm={handleConfirm}
    />
  );
}

export default CustomerDeleteDialog;

/* ============================================================
 * Copy builder
 * ============================================================ */

function buildCopy(
  customer: CustomerResponse,
  mode: CustomerDialogMode,
): {
  title: string;
  description: React.ReactNode;
  confirmLabel: string;
  variant: "default" | "destructive";
} {
  const name = customer.name;

  switch (mode) {
    case "archive":
      return {
        title: "Archive this customer?",
        description: (
          <>
            <strong>{name}</strong> will be hidden from the default list. Their
            order history is preserved. You can restore them anytime.
          </>
        ),
        confirmLabel: "Archive",
        variant: "default",
      };

    case "restore":
      return {
        title: "Restore this customer?",
        description: (
          <>
            <strong>{name}</strong> will be active again and visible in the
            customer list.
          </>
        ),
        confirmLabel: "Restore",
        variant: "default",
      };

    case "permanent-delete":
      return {
        title: "Permanently delete this customer?",
        description: (
          <>
            <strong>{name}</strong> will be removed from the database. This
            action cannot be undone. Customers with existing orders cannot be
            deleted — archive them instead.
          </>
        ),
        confirmLabel: "Delete forever",
        variant: "destructive",
      };
  }
}
