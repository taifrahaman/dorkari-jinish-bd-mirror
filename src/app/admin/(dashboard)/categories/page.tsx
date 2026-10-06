// src/app/admin/(dashboard)/categories/page.tsx

"use client";

import { useState } from "react";
import Link from "next/link";
import { FolderTree, Plus, RefreshCw } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { PageHeader } from "@/components/admin/page-header";
import {
  CategoryTree,
  CategoryDeleteDialog,
  type CategoryDialogMode,
} from "@/components/admin/category";
import { useCategoryTree } from "@/hooks/admin";
import { cn } from "@/lib/utils";
import type { CategoryTreeNode as CategoryTreeNodeType } from "@/lib/validations/category.schema";

/* ============================================================
 * Helpers
 * ============================================================ */

function countDescendants(node: CategoryTreeNodeType): number {
  let count = 0;
  for (const child of node.children ?? []) {
    count += 1 + countDescendants(child);
  }
  return count;
}

function countProducts(node: CategoryTreeNodeType): number {
  let count = node.productCount ?? 0;
  for (const child of node.children ?? []) {
    count += countProducts(child);
  }
  return count;
}

/* ============================================================
 * Page
 * ============================================================ */

export default function CategoriesPage() {
  const treeQuery = useCategoryTree({
    includeInactive: true,
    includeDeleted: true,
  });

  const [dialog, setDialog] = useState<{
    node: CategoryTreeNodeType;
    mode: CategoryDialogMode;
  } | null>(null);

  const tree = treeQuery.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Categories"
        description="Organize products into a tree of categories."
        breadcrumbs={[
          { label: "Dashboard", href: "/admin" },
          { label: "Categories" },
        ]}
        actions={
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => treeQuery.refetch()}
              disabled={treeQuery.isFetching}
            >
              <RefreshCw
                className={cn(
                  "mr-2 h-4 w-4",
                  treeQuery.isFetching && "animate-spin",
                )}
                aria-hidden="true"
              />
              Refresh
            </Button>

            <Link
              href="/admin/categories/new"
              className={cn(buttonVariants({ variant: "default" }))}
            >
              <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
              New category
            </Link>
          </>
        }
      />

      <CategoryTree
        tree={tree}
        isLoading={treeQuery.isLoading}
        actions={{
          onArchive: (node) => setDialog({ node, mode: "archive" }),
          onRestore: (node) => setDialog({ node, mode: "restore" }),
          onPermanentDelete: (node) =>
            setDialog({ node, mode: "permanent-delete" }),
        }}
      />

      <CategoryDeleteDialog
        category={dialog?.node ?? null}
        mode={dialog?.mode ?? "archive"}
        descendantCount={
          dialog?.mode === "archive" || dialog?.mode === "restore"
            ? countDescendants(dialog.node)
            : dialog?.mode === "permanent-delete"
              ? countDescendants(dialog.node)
              : 0
        }
        productCount={
          dialog?.mode === "permanent-delete" && dialog.node
            ? countProducts(dialog.node)
            : 0
        }
        onClose={() => setDialog(null)}
      />
    </div>
  );
}
