// src/components/admin/media/MediaBulkBar.tsx

"use client";

import { Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export type MediaBulkBarProps = {
  count: number;
  onClear: () => void;
  onDelete: () => void;
  isBusy?: boolean;
};

export function MediaBulkBar({
  count,
  onClear,
  onDelete,
  isBusy = false,
}: MediaBulkBarProps) {
  if (count === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-30 flex justify-center px-4">
      <div className="pointer-events-auto flex items-center gap-3 rounded-full border border-brand-border bg-brand-surface/95 px-2 py-1.5 shadow-lg backdrop-blur">
        <span className="pl-2 text-sm font-medium text-brand-primary">
          {count} selected
        </span>

        <span className="h-4 w-px bg-brand-border" aria-hidden />

        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          disabled={isBusy}
          className="h-8 gap-1.5 rounded-full px-3 text-xs"
        >
          <X className="h-3.5 w-3.5" />
          Clear
        </Button>

        <Button
          variant="destructive"
          size="sm"
          onClick={onDelete}
          disabled={isBusy}
          className="h-8 gap-1.5 rounded-full px-3 text-xs"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Delete
        </Button>
      </div>
    </div>
  );
}
