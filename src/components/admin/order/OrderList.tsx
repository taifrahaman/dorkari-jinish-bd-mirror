// src/components/admin/order/OrderList.tsx

"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { SortingState } from "@tanstack/react-table";
import { Receipt, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable, DataTableToolbar } from "@/components/admin/data-table";
import { EmptyState } from "@/components/admin/empty-state";
import { PageHeader } from "@/components/admin/page-header";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { getOrderColumns, type OrderColumnActions } from "./OrderColumns";
import { OrderFilters, type OrderFiltersValue } from "./OrderFilters";
import { useOrders, useArchiveOrder } from "@/hooks/admin";
import type { OrderResponse } from "@/lib/validations/order.schema";

/* ============================================================
 * Component
 * ============================================================ */

export function OrderList() {
  const router = useRouter();

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [q, setQ] = useState("");
  const [filters, setFilters] = useState<OrderFiltersValue>({});
  const [sorting, setSorting] = useState<SortingState>([
    { id: "orderDate", desc: true },
  ]);
  const [pendingArchive, setPendingArchive] = useState<OrderResponse | null>(
    null,
  );

  const sortBy = useMemo(() => {
    const first = sorting[0];
    if (!first) return "orderDate" as const;
    return first.id as
      "orderDate" | "totalAmount" | "profitTotal" | "createdAt";
  }, [sorting]);

  const sortOrder = sorting[0]?.desc ? "desc" : "asc";

  const ordersQuery = useOrders({
    page,
    limit,
    q: q.trim() || undefined,
    sortBy,
    sortOrder,
    channel: filters.channel,
    status: filters.status,
    paymentStatus: filters.paymentStatus,
    includeDeleted: filters.includeDeleted,
  });

  const orders = ordersQuery.data?.items ?? [];
  const total = ordersQuery.data?.total ?? 0;
  const totalPages = ordersQuery.data?.totalPages ?? 1;

  const archiveMutation = useArchiveOrder();

  const columns = useMemo(
    () =>
      getOrderColumns({
        onArchive: (o) => setPendingArchive(o),
      } satisfies OrderColumnActions),
    [],
  );

  const clearFilters = () => {
    setFilters({});
    setQ("");
    setPage(1);
  };

  const isFiltered = Boolean(q.trim() || Object.keys(filters).length > 0);

  const emptyState = isFiltered ? (
    <EmptyState
      icon={Search}
      title="No orders match"
      description="Try a different search term or clear your filters."
      action={
        <Button variant="outline" onClick={clearFilters}>
          Clear filters
        </Button>
      }
    />
  ) : (
    <EmptyState
      icon={Receipt}
      title="No orders yet"
      description="Orders placed online or through the POS will appear here."
    />
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Orders"
        description="All sales across online storefront, POS, and phone orders."
        breadcrumbs={[
          { label: "Dashboard", href: "/admin" },
          { label: "Orders" },
        ]}
      />

      <DataTable
        columns={columns}
        data={orders}
        isLoading={ordersQuery.isLoading}
        emptyState={emptyState}
        sorting={sorting}
        onSortingChange={setSorting}
        pageIndex={page - 1}
        pageSize={limit}
        pageCount={totalPages}
        onPageChange={(p) => setPage(p + 1)}
        onPageSizeChange={(s) => {
          setLimit(s);
          setPage(1);
        }}
        onRowClick={(o) => router.push(`/admin/orders/${o._id}`)}
        toolbar={(table) => (
          <DataTableToolbar
            table={table}
            search={{
              value: q,
              onChange: (v) => {
                setQ(v);
                setPage(1);
              },
              placeholder: "Search by order #, name, or phone…",
            }}
            filters={
              <OrderFilters
                value={filters}
                onChange={(next) => {
                  setFilters(next);
                  setPage(1);
                }}
              />
            }
          />
        )}
      />

      <ConfirmDialog
        open={pendingArchive !== null}
        onOpenChange={(open) => {
          if (!open) setPendingArchive(null);
        }}
        title="Archive this order?"
        description={
          pendingArchive ? (
            <>
              Order <strong>{pendingArchive.orderNumber}</strong> will be hidden
              from the default list. You can include archived orders with the
              filter.
            </>
          ) : null
        }
        confirmLabel="Archive"
        onConfirm={async () => {
          if (pendingArchive) {
            await archiveMutation.mutateAsync(pendingArchive._id);
            setPendingArchive(null);
          }
        }}
      />
    </div>
  );
}

export default OrderList;
