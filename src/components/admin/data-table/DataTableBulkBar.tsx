// src/components/admin/data-table/DataTableBulkBar.tsx

"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/* ============================================================
 * Types
 * ============================================================ */

export type DataTableBulkBarProps = {
  /** Number of selected rows. */
  count: number;
  /** Called when the user clears the selection. */
  onClear: () => void;
  /** Action buttons (delete, archive, change status, etc.). */
  children?: React.ReactNode;
  /** Label noun — "product" renders "3 products selected". */
  noun?: string;
  className?: string;
};

/* ============================================================
 * Component
 * ============================================================ */

export function DataTableBulkBar({
  count,
  onClear,
  children,
  noun = "item",
  className,
}: DataTableBulkBarProps) {
  if (count === 0) return null;

  const plural = count === 1 ? noun : `${noun}s`;

  return (
    <div
      role="region"
      aria-label="Bulk actions"
      className={cn(
        "flex flex-col gap-3 rounded-md border border-brand-accent/30 bg-brand-accent-light px-4 py-3 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-brand-primary">
          {count} {plural} selected
        </span>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onClear}
          className="h-7 px-2 text-xs text-brand-text-secondary hover:text-brand-primary"
        >
          <X className="mr-1 h-3 w-3" aria-hidden="true" />
          Clear
        </Button>
      </div>

      {children && (
        <div className="flex flex-wrap items-center gap-2">{children}</div>
      )}
    </div>
  );
}

export default DataTableBulkBar;
