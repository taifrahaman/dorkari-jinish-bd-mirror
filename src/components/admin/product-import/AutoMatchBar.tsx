// src/components/admin/product-import/AutoMatchBar.tsx

"use client";

import { useMemo } from "react";
import { Sparkles, RefreshCw, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useImportStore } from "./useImportStore";
import { useAutoMatcher } from "./useAutoMatcher";
import type { FilterMode } from "./ProductDropList";

/* ============================================================
 * Types
 * ============================================================ */

export type AutoMatchBarProps = {
  filter: FilterMode;
  onFilterChange: (next: FilterMode) => void;
  disabled?: boolean;
};

/* ============================================================
 * Component
 * ============================================================ */

export function AutoMatchBar({
  filter,
  onFilterChange,
  disabled = false,
}: AutoMatchBarProps) {
  const csvRows = useImportStore((s) => s.csvRows);
  const stagedImages = useImportStore((s) => s.stagedImages);
  const bulkAssign = useImportStore((s) => s.bulkAssign);

  const { run } = useAutoMatcher();

  /* ----------------------------------------------------------
   * Live stats
   * ---------------------------------------------------------- */

  const stats = useMemo(() => {
    const validRows = csvRows.filter((r) => r.status === "valid");
    const totalRows = validRows.length;
    const totalImages = stagedImages.length;
    const assigned = stagedImages.filter(
      (img) => img.assignedToRow !== undefined,
    ).length;
    const unassigned = totalImages - assigned;

    const rowIndexesWithImages = new Set(
      stagedImages
        .filter((img) => img.assignedToRow !== undefined)
        .map((img) => img.assignedToRow),
    );
    const rowsWithout = validRows.filter(
      (r) => !rowIndexesWithImages.has(r.rowIndex),
    ).length;

    const autoMatched = stagedImages.filter((img) => img.autoMatched).length;

    return {
      totalRows,
      totalImages,
      assigned,
      unassigned,
      rowsWithout,
      autoMatched,
    };
  }, [csvRows, stagedImages]);

  /* ----------------------------------------------------------
   * Run auto-match
   * ---------------------------------------------------------- */

  const handleAutoMatch = (mode: "all" | "unmatched-only") => {
    const report = run(csvRows, stagedImages, {
      skipAnyAssigned: mode === "unmatched-only",
    });

    if (report.assignments.length === 0) {
      // No matches found — user sees it in the stats
      return;
    }

    bulkAssign(
      report.assignments.map((a) => ({
        imageId: a.imageId,
        rowIndex: a.rowIndex,
        auto: true,
      })),
    );
  };

  /* ----------------------------------------------------------
   * Render
   * ---------------------------------------------------------- */

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-brand-border bg-brand-surface px-3 py-2.5">
      {/* Left — stats */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-brand-text-secondary">
        <Stat label="Products" value={stats.totalRows} />
        <Stat label="Images" value={stats.totalImages} />
        <Stat
          label="Assigned"
          value={stats.assigned}
          tone={stats.assigned > 0 ? "success" : "muted"}
        />
        <Stat
          label="Unassigned"
          value={stats.unassigned}
          tone={stats.unassigned > 0 ? "warning" : "muted"}
        />
        <Stat
          label="No image"
          value={stats.rowsWithout}
          tone={stats.rowsWithout > 0 ? "warning" : "muted"}
        />
        {stats.autoMatched > 0 && (
          <span className="inline-flex items-center gap-1 rounded-md border border-brand-accent/40 bg-brand-accent-light px-1.5 py-0.5 text-[11px] text-brand-primary">
            <Sparkles className="h-3 w-3" aria-hidden="true" />
            {stats.autoMatched} auto
          </span>
        )}
      </div>

      {/* Right — actions */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Filter */}
        <Select
          value={filter}
          onValueChange={(v) => onFilterChange(v as FilterMode)}
        >
          <SelectTrigger
            className="h-8 w-42.5 text-xs"
            aria-label="Filter products"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All products</SelectItem>
            <SelectItem value="with-images">Only with images</SelectItem>
            <SelectItem value="without-images">Only without images</SelectItem>
          </SelectContent>
        </Select>

        {/* Re-match all */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => handleAutoMatch("all")}
          disabled={disabled || stats.totalImages === 0}
          className="h-8"
        >
          <Wand2 className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
          Re-match all
        </Button>

        {/* Match only unassigned */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => handleAutoMatch("unmatched-only")}
          disabled={
            disabled || stats.unassigned === 0 || stats.totalImages === 0
          }
          className="h-8"
        >
          <RefreshCw className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
          Match unmatched
        </Button>
      </div>
    </div>
  );
}

/* ============================================================
 * Stat
 * ============================================================ */

function Stat({
  label,
  value,
  tone = "muted",
}: {
  label: string;
  value: number;
  tone?: "muted" | "success" | "warning";
}) {
  return (
    <span className="inline-flex items-baseline gap-1">
      <span>{label}:</span>
      <span
        className={
          tone === "success"
            ? "font-semibold text-emerald-700"
            : tone === "warning"
              ? "font-semibold text-amber-700"
              : "font-semibold text-brand-primary"
        }
      >
        {value}
      </span>
    </span>
  );
}

export default AutoMatchBar;
