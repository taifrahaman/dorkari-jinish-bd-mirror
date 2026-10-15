// src/components/admin/brand/BrandColumns.tsx

"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Pencil, Archive, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { appFeatures } from "@/lib/table/features";
import type { BrandResponse } from "@/lib/validations/brand.schema";

/* ============================================================
 * Types
 * ============================================================ */

export type BrandColumnActions = {
  onEdit: (brand: BrandResponse) => void;
  onArchive: (brand: BrandResponse) => void;
  onRestore: (brand: BrandResponse) => void;
};

/* ============================================================
 * Column factory
 * ============================================================ */

export function getBrandColumns(
  actions: BrandColumnActions,
): ColumnDef<typeof appFeatures, BrandResponse, unknown>[] {
  return [
    {
      accessorKey: "name.en",
      id: "brand",
      header: "Brand",
      size: 280,
      enableHiding: false,
      meta: { label: "Brand" },
      cell: ({ row }) => {
        const b = row.original;
        return (
          <div className="flex min-w-0 items-center gap-3">
            {b.logo?.url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={b.logo.url}
                alt={b.logo.alt || b.name.en}
                className="h-9 w-9 shrink-0 rounded-md border border-brand-border bg-white object-contain"
                loading="lazy"
              />
            ) : (
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-brand-border bg-muted text-[10px] font-semibold text-brand-text-secondary">
                {b.name.en.slice(0, 2).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <div className="truncate text-sm font-medium text-brand-primary">
                {b.name.en}
              </div>
              <div className="truncate text-xs text-brand-text-secondary">
                {b.name.bn}
              </div>
            </div>
          </div>
        );
      },
    },

    {
      accessorKey: "slug",
      header: "Slug",
      size: 180,
      meta: { label: "Slug" },
      cell: ({ row }) => (
        <code className="rounded bg-muted px-1.5 py-0.5 text-xs text-brand-text-secondary">
          {row.original.slug}
        </code>
      ),
    },

    {
      id: "products",
      header: "Products",
      size: 100,
      enableSorting: false,
      meta: { label: "Products" },
      cell: ({ row }) => {
        const count = row.original.productCount ?? 0;
        return (
          <span className="text-sm tabular-nums text-brand-primary">
            {count}
          </span>
        );
      },
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
            className="border-amber-300 bg-amber-50 text-amber-700"
          >
            Archived
          </Badge>
        ),
    },

    {
      accessorKey: "updatedAt",
      header: "Updated",
      size: 140,
      meta: { label: "Updated" },
      cell: ({ row }) => {
        const d = new Date(row.original.updatedAt);
        return (
          <span className="text-xs text-brand-text-secondary">
            {d.toLocaleDateString()}
          </span>
        );
      },
    },

    {
      id: "actions",
      header: "",
      size: 48,
      enableSorting: false,
      enableHiding: false,
      meta: { label: "Actions" },
      cell: ({ row }) => {
        const b = row.original;
        return (
          <div
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
          >
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
                <DropdownMenuItem onClick={() => actions.onEdit(b)}>
                  <Pencil className="mr-2 h-3.5 w-3.5" aria-hidden="true" />
                  Edit
                </DropdownMenuItem>

                {b.isActive ? (
                  <DropdownMenuItem
                    onClick={() => actions.onArchive(b)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Archive className="mr-2 h-3.5 w-3.5" aria-hidden="true" />
                    Archive
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem onClick={() => actions.onRestore(b)}>
                    <RotateCcw
                      className="mr-2 h-3.5 w-3.5"
                      aria-hidden="true"
                    />
                    Restore
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];
}
