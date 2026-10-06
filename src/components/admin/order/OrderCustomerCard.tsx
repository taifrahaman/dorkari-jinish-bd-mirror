// src/components/admin/order/OrderCustomerCard.tsx

"use client";

import { Mail, MapPin, Phone, User } from "lucide-react";
import { cn } from "@/lib/utils";
import type { OrderResponse } from "@/lib/validations/order.schema";

/* ============================================================
 * Types
 * ============================================================ */

export type OrderCustomerCardProps = {
  order: OrderResponse;
  className?: string;
};

/* ============================================================
 * Helpers
 * ============================================================ */

function pickName(order: OrderResponse): string {
  if (order.customerSnapshot?.name) return order.customerSnapshot.name;
  if (order.guestName) return order.guestName;
  return "Walk-in customer";
}

function pickPhone(order: OrderResponse): string | null {
  return order.customerSnapshot?.phone ?? order.guestPhone ?? null;
}

function pickEmail(order: OrderResponse): string | null {
  return order.customerSnapshot?.email ?? order.guestEmail ?? null;
}

/* ============================================================
 * Component
 * ============================================================ */

export function OrderCustomerCard({
  order,
  className,
}: OrderCustomerCardProps) {
  const name = pickName(order);
  const phone = pickPhone(order);
  const email = pickEmail(order);
  const hasAny = phone || email || order.shippingAddress;

  return (
    <div
      className={cn(
        "rounded-lg border border-brand-border bg-brand-surface p-5",
        className,
      )}
    >
      <h2 className="font-heading text-sm font-semibold text-brand-primary">
        Customer
      </h2>

      <div className="mt-3 space-y-2 text-sm">
        <div className="flex items-start gap-2">
          <User
            className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-text-secondary"
            aria-hidden="true"
          />
          <span className="text-brand-primary">{name}</span>
        </div>

        {phone && (
          <div className="flex items-start gap-2">
            <Phone
              className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-text-secondary"
              aria-hidden="true"
            />
            <a
              href={`tel:${phone}`}
              className="text-brand-primary hover:underline"
            >
              {phone}
            </a>
          </div>
        )}

        {email && (
          <div className="flex items-start gap-2">
            <Mail
              className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-text-secondary"
              aria-hidden="true"
            />
            <a
              href={`mailto:${email}`}
              className="break-all text-brand-primary hover:underline"
            >
              {email}
            </a>
          </div>
        )}

        {order.shippingAddress && (
          <div className="flex items-start gap-2 pt-1">
            <MapPin
              className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-text-secondary"
              aria-hidden="true"
            />
            <span className="whitespace-pre-line text-brand-text-secondary">
              {order.shippingAddress}
            </span>
          </div>
        )}

        {!hasAny && (
          <p className="text-xs text-brand-text-secondary">
            No contact details recorded.
          </p>
        )}
      </div>
    </div>
  );
}

export default OrderCustomerCard;
