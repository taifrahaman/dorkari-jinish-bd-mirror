// src/components/admin/customer/CustomerColumns.tsx

"use client";

import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import {
  Archive,
  ArchiveRestore,
  Eye,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataTableColumnHeader } from "@/components/admin/data-table";
import { CustomerSourceBadge } from "./CustomerSourceBadge";
import { CustomerStatusBadge } from "./CustomerStatusBadge";
import { cn } from "@/lib/utils";
import { formatNumber, formatPrice, formatRelative } from "@/lib/admin/format";
import { appFeatures } from "@/lib/table/features";
import type { CustomerResponse } from "@/lib/validations/customer.schema";

/* ============================================================
 * Types
 * ============================================================ */

export type CustomerColumnActions = {
  onEdit: (customer: CustomerResponse) => void;
  onArchive: (customer: CustomerResponse) => void;
  onRestore: (customer: CustomerResponse) => void;
  onPermanentDelete: (customer: CustomerResponse) => void;
};

/* ============================================================
 * Helpers
 * ============================================================ */

function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean).slice(0, 2);
  if (words.length === 0) return "?";
  return words.map((w) => w[0]!.toUpperCase()).join("");
}

/* ============================================================
 * Column factory
 * ============================================================ */

export function getCustomerColumns(
  actions: CustomerColumnActions,
): ColumnDef<typeof appFeatures, CustomerResponse, unknown>[] {
  return [
    {
      accessorKey: "name",
      id: "customer",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Customer" />
      ),
      size: 280,
      enableHiding: false,
      meta: { label: "Customer" },
      cell: ({ row }) => {
        const customer = row.original;
        return (
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-primary text-xs font-semibold text-white">
              {initials(customer.name)}
            </div>
            <div className="min-w-0">
              <Link
                href={`/admin/customers/${customer._id}`}
                className="block truncate text-sm font-medium text-brand-primary hover:underline"
              >
                {customer.name}
              </Link>
              {customer.phone && (
                <p className="truncate text-xs text-brand-text-secondary">
                  {customer.phone}
                </p>
              )}
            </div>
          </div>
        );
      },
    },

    {
      accessorKey: "email",
      header: "Email",
      size: 220,
      enableSorting: false,
      meta: { label: "Email" },
      cell: ({ row }) => (
        <span className="truncate text-xs text-brand-text-secondary">
          {row.original.email ?? "—"}
        </span>
      ),
    },

    {
      accessorKey: "source",
      header: "Source",
      size: 120,
      enableSorting: false,
      meta: { label: "Source" },
      cell: ({ row }) => <CustomerSourceBadge source={row.original.source} />,
    },

    {
      accessorKey: "orderCount",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Orders" />
      ),
      size: 90,
      meta: { label: "Orders" },
      cell: ({ row }) => (
        <span className="text-sm tabular-nums text-brand-text-secondary">
          {formatNumber(row.original.orderCount ?? 0)}
        </span>
      ),
    },

    {
      accessorKey: "lifetimeValue",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Lifetime value" />
      ),
      size: 150,
      meta: { label: "Lifetime value" },
      cell: ({ row }) => (
        <span className="text-sm font-medium tabular-nums text-brand-primary">
          {formatPrice(row.original.lifetimeValue ?? 0)}
        </span>
      ),
    },

    {
      id: "tags",
      header: "Tags",
      size: 180,
      enableSorting: false,
      meta: { label: "Tags" },
      cell: ({ row }) => {
        const tags = row.original.tags ?? [];
        if (tags.length === 0) {
          return <span className="text-xs text-brand-text-secondary">—</span>;
        }
        return (
          <div className="flex flex-wrap gap-1">
            {tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded-sm border border-brand-border bg-muted px-1.5 py-0.5 text-[10px] text-brand-text-secondary"
              >
                {tag}
              </span>
            ))}
            {tags.length > 3 && (
              <span className="text-[10px] text-brand-text-secondary">
                +{tags.length - 3}
              </span>
            )}
          </div>
        );
      },
    },

    {
      id: "status",
      header: "Status",
      size: 120,
      enableSorting: false,
      meta: { label: "Status" },
      cell: ({ row }) => (
        <CustomerStatusBadge
          status={row.original.status}
          archived={Boolean(row.original.deletedAt)}
        />
      ),
    },

    {
      accessorKey: "lastOrderAt",
      header: "Last order",
      size: 140,
      enableSorting: false,
      meta: { label: "Last order" },
      cell: ({ row }) => (
        <span className="text-xs text-brand-text-secondary">
          {row.original.lastOrderAt
            ? formatRelative(row.original.lastOrderAt)
            : "—"}
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
        const customer = row.original;
        const archived = Boolean(customer.deletedAt);

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

              <DropdownMenuContent align="end" className="w-48">
                <div className="truncate px-2 py-1.5 text-xs font-medium text-brand-text-secondary">
                  {customer.name}
                </div>
                <DropdownMenuSeparator />

                <DropdownMenuItem
                  render={<Link href={`/admin/customers/${customer._id}`} />}
                >
                  <Eye className="mr-2 h-3.5 w-3.5" aria-hidden="true" />
                  View details
                </DropdownMenuItem>

                <DropdownMenuItem onClick={() => actions.onEdit(customer)}>
                  <Pencil className="mr-2 h-3.5 w-3.5" aria-hidden="true" />
                  Edit
                </DropdownMenuItem>

                {!archived && (
                  <DropdownMenuItem onClick={() => actions.onArchive(customer)}>
                    <Archive className="mr-2 h-3.5 w-3.5" aria-hidden="true" />
                    Archive
                  </DropdownMenuItem>
                )}

                {archived && (
                  <DropdownMenuItem onClick={() => actions.onRestore(customer)}>
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
                      onClick={() => actions.onPermanentDelete(customer)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="mr-2 h-3.5 w-3.5" aria-hidden="true" />
                      Delete forever
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];
}
