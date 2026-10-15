// src/components/admin/order/OrderColumns.tsx

"use client";

import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Eye, Archive, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataTableColumnHeader } from "@/components/admin/data-table";
import { OrderStatusBadge } from "./OrderStatusBadge";
import { OrderPaymentBadge } from "./OrderPaymentBadge";
import { cn } from "@/lib/utils";
import { formatPrice, formatRelative } from "@/lib/admin/format";
import { appFeatures } from "@/lib/table/features";
import type { OrderResponse } from "@/lib/validations/order.schema";

/* ============================================================
 * Types
 * ============================================================ */

export type OrderColumnActions = {
  onArchive: (order: OrderResponse) => void;
};

/* ============================================================
 * Helpers
 * ============================================================ */

function customerLabel(order: OrderResponse): string {
  if (order.customerSnapshot?.name) return order.customerSnapshot.name;
  if (order.guestName) return order.guestName;
  return "Walk-in customer";
}

function customerPhone(order: OrderResponse): string | null {
  return order.customerSnapshot?.phone ?? order.guestPhone ?? null;
}

function channelLabel(channel: OrderResponse["channel"]): string {
  switch (channel) {
    case "walk-in":
      return "Walk-in";
    case "pos":
      return "POS";
    case "online":
      return "Online";
    case "phone":
      return "Phone";
    case "facebook":
      return "Facebook";
    case "whatsapp":
      return "WhatsApp";
  }
}
/* ============================================================
 * Column factory
 * ============================================================ */

export function getOrderColumns(
  actions: OrderColumnActions,
): ColumnDef<typeof appFeatures, OrderResponse, unknown>[] {
  return [
    {
      accessorKey: "orderNumber",
      id: "order",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Order" />
      ),
      size: 180,
      enableHiding: false,
      meta: { label: "Order" },
      cell: ({ row }) => {
        const order = row.original;
        return (
          <Link
            href={`/admin/orders/${order._id}`}
            className="font-mono text-xs font-medium text-brand-primary hover:underline"
          >
            {order.orderNumber}
          </Link>
        );
      },
    },

    {
      id: "customer",
      header: "Customer",
      size: 220,
      enableSorting: false,
      meta: { label: "Customer" },
      cell: ({ row }) => {
        const order = row.original;
        const name = customerLabel(order);
        const phone = customerPhone(order);
        return (
          <div className="min-w-0">
            <p className="truncate text-sm text-brand-primary">{name}</p>
            {phone && (
              <p className="truncate text-xs text-brand-text-secondary">
                {phone}
              </p>
            )}
          </div>
        );
      },
    },

    {
      accessorKey: "channel",
      header: "Channel",
      size: 110,
      enableSorting: false,
      meta: { label: "Channel" },
      cell: ({ row }) => (
        <span className="text-xs text-brand-text-secondary">
          {channelLabel(row.original.channel)}
        </span>
      ),
    },

    {
      id: "items",
      header: "Items",
      size: 80,
      enableSorting: false,
      meta: { label: "Items" },
      cell: ({ row }) => (
        <span className="text-sm tabular-nums text-brand-text-secondary">
          {row.original.items.length}
        </span>
      ),
    },

    {
      accessorKey: "totalAmount",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Total" />
      ),
      size: 130,
      meta: { label: "Total" },
      cell: ({ row }) => (
        <span className="text-sm font-medium tabular-nums text-brand-primary">
          {formatPrice(row.original.totalAmount)}
        </span>
      ),
    },

    {
      accessorKey: "status",
      header: "Status",
      size: 120,
      enableSorting: false,
      meta: { label: "Status" },
      cell: ({ row }) => <OrderStatusBadge status={row.original.status} />,
    },

    {
      accessorKey: "paymentStatus",
      header: "Payment",
      size: 120,
      enableSorting: false,
      meta: { label: "Payment" },
      cell: ({ row }) => (
        <OrderPaymentBadge status={row.original.paymentStatus} />
      ),
    },

    {
      accessorKey: "orderDate",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Date" />
      ),
      size: 140,
      meta: { label: "Date" },
      cell: ({ row }) => (
        <span className="text-xs text-brand-text-secondary">
          {formatRelative(row.original.orderDate)}
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
        const order = row.original;

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
                <div className="truncate px-2 py-1.5 font-mono text-xs font-medium text-brand-text-secondary">
                  {order.orderNumber}
                </div>
                <DropdownMenuSeparator />

                <DropdownMenuItem
                  render={<Link href={`/admin/orders/${order._id}`} />}
                >
                  <Eye className="mr-2 h-3.5 w-3.5" aria-hidden="true" />
                  View details
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  onClick={() => actions.onArchive(order)}
                  className="text-destructive focus:text-destructive"
                >
                  <Archive className="mr-2 h-3.5 w-3.5" aria-hidden="true" />
                  Archive
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];
}
