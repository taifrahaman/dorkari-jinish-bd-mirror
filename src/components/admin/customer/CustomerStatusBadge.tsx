// src/components/admin/customer/CustomerStatusBadge.tsx

"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { CustomerStatus } from "@/lib/validations/customer.schema";

/* ============================================================
 * Component
 * ============================================================ */

export function CustomerStatusBadge({
  status,
  archived = false,
  className,
}: {
  status: CustomerStatus;
  archived?: boolean;
  className?: string;
}) {
  if (archived) {
    return (
      <Badge
        variant="outline"
        className={cn(
          "border-brand-border bg-muted text-brand-text-secondary",
          className,
        )}
      >
        Archived
      </Badge>
    );
  }

  const tone =
    status === "active"
      ? "border-emerald-300 bg-emerald-50 text-emerald-700"
      : "border-brand-border bg-muted text-brand-text-secondary";

  return (
    <Badge variant="outline" className={cn("font-medium", tone, className)}>
      {status === "active" ? "Active" : "Inactive"}
    </Badge>
  );
}

export default CustomerStatusBadge;
