// src/components/admin/product/ProductColumns.tsx

"use client";

import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import {
  Archive,
  ArchiveRestore,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
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
import { cn } from "@/lib/utils";
import {
  formatPrice,
  initials,
  formatRelative,
  stockLevel,
} from "@/lib/admin/format";
import { appFeatures } from "@/lib/table/features";
import type { ProductResponse } from "@/lib/validations/product.schema";

/* ============================================================
 * Types
 * ============================================================ */

export type ProductColumnActions = {
  onEdit: (product: ProductResponse) => void;
  onArchive: (product: ProductResponse) => void;
  onRestore: (product: ProductResponse) => void;
  onPermanentDelete: (product: ProductResponse) => void;
};

/* ============================================================
 * Helpers
 * ============================================================ */

function getCategoryName(product: ProductResponse): string {
  const cat = product.category;
  if (!cat) return "—";
  if (typeof cat === "string") return "—";
  return cat.name;
}

function getPrimaryImage(product: ProductResponse) {
  return product.images?.[0];
}

/* ============================================================
 * Column factory
 * ============================================================ */

export function getProductColumns(
  actions: ProductColumnActions,
): ColumnDef<typeof appFeatures, ProductResponse, unknown>[] {
  return [
    {
      accessorKey: "name.en",
      id: "product",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Product" />
      ),
      size: 320,
      enableHiding: false,
      meta: { label: "Product" },
      cell: ({ row }) => {
        const product = row.original;
        const image = getPrimaryImage(product);
        return (
          <div className="flex min-w-0 items-center gap-3">
            <div className="h-10 w-10 shrink-0 overflow-hidden rounded-md border border-brand-border bg-muted">
              {image ? (
                <img
                  src={image.url}
                  alt={product.name.en}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="grid h-full w-full place-items-center text-[10px] font-semibold text-brand-text-secondary">
                  {initials(product.name.en)}
                </div>
              )}
            </div>

            <div className="min-w-0">
              <Link
                href={`/admin/products/${product._id}/edit`}
                className="block truncate text-sm font-medium text-brand-primary hover:underline"
              >
                {product.name.en}
              </Link>
              {product.sku && (
                <p className="truncate text-xs text-brand-text-secondary">
                  {product.sku}
                </p>
              )}
            </div>
          </div>
        );
      },
    },

    {
      id: "category",
      header: "Category",
      size: 160,
      enableSorting: false,
      meta: { label: "Category" },
      cell: ({ row }) => {
        const name = getCategoryName(row.original);
        return (
          <span className="truncate text-sm text-brand-text-secondary">
            {name}
          </span>
        );
      },
    },

    {
      accessorKey: "price",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Price" />
      ),
      size: 130,
      meta: { label: "Price" },
      cell: ({ row }) => {
        const { price, compareAtPrice } = row.original;
        const onSale =
          compareAtPrice !== null &&
          compareAtPrice !== undefined &&
          compareAtPrice > price;

        return (
          <div className="flex flex-col">
            <span className="text-sm font-medium text-brand-primary tabular-nums">
              {formatPrice(price)}
            </span>
            {onSale && (
              <span className="text-xs text-brand-text-secondary line-through tabular-nums">
                {formatPrice(compareAtPrice)}
              </span>
            )}
          </div>
        );
      },
    },

    {
      accessorKey: "stock",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Stock" />
      ),
      size: 120,
      meta: { label: "Stock" },
      cell: ({ row }) => {
        const stock = row.original.stock;
        const level = stockLevel(stock);
        const tone =
          level === "out"
            ? "border-destructive/30 bg-destructive/10 text-destructive"
            : level === "low"
              ? "border-amber-300 bg-amber-50 text-amber-700"
              : "border-brand-border bg-muted text-brand-text-secondary";
        return (
          <span
            className={cn(
              "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium tabular-nums",
              tone,
            )}
          >
            {stock}
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
      cell: ({ row }) => {
        const product = row.original;
        const archived = Boolean(product.deletedAt);

        if (archived) {
          return (
            <Badge
              variant="outline"
              className="border-brand-border text-brand-text-secondary"
            >
              Archived
            </Badge>
          );
        }
        if (product.isActive) {
          return (
            <Badge
              variant="outline"
              className="border-emerald-300 bg-emerald-50 text-emerald-700"
            >
              Active
            </Badge>
          );
        }
        return (
          <Badge
            variant="outline"
            className="border-brand-border text-brand-text-secondary"
          >
            Draft
          </Badge>
        );
      },
    },

    {
      accessorKey: "isFeatured",
      header: "Featured",
      size: 100,
      enableSorting: false,
      meta: { label: "Featured" },
      cell: ({ row }) =>
        row.original.isFeatured ? (
          <span className="text-xs font-medium text-brand-accent">★ Yes</span>
        ) : (
          <span className="text-xs text-brand-text-secondary">—</span>
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
        const product = row.original;
        const archived = Boolean(product.deletedAt);

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

            <DropdownMenuContent align="end" className="w-48">
              <div className="truncate px-2 py-1.5 text-xs font-medium text-brand-text-secondary">
                {product.name.en}
              </div>
              <DropdownMenuSeparator />

              <DropdownMenuItem onClick={() => actions.onEdit(product)}>
                <Pencil className="mr-2 h-3.5 w-3.5" aria-hidden="true" />
                Edit
              </DropdownMenuItem>

              {!archived && (
                <DropdownMenuItem onClick={() => actions.onArchive(product)}>
                  <Archive className="mr-2 h-3.5 w-3.5" aria-hidden="true" />
                  Archive
                </DropdownMenuItem>
              )}

              {archived && (
                <DropdownMenuItem onClick={() => actions.onRestore(product)}>
                  <ArchiveRestore
                    className="mr-2 h-3.5 w-3.5"
                    aria-hidden="true"
                  />
                  Restore
                </DropdownMenuItem>
              )}

              {archived && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => actions.onPermanentDelete(product)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="mr-2 h-3.5 w-3.5" aria-hidden="true" />
                    Delete forever
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}
