// src/components/admin/data-table/DataTablePagination.tsx

"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

/* ============================================================
 * Types
 * ============================================================ */

type DataTablePaginationProps = {
  /** 0-based page index. */
  pageIndex: number;
  pageSize: number;
  pageCount: number;
  /** Number of rows currently rendered (current page size). */
  totalRows: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
  className?: string;
};

/* ============================================================
 * Component
 * ============================================================ */

export function DataTablePagination({
  pageIndex,
  pageSize,
  pageCount,
  totalRows,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
  className,
}: DataTablePaginationProps) {
  const isFirst = pageIndex <= 0;
  const isLast = pageIndex >= pageCount - 1;

  // 1-based display
  const currentPage = pageIndex + 1;
  const safePageCount = Math.max(1, pageCount);

  const rangeStart = totalRows === 0 ? 0 : pageIndex * pageSize + 1;
  const rangeEnd = totalRows === 0 ? 0 : pageIndex * pageSize + totalRows;

  return (
    <div
      className={cn(
        "flex flex-col items-start gap-3 text-sm text-brand-text-secondary sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      {/* Left — row count + page size */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="tabular-nums">
          {rangeStart}–{rangeEnd} of {totalRows}
        </span>

        {onPageSizeChange && (
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline">Rows per page</span>
            <Select
              value={String(pageSize)}
              onValueChange={(v) => onPageSizeChange(Number(v))}
            >
              <SelectTrigger className="h-8 w-18" aria-label="Rows per page">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Right — page indicator + nav */}
      <div className="flex items-center gap-2">
        <span className="tabular-nums">
          Page {currentPage} of {safePageCount}
        </span>

        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onPageChange(pageIndex - 1)}
            disabled={isFirst}
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </Button>

          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onPageChange(pageIndex + 1)}
            disabled={isLast}
            aria-label="Next page"
          >
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default DataTablePagination;
