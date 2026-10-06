// src/components/admin/data-table/DataTable.tsx

"use client";

import {
  useTable,
  type ColumnDef,
  type RowData,
  type SortingState,
  type ColumnVisibilityState,
  type RowSelectionState,
  type OnChangeFn,
} from "@tanstack/react-table";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { appFeatures } from "@/lib/table/features";
import { EmptyState } from "@/components/admin/empty-state";
import { DataTablePagination } from "./DataTablePagination";

/* ============================================================
 * Types
 * ============================================================ */

export type DataTableProps<TData extends RowData> = {
  columns: ColumnDef<typeof appFeatures, TData, unknown>[];
  data: TData[];

  /* Sorting */
  sorting?: SortingState;
  onSortingChange?: OnChangeFn<SortingState>;

  /* Column visibility */
  columnVisibility?: ColumnVisibilityState;
  onColumnVisibilityChange?: OnChangeFn<ColumnVisibilityState>;

  /* Row selection */
  enableRowSelection?: boolean;
  rowSelection?: RowSelectionState;
  onRowSelectionChange?: OnChangeFn<RowSelectionState>;
  getRowId?: (row: TData) => string;

  /* Pagination (server-driven) */
  pageIndex?: number;
  pageSize?: number;
  pageCount?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;

  /* Chrome */
  toolbar?: (
    table: ReturnType<typeof useTable<typeof appFeatures, TData>>,
  ) => React.ReactNode;
  bulkBar?: (selectedRows: TData[]) => React.ReactNode;

  /* States */
  isLoading?: boolean;
  emptyState?: React.ReactNode;

  /* Behavior */
  onRowClick?: (row: TData, event: React.MouseEvent) => void;

  className?: string;
};

/* ============================================================
 * Component
 * ============================================================ */

export function DataTable<TData extends RowData>({
  columns,
  data,
  sorting,
  onSortingChange,
  columnVisibility,
  onColumnVisibilityChange,
  enableRowSelection = false,
  rowSelection,
  onRowSelectionChange,
  getRowId,
  pageIndex = 0,
  pageSize = 20,
  pageCount = 1,
  onPageChange,
  onPageSizeChange,
  toolbar,
  bulkBar,
  isLoading = false,
  emptyState,
  onRowClick,
  className,
}: DataTableProps<TData>) {
  const table = useTable({
    features: appFeatures,
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection: rowSelection ?? {},
      pagination: { pageIndex, pageSize },
    },
    onSortingChange,
    onColumnVisibilityChange,
    onRowSelectionChange,
    getRowId,
    enableRowSelection,
    manualSorting: true,
    manualPagination: true,
    pageCount,
  });

  const rows = table.getRowModel().rows;
  const selectedRows = table.getSelectedRowModel().rows.map((r) => r.original);

  const isEmpty = !isLoading && rows.length === 0;
  const showSkeleton = isLoading && rows.length === 0;
  const visibleColumnCount = table.getVisibleLeafColumns().length;

  return (
    <div className={cn("space-y-4", className)}>
      {typeof toolbar === "function" ? toolbar(table) : toolbar}

      {enableRowSelection &&
        selectedRows.length > 0 &&
        bulkBar &&
        bulkBar(selectedRows)}

      {isEmpty ? (
        <div className="rounded-md border border-brand-border bg-brand-surface">
          {emptyState ?? (
            <EmptyState
              title="No results"
              description="Nothing to show here."
            />
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-md border border-brand-border bg-brand-surface">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow
                  key={headerGroup.id}
                  className="border-b border-brand-border bg-muted/40 hover:bg-muted/40"
                >
                  {enableRowSelection && (
                    <TableHead className="w-10 pl-3">
                      <Checkbox
                        checked={table.getIsAllPageRowsSelected()}
                        indeterminate={table.getIsSomePageRowsSelected()}
                        onCheckedChange={(value) =>
                          table.toggleAllPageRowsSelected(!!value)
                        }
                        aria-label="Select all"
                        className="translate-y-0.5"
                      />
                    </TableHead>
                  )}

                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      className="h-10 text-xs font-medium text-brand-text-secondary"
                      style={{
                        width:
                          header.getSize() !== 150
                            ? header.getSize()
                            : undefined,
                      }}
                    >
                      {header.isPlaceholder ? null : (
                        <table.FlexRender header={header} />
                      )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>

            <TableBody>
              {showSkeleton ? (
                <SkeletonRows
                  rowCount={pageSize > 10 ? 10 : pageSize}
                  columnCount={
                    visibleColumnCount + (enableRowSelection ? 1 : 0)
                  }
                />
              ) : (
                rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    onClick={
                      onRowClick
                        ? (e) => onRowClick(row.original, e)
                        : undefined
                    }
                    className={cn(
                      "border-b border-brand-border transition-colors",
                      onRowClick && "cursor-pointer",
                      "hover:bg-muted/40 data-[state=selected]:bg-muted/60",
                    )}
                  >
                    {enableRowSelection && (
                      <TableCell
                        className="w-10 pl-3"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Checkbox
                          checked={row.getIsSelected()}
                          onCheckedChange={(value) =>
                            row.toggleSelected(!!value)
                          }
                          aria-label="Select row"
                          className="translate-y-0.5"
                        />
                      </TableCell>
                    )}

                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        className="py-3 text-sm text-brand-text"
                        style={{
                          width:
                            cell.column.getSize() !== 150
                              ? cell.column.getSize()
                              : undefined,
                        }}
                      >
                        <table.FlexRender cell={cell} />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {onPageChange && !isEmpty && (
        <DataTablePagination
          pageIndex={pageIndex}
          pageSize={pageSize}
          pageCount={pageCount}
          totalRows={data.length}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
        />
      )}
    </div>
  );
}

/* ============================================================
 * Skeleton rows
 * ============================================================ */

function SkeletonRows({
  rowCount,
  columnCount,
}: {
  rowCount: number;
  columnCount: number;
}) {
  return (
    <>
      {Array.from({ length: rowCount }).map((_, rowIdx) => (
        <TableRow
          key={`skeleton-${rowIdx}`}
          className="border-b border-brand-border"
        >
          {Array.from({ length: columnCount }).map((_, colIdx) => (
            <TableCell key={`skeleton-${rowIdx}-${colIdx}`} className="py-3">
              <Skeleton
                className={cn(
                  "h-4",
                  colIdx === 0 ? "w-8" : colIdx % 3 === 0 ? "w-24" : "w-40",
                )}
              />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}
