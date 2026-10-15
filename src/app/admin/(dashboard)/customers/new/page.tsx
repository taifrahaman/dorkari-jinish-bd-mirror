// src/app/admin/(dashboard)/customers/new/page.tsx

import { PageHeader } from "@/components/admin/page-header";
import { CustomerForm } from "@/components/admin/customer";

export default function NewCustomerPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        backHref="/admin/customers"
        title="New customer"
        description="Add a customer manually."
        breadcrumbs={[
          { label: "Dashboard", href: "/admin" },
          { label: "Customers", href: "/admin/customers" },
          { label: "New" },
        ]}
      />

      <CustomerForm />
    </div>
  );
}
