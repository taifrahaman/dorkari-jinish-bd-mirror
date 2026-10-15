// src/app/admin/(dashboard)/customers/[id]/edit/page.tsx

"use client";

import { use } from "react";
import { PageHeader } from "@/components/admin/page-header";
import { CustomerForm } from "@/components/admin/customer";
import { useCustomer } from "@/hooks/admin";
import { Skeleton } from "@/components/ui/skeleton";

export default function EditCustomerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const query = useCustomer(id);

  if (query.isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-3">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-8 w-72" />
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
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (query.isError || !query.data) {
    return (
      <div className="space-y-6">
        <PageHeader
          backHref="/admin/customers"
          title="Customer not found"
          breadcrumbs={[
            { label: "Dashboard", href: "/admin" },
            { label: "Customers", href: "/admin/customers" },
            { label: "Not found" },
          ]}
        />
        <div
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {query.error instanceof Error
            ? query.error.message
            : "Failed to load this customer."}
        </div>
      </div>
    );
  }

  const customer = query.data;

  return (
    <div className="space-y-6">
      <PageHeader
        backHref="/admin/customers"
        title={`Edit: ${customer.name}`}
        description={customer.phone ?? customer.email}
        breadcrumbs={[
          { label: "Dashboard", href: "/admin" },
          { label: "Customers", href: "/admin/customers" },
          { label: customer.name },
        ]}
      />

      <CustomerForm customer={customer} />
    </div>
  );
}
