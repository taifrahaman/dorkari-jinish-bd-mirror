// src/components/admin/customer/CustomerList.tsx

"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { SortingState } from "@tanstack/react-table";
import { Plus, Search, Users } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { DataTable, DataTableToolbar } from "@/components/admin/data-table";
import { EmptyState } from "@/components/admin/empty-state";
import { PageHeader } from "@/components/admin/page-header";
import {
  getCustomerColumns,
  type CustomerColumnActions,
} from "./CustomerColumns";
import { CustomerFilters, type CustomerFiltersValue } from "./CustomerFilters";
import {
  CustomerDeleteDialog,
  type CustomerDialogMode,
} from "./CustomerDeleteDialog";
import { useCustomers } from "@/hooks/admin";
import type { CustomerResponse } from "@/lib/validations/customer.schema";
import { cn } from "@/lib/utils";

/* ============================================================
 * Component
 * ============================================================ */

export function CustomerList() {
  const router = useRouter();

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [q, setQ] = useState("");
  const [filters, setFilters] = useState<CustomerFiltersValue>({});
  const [sorting, setSorting] = useState<SortingState>([
    { id: "customer", desc: false },
  ]);
  const [dialog, setDialog] = useState<{
    customer: CustomerResponse;
    mode: CustomerDialogMode;
  } | null>(null);

  const sortBy = useMemo(() => {
    const first = sorting[0];
    if (!first) return "createdAt" as const;
    return (first.id === "customer" ? "name" : first.id) as
      "name" | "createdAt" | "lastLogin" | "orderCount" | "lifetimeValue";
  }, [sorting]);

  const sortOrder = sorting[0]?.desc ? "desc" : "asc";

  const query = useCustomers({
    page,
    limit,
    q: q.trim() || undefined,
    sortBy,
    sortOrder,
    source: filters.source,
    status: filters.status,
    includeDeleted: filters.includeDeleted,
  });

  const customers = query.data?.items ?? [];
  const total = query.data?.total ?? 0;
  const totalPages = query.data?.totalPages ?? 1;

  const columns = useMemo(
    () =>
      getCustomerColumns({
        onEdit: (c) => router.push(`/admin/customers/${c._id}/edit`),
        onArchive: (c) => setDialog({ customer: c, mode: "archive" }),
        onRestore: (c) => setDialog({ customer: c, mode: "restore" }),
        onPermanentDelete: (c) =>
          setDialog({ customer: c, mode: "permanent-delete" }),
      } satisfies CustomerColumnActions),
    [router],
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
      title="No customers match"
      description="Try a different search term or clear your filters."
      action={
        <Button variant="outline" onClick={clearFilters}>
          Clear filters
        </Button>
      }
    />
  ) : (
    <EmptyState
      icon={Users}
      title="No customers yet"
      description="Customers are created automatically from POS sales, or you can add them manually."
      action={
        <Link
          href="/admin/customers/new"
          className={cn(buttonVariants({ variant: "default" }))}
        >
          New customer
        </Link>
      }
    />
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customers"
        description="Manage customers across POS, online, and social channels."
        breadcrumbs={[
          { label: "Dashboard", href: "/admin" },
          { label: "Customers" },
        ]}
        actions={
          <Link
            href="/admin/customers/new"
            className={cn(buttonVariants({ variant: "default" }))}
          >
            <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
            New customer
          </Link>
        }
      />

      <DataTable
        columns={columns}
        data={customers}
        isLoading={query.isLoading}
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
        onRowClick={(c) => router.push(`/admin/customers/${c._id}`)}
        toolbar={(table) => (
          <DataTableToolbar
            table={table}
            search={{
              value: q,
              onChange: (v) => {
                setQ(v);
                setPage(1);
              },
              placeholder: "Search by name, phone, or email…",
            }}
            filters={
              <CustomerFilters
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

      <CustomerDeleteDialog
        customer={dialog?.customer ?? null}
        mode={dialog?.mode ?? "archive"}
        onClose={() => setDialog(null)}
      />
    </div>
  );
}

export default CustomerList;
