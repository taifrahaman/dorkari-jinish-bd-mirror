// src/app/admin/(dashboard)/categories/[id]/edit/page.tsx

"use client";

import { use } from "react";
import { PageHeader } from "@/components/admin/page-header";
import { CategoryForm } from "@/components/admin/category";
import { useCategory, useCategoryTree } from "@/hooks/admin";
import { Skeleton } from "@/components/ui/skeleton";

/* ============================================================
 * Page
 * ============================================================ */

export default function EditCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const categoryQuery = useCategory(id);
  const treeQuery = useCategoryTree({
    includeInactive: true,
    includeDeleted: true,
  });

  if (categoryQuery.isLoading || treeQuery.isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-3">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-8 w-72" />
        </div>

        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="space-y-4 rounded-lg border border-brand-border bg-brand-surface p-6"
          >
            <Skeleton className="h-5 w-32" />
            <div className="grid gap-5 md:grid-cols-2">
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (categoryQuery.isError || !categoryQuery.data) {
    return (
      <div className="space-y-6">
        <PageHeader
          backHref="/admin/categories"
          title="Category not found"
          breadcrumbs={[
            { label: "Dashboard", href: "/admin" },
            { label: "Categories", href: "/admin/categories" },
            { label: "Not found" },
          ]}
        />

        <div
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {categoryQuery.error instanceof Error
            ? categoryQuery.error.message
            : "Failed to load this category."}
        </div>
      </div>
    );
  }

  const category = categoryQuery.data;

  return (
    <div className="space-y-6">
      <PageHeader
        backHref="/admin/categories"
        title={`Edit: ${category.name.en}`}
        description={category.path}
        breadcrumbs={[
          { label: "Dashboard", href: "/admin" },
          { label: "Categories", href: "/admin/categories" },
          { label: category.name.en },
        ]}
      />

      <CategoryForm category={category} tree={treeQuery.data ?? []} />
    </div>
  );
}
