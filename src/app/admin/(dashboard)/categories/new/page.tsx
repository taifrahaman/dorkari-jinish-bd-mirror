// src/app/admin/(dashboard)/categories/new/page.tsx

"use client";

import { PageHeader } from "@/components/admin/page-header";
import { CategoryForm } from "@/components/admin/category";
import { useCategoryTree } from "@/hooks/admin";

/* ============================================================
 * Page
 * ============================================================ */

export default function NewCategoryPage() {
  const treeQuery = useCategoryTree({ includeInactive: true });

  return (
    <div className="space-y-6">
      <PageHeader
        backHref="/admin/categories"
        title="New category"
        description="Add a new category to your catalog."
        breadcrumbs={[
          { label: "Dashboard", href: "/admin" },
          { label: "Categories", href: "/admin/categories" },
          { label: "New" },
        ]}
      />

      <CategoryForm tree={treeQuery.data ?? []} />
    </div>
  );
}
