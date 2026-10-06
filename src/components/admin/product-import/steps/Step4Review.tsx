// src/components/admin/product-import/steps/Step4Review.tsx

"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  CheckCircle2,
  Download,
  Loader2,
  RotateCcw,
  Sparkles,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useImportStore } from "../useImportStore";
import { AdminApiError } from "@/lib/admin/api";
import type {
  ImportResult,
  ImportRowResult,
} from "@/lib/validations/import.schema";

/* ============================================================
 * Component
 * ============================================================ */

export function Step4Review() {
  const router = useRouter();

  const csvRows = useImportStore((s) => s.csvRows);
  const stagedImages = useImportStore((s) => s.stagedImages);
  const options = useImportStore((s) => s.options);
  const setOptions = useImportStore((s) => s.setOptions);
  const setStep = useImportStore((s) => s.setStep);
  const reset = useImportStore((s) => s.reset);

  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  /* ----------------------------------------------------------
   * Build payload — only valid rows with their images
   *
   * We send the raw validated CsvRow. The server resolves
   * category_slug/brand_slug, reserves SKUs, promotes images.
   * ---------------------------------------------------------- */

  const payload = useMemo(() => {
    const validRows = csvRows.filter((r) => r.status === "valid" && r.data);

    const imagesByRow = new Map<number, string[]>();
    for (const img of stagedImages) {
      if (img.assignedToRow === undefined) continue;
      const arr = imagesByRow.get(img.assignedToRow) ?? [];
      arr.push(img.tmpPublicId);
      imagesByRow.set(img.assignedToRow, arr);
    }

    return {
      rows: validRows.map((r) => ({
        rowIndex: r.rowIndex,
        csvRow: r.data!,
        tmpPublicIds: imagesByRow.get(r.rowIndex) ?? [],
      })),
      options,
    };
  }, [csvRows, stagedImages, options]);

  /* ----------------------------------------------------------
   * Summary stats
   * ---------------------------------------------------------- */

  const stats = useMemo(() => {
    const validRows = csvRows.filter((r) => r.status === "valid");
    const invalidCount = csvRows.length - validRows.length;
    const totalImages = stagedImages.length;
    const assignedImages = stagedImages.filter(
      (img) => img.assignedToRow !== undefined,
    ).length;
    const rowsWithImages = new Set(
      stagedImages
        .filter((img) => img.assignedToRow !== undefined)
        .map((img) => img.assignedToRow),
    ).size;

    return {
      validCount: validRows.length,
      invalidCount,
      totalImages,
      assignedImages,
      rowsWithImages,
      rowsWithoutImages: validRows.length - rowsWithImages,
    };
  }, [csvRows, stagedImages]);

  /* ----------------------------------------------------------
   * Commit handler
   * ---------------------------------------------------------- */

  const handleCommit = async () => {
    setRunning(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/products/import-with-images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(payload),
      });

      const json = (await response.json()) as {
        success: boolean;
        data?: ImportResult;
        error?: { message?: string };
      };

      if (!response.ok || !json.success || !json.data) {
        throw new Error(json.error?.message ?? "Import failed");
      }

      setResult(json.data);
    } catch (err) {
      setError(
        err instanceof AdminApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Something went wrong",
      );
    } finally {
      setRunning(false);
    }
  };

  /* ----------------------------------------------------------
   * Post-commit actions
   * ---------------------------------------------------------- */

  const handleStartOver = () => {
    reset();
  };

  const handleGoToProducts = () => {
    router.push("/admin/products");
    router.refresh();
  };

  /* ----------------------------------------------------------
   * Render — result screen
   * ---------------------------------------------------------- */

  if (result) {
    return (
      <ResultView
        result={result}
        onStartOver={handleStartOver}
        onGoToProducts={handleGoToProducts}
      />
    );
  }

  /* ----------------------------------------------------------
   * Render — review screen
   * ---------------------------------------------------------- */

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid gap-3 sm:grid-cols-3">
        <SummaryCard
          label="Products"
          value={stats.validCount}
          sub={`${stats.invalidCount} invalid rows skipped`}
          tone={stats.validCount > 0 ? "default" : "warning"}
        />
        <SummaryCard
          label="Images"
          value={stats.assignedImages}
          sub={`${stats.totalImages - stats.assignedImages} unassigned`}
        />
        <SummaryCard
          label="Without images"
          value={stats.rowsWithoutImages}
          tone={stats.rowsWithoutImages > 0 ? "warning" : "success"}
        />
      </div>

      {/* Options */}
      <section className="rounded-md border border-brand-border bg-brand-surface p-5">
        <h3 className="font-heading text-sm font-semibold text-brand-primary">
          Import options
        </h3>
        <p className="mt-0.5 text-xs text-brand-text-secondary">
          These control how duplicate SKUs and missing categories are handled.
        </p>

        <div className="mt-4 grid gap-5 md:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-brand-primary">
              On duplicate SKU
            </label>
            <Select
              value={options.onDuplicate}
              onValueChange={(v) =>
                setOptions({
                  onDuplicate: v as "skip" | "update" | "fail",
                })
              }
            >
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="skip">
                  Skip — leave existing product unchanged
                </SelectItem>
                <SelectItem value="update">
                  Update — overwrite fields on existing product
                </SelectItem>
                <SelectItem value="fail">
                  Fail — mark the row as an error
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <ToggleOption
              label="Create missing categories"
              description="Auto-create any category_slug that doesn't exist."
              checked={options.createMissingCategories ?? false}
              onChange={(v) => setOptions({ createMissingCategories: v })}
            />
            <ToggleOption
              label="Create missing brands"
              description="Auto-create any brand_slug that doesn't exist."
              checked={options.createMissingBrands ?? false}
              onChange={(v) => setOptions({ createMissingBrands: v })}
            />
            <ToggleOption
              label="Dry run"
              description="Validate only — no products created, no images promoted."
              checked={options.dryRun ?? false}
              onChange={(v) => setOptions({ dryRun: v })}
            />
          </div>
        </div>
      </section>

      {/* Error */}
      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <p>{error}</p>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between gap-3 border-t border-brand-border pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => setStep(3)}
          disabled={running}
        >
          Back
        </Button>

        <div className="flex items-center gap-3">
          {options.dryRun && (
            <p className="text-xs text-brand-text-secondary">
              Dry run — nothing will be saved.
            </p>
          )}

          <Button
            type="button"
            onClick={handleCommit}
            disabled={running || stats.validCount === 0}
            className="min-w-40"
          >
            {running ? (
              <Loader2
                className="mr-2 h-4 w-4 animate-spin"
                aria-hidden="true"
              />
            ) : options.dryRun ? (
              <Sparkles className="mr-2 h-4 w-4" aria-hidden="true" />
            ) : (
              <Upload className="mr-2 h-4 w-4" aria-hidden="true" />
            )}
            {running
              ? "Importing…"
              : options.dryRun
                ? "Run dry run"
                : `Import ${stats.validCount} product${stats.validCount === 1 ? "" : "s"}`}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
 * Summary card
 * ============================================================ */

