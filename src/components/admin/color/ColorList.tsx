// src/components/admin/color/ColorList.tsx

"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { SortingState } from "@tanstack/react-table";
import { Palette, Plus, Search } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { DataTable, DataTableToolbar } from "@/components/admin/data-table";
import { EmptyState } from "@/components/admin/empty-state";
import { PageHeader } from "@/components/admin/page-header";
import { getColorColumns, type ColorColumnActions } from "./ColorColumns";
import { ColorDeleteDialog } from "./ColorDeleteDialog";
import { useColors } from "@/hooks/admin";
import type { ColorResponse } from "@/lib/validations/color.schema";
import { cn } from "@/lib/utils";

/* ============================================================
 * Component
 * ============================================================ */

export function ColorList() {
  const router = useRouter();

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [q, setQ] = useState("");
  const [sorting, setSorting] = useState<SortingState>([
    { id: "color", desc: false },
  ]);
  const [pendingDelete, setPendingDelete] = useState<ColorResponse | null>(
    null,
  );

  const sortBy = useMemo(() => {
    const first = sorting[0];
    if (!first) return "order" as const;
    return (first.id === "color" ? "name" : first.id) as
      "name" | "order" | "createdAt" | "updatedAt";
  }, [sorting]);

  const sortOrder = sorting[0]?.desc ? "desc" : "asc";

  const colorsQuery = useColors({
    page,
    limit,
    q: q.trim() || undefined,
    sortBy,
    sortOrder,
  });

  const colors = colorsQuery.data?.items ?? [];
  const total = colorsQuery.data?.total ?? 0;
  const totalPages = colorsQuery.data?.totalPages ?? 1;

  const columns = useMemo(
    () =>
      getColorColumns({
        onEdit: (c) => router.push(`/admin/colors/${c._id}/edit`),
        onDelete: (c) => setPendingDelete(c),
      } satisfies ColorColumnActions),
    [router],
  );

  const isFiltered = q.trim().length > 0;

  const emptyState = isFiltered ? (
    <EmptyState
      icon={Search}
      title="No colors match"
      description="Try a different search term."
      action={
        <Button variant="outline" onClick={() => setQ("")}>
          Clear search
        </Button>
      }
    />
  ) : (
    <EmptyState
      icon={Palette}
      title="No colors yet"
      description="Add colors once and reuse them across every product."
      action={
        <Link
          href="/admin/colors/new"
          className={cn(buttonVariants({ variant: "default" }))}
        >
          New color
        </Link>
      }
    />
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Colors"
        description="Reusable color library shared across all products."
        breadcrumbs={[
          { label: "Dashboard", href: "/admin" },
          { label: "Colors" },
        ]}
        actions={
          <Link
            href="/admin/colors/new"
            className={cn(buttonVariants({ variant: "default" }))}
          >
            <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
            New color
          </Link>
        }
      />

      <DataTable
        columns={columns}
        data={colors}
        isLoading={colorsQuery.isLoading}
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
        onRowClick={(c) => router.push(`/admin/colors/${c._id}/edit`)}
        toolbar={(table) => (
          <DataTableToolbar
            table={table}
            search={{
              value: q,
              onChange: (v) => {
                setQ(v);
                setPage(1);
              },
              placeholder: "Search colors…",
            }}
          />
        )}
      />

      <ColorDeleteDialog
        color={pendingDelete}
        onClose={() => setPendingDelete(null)}
      />
    </div>
  );
}

export default ColorList;
