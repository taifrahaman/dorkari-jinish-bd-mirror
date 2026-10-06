// src/components/admin/data-table/DataTableToolbar.tsx

"use client";

import type { RowData, Table } from "@tanstack/react-table";
import { Settings2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { AppFeatures } from "@/lib/table/features";

/* ============================================================
 * Types
 * ============================================================ */

export type DataTableToolbarProps<TData extends RowData> = {
  table: Table<AppFeatures, TData>;

  search?: {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
  };

  filters?: React.ReactNode;
  actions?: React.ReactNode;
  showColumnToggle?: boolean;
  className?: string;
};

/* ============================================================
 * Component
 * ============================================================ */

export function DataTableToolbar<TData extends RowData>({
  table,
  search,
  filters,
  actions,
  showColumnToggle = true,
  className,
}: DataTableToolbarProps<TData>) {
  const hideableColumns = table
    .getAllColumns()
    .filter((col) => col.getCanHide());

  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      {/* Left — search + filters */}
      <div className="flex flex-1 flex-wrap items-center gap-2">
        {search && (
          <div className="relative w-full max-w-xs">
            <Input
              value={search.value}
              onChange={(e) => search.onChange(e.target.value)}
              placeholder={search.placeholder ?? "Search…"}
              className="h-9 pr-8"
            />
            {search.value.length > 0 && (
              <button
                type="button"
                onClick={() => search.onChange("")}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 grid h-5 w-5 -translate-y-1/2 place-items-center rounded-full text-brand-text-secondary transition-colors hover:bg-muted hover:text-brand-primary"
              >
                <X className="h-3 w-3" aria-hidden="true" />
              </button>
            )}
          </div>
        )}

        {filters}
      </div>

      {/* Right — actions + column toggle */}
      <div className="flex items-center gap-2">
        {actions}

        {showColumnToggle && hideableColumns.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9"
                />
              }
            >
              <Settings2 className="mr-2 h-4 w-4" aria-hidden="true" />
              View
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-44">
              {/* Plain heading — Base UI Menu.GroupLabel requires a
                  Menu.Group wrapper. A non-interactive label doesn't
                  need either, so we render a styled div instead. */}
              <div className="px-2 py-1.5 text-xs font-medium text-brand-text-secondary">
                Toggle columns
              </div>
              <DropdownMenuSeparator />

              {hideableColumns.map((column) => {
                const label =
                  (column.columnDef.meta as { label?: string } | undefined)
                    ?.label ?? column.id;

                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                    onSelect={(e) => e.preventDefault()}
                  >
                    {label}
                  </DropdownMenuCheckboxItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}

export default DataTableToolbar;
