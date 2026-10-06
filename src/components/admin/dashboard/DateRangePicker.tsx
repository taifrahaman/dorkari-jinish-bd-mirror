// src/components/admin/dashboard/DateRangePicker.tsx

"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ANALYTICS_RANGES, type AnalyticsRange } from "@/lib/admin/analytics";
import { cn } from "@/lib/utils";

/* ============================================================
 * Types
 * ============================================================ */

export type DateRangePickerProps = {
  value: AnalyticsRange;
  onChange: (next: AnalyticsRange) => void;
  className?: string;
};

/* ============================================================
 * Component
 * ============================================================ */

export function DateRangePicker({
  value,
  onChange,
  className,
}: DateRangePickerProps) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as AnalyticsRange)}>
      <SelectTrigger
        className={cn("h-9 w-[170px]", className)}
        aria-label="Date range"
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {ANALYTICS_RANGES.map((r) => (
          <SelectItem key={r.value} value={r.value}>
            {r.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export default DateRangePicker;
