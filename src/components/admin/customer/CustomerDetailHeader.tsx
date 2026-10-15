// src/components/admin/customer/CustomerDetailHeader.tsx

"use client";

import Link from "next/link";
import { Archive, ArchiveRestore, Pencil, Phone, Mail } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/admin/page-header";
import { CustomerSourceBadge } from "./CustomerSourceBadge";
import { CustomerStatusBadge } from "./CustomerStatusBadge";
import { cn } from "@/lib/utils";
import type { CustomerResponse } from "@/lib/validations/customer.schema";

/* ============================================================
 * Types
 * ============================================================ */

export type CustomerDetailHeaderProps = {
  customer: CustomerResponse;
  onArchive?: () => void;
  onRestore?: () => void;
};

/* ============================================================
 * Helpers
 * ============================================================ */

function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean).slice(0, 2);
  if (words.length === 0) return "?";
  return words.map((w) => w[0]!.toUpperCase()).join("");
}

/* ============================================================
 * Component
 * ============================================================ */

export function CustomerDetailHeader({
  customer,
  onArchive,
  onRestore,
}: CustomerDetailHeaderProps) {
  const archived = Boolean(customer.deletedAt);

  return (
    <PageHeader
      backHref="/admin/customers"
      title={customer.name}
      breadcrumbs={[
        { label: "Dashboard", href: "/admin" },
        { label: "Customers", href: "/admin/customers" },
        { label: customer.name },
      ]}
      actions={
        <>
          {!archived && (
            <Link
              href={`/admin/customers/${customer._id}/edit`}
              className={cn(buttonVariants({ variant: "outline" }))}
            >
              <Pencil className="mr-2 h-4 w-4" aria-hidden="true" />
              Edit
            </Link>
          )}

          {archived && onRestore && (
            <Button type="button" variant="outline" onClick={onRestore}>
              <ArchiveRestore className="mr-2 h-4 w-4" aria-hidden="true" />
              Restore
            </Button>
          )}

          {!archived && onArchive && (
            <Button type="button" variant="outline" onClick={onArchive}>
              <Archive className="mr-2 h-4 w-4" aria-hidden="true" />
              Archive
            </Button>
          )}
        </>
      }
    >
      <div className="flex flex-wrap items-center gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-primary text-sm font-semibold text-white">
          {initials(customer.name)}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <CustomerSourceBadge source={customer.source} />
          <CustomerStatusBadge status={customer.status} archived={archived} />

          {customer.phone && (
            <a
              href={`tel:${customer.phone}`}
              className="inline-flex items-center gap-1.5 rounded-md border border-brand-border bg-muted/40 px-2 py-0.5 text-xs text-brand-text-secondary transition-colors hover:bg-muted"
            >
              <Phone className="h-3 w-3" aria-hidden="true" />
              {customer.phone}
            </a>
          )}

          {customer.email && (
            <a
              href={`mailto:${customer.email}`}
              className="inline-flex items-center gap-1.5 rounded-md border border-brand-border bg-muted/40 px-2 py-0.5 text-xs text-brand-text-secondary transition-colors hover:bg-muted"
            >
              <Mail className="h-3 w-3" aria-hidden="true" />
              {customer.email}
            </a>
          )}

          {customer.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-sm border border-brand-border bg-muted px-1.5 py-0.5 text-[10px] text-brand-text-secondary"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </PageHeader>
  );
}

export default CustomerDetailHeader;
