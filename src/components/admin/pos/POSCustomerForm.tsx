// src/components/admin/pos/POSCustomerForm.tsx

"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { CustomerPicker } from "@/components/admin/customer/CustomerPicker";
import { POSChannelPicker } from "./POSChannelPicker";
import type { POSChannel, POSCustomer } from "@/lib/admin/pos/cart-store";

/* ============================================================
 * Types
 * ============================================================ */

export type POSCustomerFormProps = {
  customer: POSCustomer;
  onCustomerChange: (next: POSCustomer) => void;
  channel: POSChannel;
  onChannelChange: (next: POSChannel) => void;
  className?: string;
};

/* ============================================================
 * Component
 * ============================================================ */

export function POSCustomerForm({
  customer,
  onCustomerChange,
  channel,
  onChannelChange,
  className,
}: POSCustomerFormProps) {
  const [expanded, setExpanded] = useState(false);
  const hasDetails = Boolean(customer.name || customer.phone || customer.email);

  const displayName = customer.name ?? "Walk-in customer";

  return (
    <div
      data-pos-no-refocus
      className={cn(
        "rounded-lg border border-brand-border bg-brand-surface",
        className,
      )}
    >
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between gap-2 px-4 py-3"
      >
        <div className="flex min-w-0 items-center gap-2">
          <User
            className="h-3.5 w-3.5 shrink-0 text-brand-text-secondary"
            aria-hidden="true"
          />
          <span className="truncate text-sm font-medium text-brand-primary">
            {displayName}
          </span>
          {hasDetails && (
            <span className="shrink-0 rounded-full bg-brand-accent-light px-1.5 py-0.5 text-[10px] font-medium text-brand-primary">
              Saved
            </span>
          )}
        </div>
        {expanded ? (
          <ChevronUp
            className="h-3.5 w-3.5 shrink-0 text-brand-text-secondary"
            aria-hidden="true"
          />
        ) : (
          <ChevronDown
            className="h-3.5 w-3.5 shrink-0 text-brand-text-secondary"
            aria-hidden="true"
          />
        )}
      </button>

      {expanded && (
        <div className="space-y-4 border-t border-brand-border p-4">
          <POSChannelPicker value={channel} onChange={onChannelChange} />

          <div className="space-y-1.5">
            <p className="text-xs font-medium text-brand-text-secondary">
              Customer
            </p>
            <CustomerPicker
              value={{
                customerId: customer.customerId,
                name: customer.name,
                phone: customer.phone,
                email: customer.email,
              }}
              onChange={onCustomerChange}
              allowWalkIn
              placeholder="Search or add a customer…"
            />
            <p className="text-[11px] text-brand-text-secondary">
              Leave blank for an anonymous walk-in. Search by phone to link to
              an existing customer.
            </p>
          </div>

          {hasDetails && (
            <button
              type="button"
              onClick={() => onCustomerChange({})}
              className="text-xs text-brand-text-secondary underline-offset-2 hover:text-destructive hover:underline"
            >
              Clear customer
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default POSCustomerForm;
