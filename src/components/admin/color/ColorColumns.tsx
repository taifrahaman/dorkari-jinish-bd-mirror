// src/components/admin/color/ColorColumns.tsx

"use client";

import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataTableColumnHeader } from "@/components/admin/data-table";
import { formatRelative } from "@/lib/admin/format";
import { appFeatures } from "@/lib/table/features";
import type { ColorResponse } from "@/lib/validations/color.schema";

/* ============================================================
 * Types
 * ============================================================ */

export type ColorColumnActions = {
  onEdit: (color: ColorResponse) => void;
  onDelete: (color: ColorResponse) => void;
};

/* ============================================================
 * Column factory
 * ============================================================ */

export function getColorColumns(
  actions: ColorColumnActions,
): ColumnDef<typeof appFeatures, ColorResponse, unknown>[] {
  return [
    {
      accessorKey: "name.en",
      id: "color",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Color" />
      ),
      size: 320,
      enableHiding: false,
      meta: { label: "Color" },
      cell: ({ row }) => {
        const color = row.original;
        return (
          <div className="flex min-w-0 items-center gap-3">
            <span
              className="h-8 w-8 shrink-0 rounded-full border border-black/10"
              style={{ backgroundColor: color.hex }}
              aria-hidden="true"
            />

            <div className="min-w-0">
              <Link
                href={`/admin/colors/${color._id}/edit`}
                className="block truncate text-sm font-medium text-brand-primary hover:underline"
              >
                {color.name.en}
              </Link>
              {color.name.bn && color.name.bn !== color.name.en && (
                <p className="truncate text-xs text-brand-text-secondary">
                  {color.name.bn}
                </p>
              )}
            </div>
          </div>
        );
      },
    },

    {
      accessorKey: "hex",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Hex" />
      ),
      size: 140,
      meta: { label: "Hex" },
      cell: ({ row }) => (
        <span className="font-mono text-xs tabular-nums text-brand-text-secondary">
          {row.original.hex}
        </span>
      ),
    },

    {
      accessorKey: "slug",
      header: "Slug",
      size: 180,
      enableSorting: false,
      meta: { label: "Slug" },
      cell: ({ row }) => (
        <span className="font-mono text-xs text-brand-text-secondary">
          {row.original.slug}
        </span>
      ),
    },

    {
      accessorKey: "order",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Order" />
      ),
      size: 90,
      meta: { label: "Order" },
      cell: ({ row }) => (
        <span className="text-sm tabular-nums text-brand-text-secondary">
          {row.original.order}
        </span>
      ),
    },

    {
      accessorKey: "isActive",
      header: "Status",
      size: 120,
      enableSorting: false,
      meta: { label: "Status" },
      cell: ({ row }) =>
        row.original.isActive ? (
          <Badge
            variant="outline"
            className="border-emerald-300 bg-emerald-50 text-emerald-700"
          >
            Active
          </Badge>
        ) : (
          <Badge
            variant="outline"
            className="border-brand-border text-brand-text-secondary"
          >
            Inactive
          </Badge>
        ),
    },

    {
      accessorKey: "updatedAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Updated" />
      ),
      size: 140,
      meta: { label: "Updated" },
      cell: ({ row }) => (
        <span className="text-xs text-brand-text-secondary">
          {formatRelative(row.original.updatedAt)}
        </span>
      ),
    },

    {
      id: "actions",
      header: "",
      size: 48,
      enableSorting: false,
      enableHiding: false,
      meta: { label: "Actions" },
      cell: ({ row }) => {
        const color = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  aria-label="Row actions"
                />
              }
            >
              <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-44">
              <div className="truncate px-2 py-1.5 text-xs font-medium text-brand-text-secondary">
                {color.name.en}
              </div>
              <DropdownMenuSeparator />

              <DropdownMenuItem onClick={() => actions.onEdit(color)}>
                <Pencil className="mr-2 h-3.5 w-3.5" aria-hidden="true" />
                Edit
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={() => actions.onDelete(color)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-3.5 w-3.5" aria-hidden="true" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}