function SummaryCard({
  label,
  value,
  sub,
  tone = "default",
}: {
  label: string;
  value: number;
  sub?: string;
  tone?: "default" | "success" | "warning";
}) {
  return (
    <div
      className={cn(
        "rounded-md border border-brand-border bg-brand-surface px-4 py-3",
        tone === "warning" && "border-amber-300 bg-amber-50",
      )}
    >
      <p className="text-xs uppercase tracking-wide text-brand-text-secondary">
        {label}
      </p>
      <p
        className={cn(
          "mt-1 font-heading text-2xl font-semibold tabular-nums",
          tone === "success"
            ? "text-emerald-700"
            : tone === "warning"
              ? "text-amber-800"
              : "text-brand-primary",
        )}
      >
        {value}
      </p>
      {sub && <p className="mt-0.5 text-xs text-brand-text-secondary">{sub}</p>}
    </div>
  );
}

/* ============================================================
 * Toggle option
 * ============================================================ */

function ToggleOption({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-md border border-brand-border bg-muted/30 px-3 py-2.5">
      <div>
        <p className="text-sm font-medium text-brand-primary">{label}</p>
        <p className="text-xs text-brand-text-secondary">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

/* ============================================================
 * Result view
 * ============================================================ */

function ResultView({
  result,
  onStartOver,
  onGoToProducts,
}: {
  result: ImportResult;
  onStartOver: () => void;
  onGoToProducts: () => void;
}) {
  const hasFailures = result.failed > 0;

  const handleDownloadReport = () => {
    const header = "row,status,sku,name,message";
    const lines = result.rows.map((r) => {
      const esc = (s: string | undefined) =>
        s ? `"${s.replace(/"/g, '""')}"` : "";
      return [
        r.row + 1,
        r.status,
        esc(r.sku),
        esc(r.name),
        esc(r.message),
      ].join(",");
    });
    const csv = `${header}\n${lines.join("\n")}`;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `import-report-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div
        className={cn(
          "flex items-start gap-3 rounded-md border px-4 py-3 text-sm",
          hasFailures
            ? "border-amber-300 bg-amber-50 text-amber-900"
            : "border-emerald-300 bg-emerald-50 text-emerald-900",
        )}
      >
        {hasFailures ? (
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        ) : (
          <CheckCircle2
            className="mt-0.5 h-4 w-4 shrink-0"
            aria-hidden="true"
          />
        )}
        <div>
          <p className="font-medium">
            {result.dryRun ? "Dry run complete" : "Import complete"}
          </p>
          <p className="mt-0.5 text-xs">
            {result.created} created · {result.updated} updated ·{" "}
            {result.skipped} skipped · {result.failed} failed
          </p>
        </div>
      </div>

      {/* Per-row table */}
      <div className="overflow-hidden rounded-md border border-brand-border bg-brand-surface">
        <div className="max-h-105 overflow-auto">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-muted/80 backdrop-blur-sm">
              <TableRow>
                <TableHead className="w-16 text-xs">Row</TableHead>
                <TableHead className="w-24 text-xs">Status</TableHead>
                <TableHead className="text-xs">SKU</TableHead>
                <TableHead className="text-xs">Name</TableHead>
                <TableHead className="text-xs">Message</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.rows.map((row) => (
                <ResultRow key={row.row} row={row} />
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-brand-border pt-4">
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={handleDownloadReport}>
            <Download className="mr-2 h-4 w-4" aria-hidden="true" />
            Download report
          </Button>
          <Button variant="outline" onClick={onStartOver}>
            <RotateCcw className="mr-2 h-4 w-4" aria-hidden="true" />
            New import
          </Button>
        </div>

        <Button onClick={onGoToProducts}>Back to products</Button>
      </div>
    </div>
  );
}

/* ============================================================
 * Result row
 * ============================================================ */

function ResultRow({ row }: { row: ImportRowResult }) {
  const tone = {
    created: "text-emerald-700",
    updated: "text-blue-700",
    skipped: "text-brand-text-secondary",
    failed: "text-destructive",
  }[row.status];

  return (
    <TableRow>
      <TableCell className="text-xs tabular-nums">{row.row + 1}</TableCell>
      <TableCell>
        <span className={cn("text-xs font-medium capitalize", tone)}>
          {row.status}
        </span>
      </TableCell>
      <TableCell className="font-mono text-xs tabular-nums">
        {row.sku ?? "—"}
      </TableCell>
      <TableCell className="text-xs">{row.name ?? "—"}</TableCell>
      <TableCell className="text-xs text-brand-text-secondary">
        {row.message ?? "—"}
      </TableCell>
    </TableRow>
  );
}

export default Step4Review;
