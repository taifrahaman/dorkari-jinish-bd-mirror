// src/components/admin/category/CategoryTree.tsx

"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { FolderTree, Loader2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/admin/empty-state";
import { cn } from "@/lib/utils";
import { CategoryTreeNode } from "./CategoryTreeNode";
import type { CategoryTreeNode as CategoryTreeNodeType } from "@/lib/validations/category.schema";
import type { CategoryTreeNodeActions } from "./CategoryTreeNode";

/* ============================================================
 * Types
 * ============================================================ */

export type CategoryTreeProps = {
  tree: CategoryTreeNodeType[];
  isLoading?: boolean;
  actions: CategoryTreeNodeActions;
  onClearFilter?: () => void;
};

/* ============================================================
 * Filter — matches on en OR bn
 * ============================================================ */

function filterTree(
  nodes: CategoryTreeNodeType[],
  needle: string,
): CategoryTreeNodeType[] {
  const q = needle.trim().toLowerCase();
  if (!q) return nodes;

  function matches(node: CategoryTreeNodeType): boolean {
    return (
      node.name.en.toLowerCase().includes(q) ||
      node.name.bn.toLowerCase().includes(q) ||
      node.slug.toLowerCase().includes(q)
    );
  }

  function walk(list: CategoryTreeNodeType[]): CategoryTreeNodeType[] {
    const out: CategoryTreeNodeType[] = [];
    for (const node of list) {
      const children = walk(node.children ?? []);
      if (matches(node) || children.length > 0) {
        out.push({ ...node, children });
      }
    }
    return out;
  }

  return walk(nodes);
}

/* ============================================================
 * Component
 * ============================================================ */

export function CategoryTree({
  tree,
  isLoading = false,
  actions,
  onClearFilter,
}: CategoryTreeProps) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => filterTree(tree, search), [tree, search]);

  const hasAny = tree.length > 0;
  const hasFiltered = filtered.length > 0;

  if (isLoading && !hasAny) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-md border border-brand-border bg-brand-surface px-4 py-16 text-sm text-brand-text-secondary">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        Loading categories…
      </div>
    );
  }

  if (!hasAny) {
    return (
      <div className="rounded-md border border-brand-border bg-brand-surface">
        <EmptyState
          icon={FolderTree}
          title="No categories yet"
          description="Create your first category to start organizing products."
          action={
            <Link
              href="/admin/categories/new"
              className={cn(buttonVariants({ variant: "default" }))}
            >
              New category
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative max-w-sm">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-text-secondary"
          aria-hidden="true"
        />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search categories…"
          className="h-9 pl-9"
        />
      </div>

      <div className="rounded-md border border-brand-border bg-brand-surface p-2">
        {hasFiltered ? (
          filtered.map((node) => (
            <CategoryTreeNode
              key={node._id}
              node={node}
              depth={0}
              actions={actions}
            />
          ))
        ) : (
          <div className="px-4 py-12 text-center">
            <p className="text-sm text-brand-text-secondary">
              No categories match &ldquo;{search}&rdquo;.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearch("");
                onClearFilter?.();
              }}
              className="mt-2 text-sm text-brand-primary underline-offset-2 hover:underline"
            >
              Clear search
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default CategoryTree;
