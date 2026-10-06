// src/app/admin/(dashboard)/products/[id]/edit/page.tsx

"use client";

import { use, useMemo } from "react";
import { PageHeader } from "@/components/admin/page-header";
import { ProductForm } from "@/components/admin/product";
import { useCategoryTree, useProduct } from "@/hooks/admin";
import { Skeleton } from "@/components/ui/skeleton";
import type { CategoryTreeNode } from "@/lib/validations/category.schema";
import type { CategoryOption } from "@/components/admin/category-combobox";

/* ============================================================
 * Helpers
 * ============================================================ */

function flattenTree(nodes: CategoryTreeNode[]): CategoryOption[] {
  const out: CategoryOption[] = [];

  function walk(list: CategoryTreeNode[]) {
    for (const node of list) {
      out.push({
        _id: node._id,
        name: node.name.en,
        path: node.path,
        specTemplate: node.specTemplate,
      });
      if (node.children && node.children.length > 0) walk(node.children);
    }
  }

  walk(nodes);
  return out;
}

/* ============================================================
 * Page
 * ============================================================ */

export default function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const productQuery = useProduct(id);
  const treeQuery = useCategoryTree();

  const categories = useMemo(
    () => flattenTree(treeQuery.data ?? []),
    [treeQuery.data],
  );

  if (productQuery.isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-3">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-8 w-72" />
          <Skeleton className="h-4 w-96" />
        </div>

        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="space-y-4 rounded-lg border border-brand-border bg-brand-surface p-6"
          >
            <Skeleton className="h-5 w-32" />
            <div className="grid gap-5 md:grid-cols-2">
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (productQuery.isError || !productQuery.data) {
    return (
      <div className="space-y-6">
        <PageHeader
          backHref="/admin/products"
          title="Product not found"
          breadcrumbs={[
            { label: "Dashboard", href: "/admin" },
            { label: "Products", href: "/admin/products" },
            { label: "Not found" },
          ]}
        />

        <div
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {productQuery.error instanceof Error
            ? productQuery.error.message
            : "Failed to load this product. It may have been deleted."}
        </div>
      </div>
    );
  }

  const product = productQuery.data;

  return (
    <div className="space-y-6">
      <PageHeader
        backHref="/admin/products"
        title={`Edit: ${product.name.en}`}
        description={product.sku ? `SKU ${product.sku}` : undefined}
        breadcrumbs={[
          { label: "Dashboard", href: "/admin" },
          { label: "Products", href: "/admin/products" },
          { label: product.name.en },
        ]}
      />

      <ProductForm product={product} categories={categories} />
    </div>
  );
}
