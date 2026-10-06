// src/app/admin/(dashboard)/products/new/page.tsx

"use client";

import { useMemo } from "react";
import { PageHeader } from "@/components/admin/page-header";
import { ProductForm } from "@/components/admin/product";
import { useCategoryTree } from "@/hooks/admin";
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

export default function NewProductPage() {
  const treeQuery = useCategoryTree();

  const categories = useMemo(
    () => flattenTree(treeQuery.data ?? []),
    [treeQuery.data],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        backHref="/admin/products"
        title="New product"
        description="Add a single product to your catalog."
        breadcrumbs={[
          { label: "Dashboard", href: "/admin" },
          { label: "Products", href: "/admin/products" },
          { label: "New" },
        ]}
      />

      <ProductForm categories={categories} />
    </div>
  );
}
