// src/app/admin/(dashboard)/products/import/page.tsx

import { PageHeader } from "@/components/admin/page-header";
import { ImportWizard } from "@/components/admin/product-import";

export default function ImportProductsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        backHref="/admin/products"
        title="Import products"
        description="Bulk-create products from a CSV file and match images visually."
        breadcrumbs={[
          { label: "Dashboard", href: "/admin" },
          { label: "Products", href: "/admin/products" },
          { label: "Import" },
        ]}
      />

      <ImportWizard />
    </div>
  );
}
