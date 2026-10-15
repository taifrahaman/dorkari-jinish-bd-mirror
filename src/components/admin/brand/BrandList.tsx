// src/components/admin/brand/BrandList.tsx

"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { SortingState } from "@tanstack/react-table";
import { Plus, Tag, Search } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { DataTable, DataTableToolbar } from "@/components/admin/data-table";
import { EmptyState } from "@/components/admin/empty-state";
import { PageHeader } from "@/components/admin/page-header";
import { cn } from "@/lib/utils";
import { getBrandColumns, type BrandColumnActions } from "./BrandColumns";
import { BrandDeleteDialog, type BrandDialogMode } from "./BrandDeleteDialog";
import { useBrands, useArchiveBrand, useRestoreBrand } from "@/hooks/admin";
import type { BrandResponse } from "@/lib/validations/brand.schema";

/* ============================================================
 * Component
 * ============================================================ */

export function BrandList() {
  const router = useRouter();

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [q, setQ] = useState("");
  const [includeArchived, setIncludeArchived] = useState(false);
  const [sorting, setSorting] = useState<SortingState>([
    { id: "name", desc: false },
  ]);

  const [dialog, setDialog] = useState<{
    brand: BrandResponse;
    mode: BrandDialogMode;
  } | null>(null);

  const sortBy = useMemo(() => {
    const first = sorting[0];
    if (!first) return "name" as const;
    const id =
      first.id === "name"
        ? "name"
        : (first.id as "name" | "createdAt" | "updatedAt");
    return id;
  }, [sorting]);

  const sortOrder = sorting[0]?.desc ? "desc" : "asc";

  const brandsQuery = useBrands({
    page,
    limit,
    q: q.trim() || undefined,
    sortBy,
    sortOrder,
    isActive: includeArchived ? undefined : true,
  });

  const brands = brandsQuery.data?.items ?? [];
  const total = brandsQuery.data?.total ?? 0;
  const totalPages = brandsQuery.data?.totalPages ?? 1;

  const archiveMutation = useArchiveBrand();
  const restoreMutation = useRestoreBrand();

  const columns = useMemo(
    () =>
      getBrandColumns({
        onEdit: (b) => router.push(`/admin/brands/${b._id}/edit`),
        onArchive: (b) => setDialog({ brand: b, mode: "archive" }),
        onRestore: (b) => setDialog({ brand: b, mode: "restore" }),
      } satisfies BrandColumnActions),
    [router],
  );

  const clearFilters = () => {
    setQ("");
    setIncludeArchived(false);
    setPage(1);
  };

  const handleConfirm = async (b: BrandResponse, mode: BrandDialogMode) => {
    try {
      if (mode === "archive") {
        await archiveMutation.mutateAsync(b._id);
      } else {
        await restoreMutation.mutateAsync(b._id);
      }
      setDialog(null);
    } catch {
      // Toast already shown by mutation hook
    }
  };

  const isPending = archiveMutation.isPending || restoreMutation.isPending;
  const isFiltered = Boolean(q.trim() || includeArchived);

  const emptyState = isFiltered ? (
    <EmptyState
      icon={Search}
      title="No brands match"
      description="Try a different search term or clear your filters."
      action={
        <Button variant="outline" onClick={clearFilters}>
          Clear filters
        </Button>
      }
    />
  ) : (
    <EmptyState
      icon={Tag}
      title="No brands yet"
      description="Add your first brand to start organizing products."
      action={
        <Link
          href="/admin/brands/new"
          className={cn(buttonVariants({ variant: "default" }))}
        >
          New brand
        </Link>
      }
    />
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Brands"
        description="Manage the brands your products belong to."
        breadcrumbs={[
          { label: "Dashboard", href: "/admin" },
          { label: "Brands" },
        ]}
        actions={
          <Link
            href="/admin/brands/new"
            className={cn(buttonVariants({ variant: "default" }))}
          >
            <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
            New brand
          </Link>
        }
      />

      <DataTable
        columns={columns}
        data={brands}
        isLoading={brandsQuery.isLoading}
        emptyState={emptyState}
        sorting={sorting}
        onSortingChange={setSorting}
        getRowId={(b) => b._id}
        pageIndex={page - 1}
        pageSize={limit}
        pageCount={totalPages}
        onPageChange={(p) => setPage(p + 1)}
        onPageSizeChange={(s) => {
          setLimit(s);
          setPage(1);
        }}
        onRowClick={(b) => router.push(`/admin/brands/${b._id}/edit`)}
        toolbar={(table) => (
          <DataTableToolbar
            table={table}
            search={{
              value: q,
              onChange: (v) => {
                setQ(v);
                setPage(1);
              },
              placeholder: "Search brands by name or slug…",
            }}
            filters={
              <Button
                type="button"
                variant={includeArchived ? "default" : "outline"}
                size="sm"
                className="h-9"
                onClick={() => {
                  setIncludeArchived((v) => !v);
                  setPage(1);
                }}
              >
                {includeArchived ? "Showing archived" : "Hide archived"}
              </Button>
            }
          />
        )}
      />

      <BrandDeleteDialog
        brand={dialog?.brand ?? null}
        mode={dialog?.mode ?? "archive"}
        onClose={() => setDialog(null)}
        onConfirm={handleConfirm}
        isPending={isPending}
      />
    </div>
  );
}

export default BrandList;
