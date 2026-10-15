// src/components/admin/customer/CustomerDetail.tsx

"use client";

import { useState } from "react";
import { Loader2, Mail, MapPin, Phone, User } from "lucide-react";
import { useCustomer, useCustomerStats } from "@/hooks/admin";
import { CustomerDetailHeader } from "./CustomerDetailHeader";
import { CustomerStatsCard } from "./CustomerStatsCard";
import { CustomerOrdersTable } from "./CustomerOrdersTable";
import {
  CustomerDeleteDialog,
  type CustomerDialogMode,
} from "./CustomerDeleteDialog";
import { formatDateTime } from "@/lib/admin/format";

/* ============================================================
 * Types
 * ============================================================ */

export type CustomerDetailProps = {
  customerId: string;
};

/* ============================================================
 * Component
 * ============================================================ */

export function CustomerDetail({ customerId }: CustomerDetailProps) {
  const customerQuery = useCustomer(customerId);
  const statsQuery = useCustomerStats(customerId);

  const [dialog, setDialog] = useState<CustomerDialogMode | null>(null);

  if (customerQuery.isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center gap-2 text-sm text-brand-text-secondary">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        Loading customer…
      </div>
    );
  }

  if (customerQuery.isError || !customerQuery.data) {
    return (
      <div
        role="alert"
        className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
      >
        {customerQuery.error instanceof Error
          ? customerQuery.error.message
          : "Failed to load this customer."}
      </div>
    );
  }

  const customer = customerQuery.data;

  return (
    <div className="space-y-6">
      <CustomerDetailHeader
        customer={customer}
        onArchive={() => setDialog("archive")}
        onRestore={() => setDialog("restore")}
      />

      <CustomerStatsCard
        stats={statsQuery.data}
        isLoading={statsQuery.isLoading}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <CustomerOrdersTable
          stats={statsQuery.data}
          customerId={customerId}
          isLoading={statsQuery.isLoading}
        />

        <div className="space-y-6">
          <ContactCard customer={customer} />
          {customer.notes && <NotesCard notes={customer.notes} />}
          <MetaCard customer={customer} />
        </div>
      </div>

      <CustomerDeleteDialog
        customer={dialog ? customer : null}
        mode={dialog ?? "archive"}
        onClose={() => setDialog(null)}
      />
    </div>
  );
}

export default CustomerDetail;

/* ============================================================
 * Contact card
 * ============================================================ */

function ContactCard({
  customer,
}: {
  customer: import("@/lib/validations/customer.schema").CustomerResponse;
}) {
  return (
    <div className="rounded-lg border border-brand-border bg-brand-surface p-5">
      <h2 className="font-heading text-sm font-semibold text-brand-primary">
        Contact
      </h2>
      <div className="mt-3 space-y-2 text-sm">
        <div className="flex items-start gap-2">
          <User
            className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-text-secondary"
            aria-hidden="true"
          />
          <span className="text-brand-primary">{customer.name}</span>
        </div>

        {customer.phone && (
          <div className="flex items-start gap-2">
            <Phone
              className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-text-secondary"
              aria-hidden="true"
            />
            <a
              href={`tel:${customer.phone}`}
              className="text-brand-primary hover:underline"
            >
              {customer.phone}
            </a>
          </div>
        )}

        {customer.email && (
          <div className="flex items-start gap-2">
            <Mail
              className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-text-secondary"
              aria-hidden="true"
            />
            <a
              href={`mailto:${customer.email}`}
              className="break-all text-brand-primary hover:underline"
            >
              {customer.email}
            </a>
          </div>
        )}

        {customer.address && (
          <div className="flex items-start gap-2 pt-1">
            <MapPin
              className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-text-secondary"
              aria-hidden="true"
            />
            <span className="whitespace-pre-line text-brand-text-secondary">
              {customer.address}
            </span>
          </div>
        )}

        {!customer.phone && !customer.email && !customer.address && (
          <p className="text-xs text-brand-text-secondary">
            No contact details recorded.
          </p>
        )}
      </div>
    </div>
  );
}

/* ============================================================
 * Notes card
 * ============================================================ */

function NotesCard({ notes }: { notes: string }) {
  return (
    <div className="rounded-lg border border-brand-border bg-brand-surface p-5">
      <h2 className="font-heading text-sm font-semibold text-brand-primary">
        Internal notes
      </h2>
      <p className="mt-2 whitespace-pre-line text-sm text-brand-text-secondary">
        {notes}
      </p>
    </div>
  );
}

/* ============================================================
 * Meta card
 * ============================================================ */

function MetaCard({
  customer,
}: {
  customer: import("@/lib/validations/customer.schema").CustomerResponse;
}) {
  return (
    <div className="rounded-lg border border-brand-border bg-brand-surface p-5 text-xs">
      <h2 className="mb-3 font-heading text-sm font-semibold text-brand-primary">
        Details
      </h2>
      <dl className="space-y-2">
        <div className="flex justify-between gap-2">
          <dt className="text-brand-text-secondary">Created</dt>
          <dd className="text-brand-text-secondary">
            {formatDateTime(customer.createdAt)}
          </dd>
        </div>
        {customer.lastLogin && (
          <div className="flex justify-between gap-2">
            <dt className="text-brand-text-secondary">Last login</dt>
            <dd className="text-brand-text-secondary">
              {formatDateTime(customer.lastLogin)}
            </dd>
          </div>
        )}
        <div className="flex justify-between gap-2">
          <dt className="text-brand-text-secondary">Type</dt>
          <dd className="text-brand-text-secondary">
            {customer.isShadow ? "Shadow" : "Registered"}
          </dd>
        </div>
      </dl>
    </div>
  );
}
