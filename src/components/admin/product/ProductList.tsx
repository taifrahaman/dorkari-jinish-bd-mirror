// src/components/admin/product/ProductList.tsx

"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { SortingState, RowSelectionState } from "@tanstack/react-table";
import { Download, Plus, Upload, Package, Search } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { DataTable, DataTableToolbar } from "@/components/admin/data-table";
import { EmptyState } from "@/components/admin/empty-state";
import { PageHeader } from "@/components/admin/page-header";
import { getProductColumns, type ProductColumnActions } from "./ProductColumns";
import { ProductFilters, type ProductFiltersValue } from "./ProductFilters";
import { ProductBulkActions } from "./ProductBulkActions";
import {
  ProductDeleteDialog,
  type ProductDialogMode,
} from "./ProductDeleteDialog";
import { useProducts, useCategoryTree, useExportProducts } from "@/hooks/admin";
import type { ProductResponse } from "@/lib/validations/product.schema";
import type { CategoryTreeNode } from "@/lib/validations/category.schema";
import { cn } from "@/lib/utils";

/* ============================================================
 * Component
 * ============================================================ */

export function ProductList() {
  const router = useRouter();

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [q, setQ] = useState("");
  const [filters, setFilters] = useState<ProductFiltersValue>({});
  const [sorting, setSorting] = useState<SortingState>([
    { id: "updatedAt", desc: true },
  ]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const [dialog, setDialog] = useState<{
    product: ProductResponse;
    mode: ProductDialogMode;
  } | null>(null);

  const sortBy = useMemo(() => {
    const first = sorting[0];
    if (!first) return "updatedAt" as const;
    return (first.id === "product" ? "name" : first.id) as
      "name" | "price" | "stock" | "createdAt" | "updatedAt" | "averageRating";
  }, [sorting]);

  const sortOrder = sorting[0]?.desc ? "desc" : "asc";

  const productsQuery = useProducts({
    page,
    limit,
    q: q.trim() || undefined,
    sortBy,
    sortOrder,
    category: filters.category,
    stockStatus: filters.stockStatus,
    isActive: filters.isActive,
    isFeatured: filters.isFeatured,
    includeDeleted: filters.includeDeleted,
  });

  const products = productsQuery.data?.items ?? [];
  const total = productsQuery.data?.total ?? 0;
  const totalPages = productsQuery.data?.totalPages ?? 1;

  const treeQuery = useCategoryTree();
  const categories = useMemo(
    () => flattenTree(treeQuery.data ?? []),
    [treeQuery.data],
  );

  const columns = useMemo(
    () =>
      getProductColumns({
        onEdit: (p) => router.push(`/admin/products/${p._id}/edit`),
        onArchive: (p) => setDialog({ product: p, mode: "archive" }),
        onRestore: (p) => setDialog({ product: p, mode: "restore" }),
        onPermanentDelete: (p) =>
          setDialog({ product: p, mode: "permanent-delete" }),
      } satisfies ProductColumnActions),
    [router],
  );

  const clearFilters = () => {
    setFilters({});
    setQ("");
    setPage(1);
  };

  const exportMutation = useExportProducts();

  const handleExportAll = () => {
    exportMutation.mutate({ format: "csv" });
  };

  const handleFilterChange = (next: ProductFiltersValue) => {
    setFilters(next);
    setPage(1);
  };

  const handleSearchChange = (next: string) => {
    setQ(next);
    setPage(1);
  };

  const handlePageSizeChange = (size: number) => {
    setLimit(size);
    setPage(1);
  };

  const isFiltered = Boolean(q.trim() || Object.keys(filters).length > 0);

  const emptyState = isFiltered ? (
    <EmptyState
      icon={Search}
      title="No products match"
      description="Try a different search term or clear your filters."
      action={
        <Button variant="outline" onClick={clearFilters}>
          Clear filters
        </Button>
      }
    />
  ) : (
    <EmptyState
      icon={Package}
      title="No products yet"
      description="Add your first product or import a batch from CSV."
      action={
        <div className="flex gap-2">
          <Link
            href="/admin/products/import"
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Import from CSV
          </Link>
          <Link
            href="/admin/products/new"
            className={cn(buttonVariants({ variant: "default" }))}
          >
            New product
          </Link>
        </div>
      }
    />
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Products"
        description="Manage your store's product catalog."
        breadcrumbs={[
          { label: "Dashboard", href: "/admin" },
          { label: "Products" },
        ]}
        actions={
          <>
            <Button
              type="button"
              variant="outline"
              onClick={handleExportAll}
              disabled={exportMutation.isPending || total === 0}
            >
              <Download className="mr-2 h-4 w-4" aria-hidden="true" />
              Export
            </Button>

            <Link
              href="/admin/products/import"
              className={cn(buttonVariants({ variant: "outline" }))}
            >
              <Upload className="mr-2 h-4 w-4" aria-hidden="true" />
              Import
            </Link>

            <Link
              href="/admin/products/new"
              className={cn(buttonVariants({ variant: "default" }))}
            >
              <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
              New product
            </Link>
          </>
        }
      />

      <DataTable
        columns={columns}
        data={products}
        isLoading={productsQuery.isLoading}
        emptyState={emptyState}
        sorting={sorting}
        onSortingChange={setSorting}
        enableRowSelection
        getRowId={(p) => p._id}
        rowSelection={rowSelection}
        onRowSelectionChange={setRowSelection}
        pageIndex={page - 1}
        pageSize={limit}
        pageCount={totalPages}
        onPageChange={(p) => setPage(p + 1)}
        onPageSizeChange={handlePageSizeChange}
        onRowClick={(p) => router.push(`/admin/products/${p._id}/edit`)}
        toolbar={(table) => (
          <DataTableToolbar
            table={table}
            search={{
              value: q,
              onChange: handleSearchChange,
              placeholder: "Search products by name or SKU…",
            }}
            filters={
              <ProductFilters
                value={filters}
                onChange={handleFilterChange}
                categories={categories}
              />
            }
          />
        )}
        bulkBar={(rows) => (
          <ProductBulkActions
            rows={rows}
            onClearSelection={() => setRowSelection({})}
          />
        )}
      />

      <ProductDeleteDialog
        product={dialog?.product ?? null}
        mode={dialog?.mode ?? "archive"}
        onClose={() => setDialog(null)}
      />
    </div>
  );
}

export default ProductList;

/* ============================================================
 * Helpers
 * ============================================================ */

function flattenTree(nodes: CategoryTreeNode[]): Array<{
  _id: string;
  name: string;
  path?: string;
  specTemplate?: string[];
}> {
  const out: Array<{
    _id: string;
    name: string;
    path?: string;
    specTemplate?: string[];
  }> = [];

  function walk(list: CategoryTreeNode[]) {
    for (const node of list) {
      out.push({
        _id: node._id,
        name: node.name.en,
        path: node.path,
        specTemplate: node.specTemplate,
      });
      if (node.children && node.children.length > 0) {
        walk(node.children);
      }
    }
  }

  walk(nodes);
  return out;
}
