// src/components/admin/customer/CustomerFilters.tsx

"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type {
  CustomerSource,
  CustomerStatus,
} from "@/lib/validations/customer.schema";

/* ============================================================
 * Types
 * ============================================================ */

export type CustomerFiltersValue = {
  source?: CustomerSource;
  status?: CustomerStatus;
  includeDeleted?: boolean;
};

export type CustomerFiltersProps = {
  value: CustomerFiltersValue;
  onChange: (next: CustomerFiltersValue) => void;
  className?: string;
};

/* ============================================================
 * Options
 * ============================================================ */

const SOURCES: Array<{ value: CustomerSource; label: string }> = [
  { value: "online", label: "Online" },
  { value: "google", label: "Google" },
  { value: "walk-in", label: "Walk-in" },
  { value: "phone", label: "Phone" },
  { value: "facebook", label: "Facebook" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "manual", label: "Manual" },
  { value: "import", label: "Import" },
];

const STATUSES: Array<{ value: CustomerStatus; label: string }> = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

/* ============================================================
 * Helpers
 * ============================================================ */

function hasAny(v: CustomerFiltersValue): boolean {
  return Boolean(
    v.source ||
    v.status ||
    (v.includeDeleted !== undefined && v.includeDeleted),
  );
}

/* ============================================================
 * Component
 * ============================================================ */

export function CustomerFilters({
  value,
  onChange,
  className,
}: CustomerFiltersProps) {
  const clearAll = () => onChange({});

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {/* Source */}
      <Select
        value={value.source ?? "any"}
        onValueChange={(v) =>
          onChange({
            ...value,
            source: v === "any" ? undefined : (v as CustomerSource),
          })
        }
      >
        <SelectTrigger className="h-9 w-[150px]" aria-label="Source">
          <SelectValue placeholder="Any source" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="any">Any source</SelectItem>
          {SOURCES.map((s) => (
            <SelectItem key={s.value} value={s.value}>
              {s.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Status */}
      <Select
        value={value.status ?? "any"}
        onValueChange={(v) =>
          onChange({
            ...value,
            status: v === "any" ? undefined : (v as CustomerStatus),
          })
        }
      >
        <SelectTrigger className="h-9 w-[140px]" aria-label="Status">
          <SelectValue placeholder="Any status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="any">Any status</SelectItem>
          {STATUSES.map((s) => (
            <SelectItem key={s.value} value={s.value}>
              {s.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Archived */}
      <Select
        value={value.includeDeleted ? "with" : "without"}
        onValueChange={(v) =>
          onChange({ ...value, includeDeleted: v === "with" })
        }
      >
        <SelectTrigger
          className="h-9 w-[160px]"
          aria-label="Archived customers"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="without">Hide archived</SelectItem>
          <SelectItem value="with">Include archived</SelectItem>
        </SelectContent>
      </Select>

      {hasAny(value) && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={clearAll}
          className="h-9 px-2 text-xs text-brand-text-secondary hover:text-brand-primary"
        >
          <X className="mr-1 h-3 w-3" aria-hidden="true" />
          Clear
        </Button>
      )}
    </div>
  );
}

export default CustomerFilters;
