// src/components/admin/data-table/DataTableColumnHeader.tsx

"use client";

import type { Column, RowData } from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ChevronsUpDown, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { AppFeatures } from "@/lib/table/features";

/* ============================================================
 * Types
 * ============================================================ */

type DataTableColumnHeaderProps<TData extends RowData, TValue> = {
  column: Column<AppFeatures, TData, TValue>;
  title: string;
  className?: string;
};

/* ============================================================
 * Component
 * ============================================================ */

export function DataTableColumnHeader<TData extends RowData, TValue>({
  column,
  title,
  className,
}: DataTableColumnHeaderProps<TData, TValue>) {
  const canSort = column.getCanSort();
  const canHide = column.getCanHide();
  const sorted = column.getIsSorted();

  /* Not sortable, not hideable — plain text label */
  if (!canSort && !canHide) {
    return (
      <div className={cn("font-medium text-brand-primary", className)}>
        {title}
      </div>
    );
  }

  /* Sortable but not hideable — click header to cycle sort */
  if (canSort && !canHide) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => column.toggleSorting(sorted === "asc")}
        className={cn(
          "-ml-2 h-8 px-2 font-medium text-brand-primary hover:bg-muted",
          className,
        )}
      >
        {title}
        <SortIcon sorted={sorted} />
      </Button>
    );
  }

  /* Sortable and hideable — dropdown menu */
  return (
    <div className={cn("flex items-center space-x-2", className)}>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="-ml-2 h-8 px-2 font-medium text-brand-primary hover:bg-muted"
            />
          }
        >
          {title}
          <SortIcon sorted={sorted} />
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start" className="w-40">
          {canSort && (
            <>
              <DropdownMenuItem onClick={() => column.toggleSorting(false)}>
                <ArrowUp className="mr-2 h-3.5 w-3.5 text-brand-text-secondary" />
                Asc
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => column.toggleSorting(true)}>
                <ArrowDown className="mr-2 h-3.5 w-3.5 text-brand-text-secondary" />
                Desc
              </DropdownMenuItem>
            </>
          )}

          {canHide && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => column.toggleVisibility(false)}>
                <EyeOff className="mr-2 h-3.5 w-3.5 text-brand-text-secondary" />
                Hide
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

/* ============================================================
 * Sort icon
 * ============================================================ */

function SortIcon({ sorted }: { sorted: false | "asc" | "desc" }) {
  if (sorted === "asc") {
    return <ArrowUp className="ml-2 h-3.5 w-3.5 shrink-0" aria-hidden="true" />;
  }
  if (sorted === "desc") {
    return (
      <ArrowDown className="ml-2 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
    );
  }
  return (
    <ChevronsUpDown
      className="ml-2 h-3.5 w-3.5 shrink-0 text-brand-text-secondary/60"
      aria-hidden="true"
    />
  );
}
