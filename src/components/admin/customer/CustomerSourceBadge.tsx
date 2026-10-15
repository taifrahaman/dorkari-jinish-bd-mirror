// src/components/admin/customer/CustomerSourceBadge.tsx

"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { CustomerSource } from "@/lib/validations/customer.schema";

/* ============================================================
 * Config
 * ============================================================ */

const TONES: Record<CustomerSource, string> = {
  online: "border-blue-300 bg-blue-50 text-blue-700",
  google: "border-red-300 bg-red-50 text-red-700",
  "walk-in": "border-slate-300 bg-slate-50 text-slate-700",
  phone: "border-indigo-300 bg-indigo-50 text-indigo-700",
  facebook: "border-blue-400 bg-blue-50 text-blue-800",
  whatsapp: "border-emerald-300 bg-emerald-50 text-emerald-700",
  manual: "border-brand-border bg-muted text-brand-text-secondary",
  import: "border-violet-300 bg-violet-50 text-violet-700",
};

const LABELS: Record<CustomerSource, string> = {
  online: "Online",
  google: "Google",
  "walk-in": "Walk-in",
  phone: "Phone",
  facebook: "Facebook",
  whatsapp: "WhatsApp",
  manual: "Manual",
  import: "Import",
};

/* ============================================================
 * Component
 * ============================================================ */

export function CustomerSourceBadge({
  source,
  className,
}: {
  source: CustomerSource;
  className?: string;
}) {
  return (
    <Badge
      variant="outline"
      className={cn("font-medium", TONES[source], className)}
    >
      {LABELS[source]}
    </Badge>
  );
}

export default CustomerSourceBadge;
