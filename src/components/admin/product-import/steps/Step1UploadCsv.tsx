// src/components/admin/product-import/steps/Step1UploadCsv.tsx

"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import Papa from "papaparse";
import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Loader2,
  Upload,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { csvRowSchema, type CsvRow } from "@/lib/validations/import.schema";
import { useImportStore, type ParsedCsvRow } from "../useImportStore";

/* ============================================================
 * CSV template
 * ============================================================ */

const CSV_COLUMNS = [
  "name_en",
  "name_bn",
  "slug",
  "description_en",
  "description_bn",
  "price",
  "compare_at_price",
  "category_slug",
  "category_path",
  "category_name_en",
  "category_name_bn",
  "brand_slug",
  "brand_name_en",
  "brand_name_bn",
  "stock",
  "sku",
  "weight",
  "dimensions",
  "is_active",
  "is_featured",
  "image_files",
  "colors",
  "specifications",
];

const SAMPLE_ROW: Record<(typeof CSV_COLUMNS)[number], string> = {
  name_en: "Samsung 1.5 Ton Inverter AC",
  name_bn: "স্যামসাং ১.৫ টন ইনভার্টার এসি",
  slug: "samsung-1-5-ton-inverter-ac",
  description_en: "Energy-efficient split AC with 5-star rating",
  description_bn: "৫ স্টার রেটিং সহ এনার্জি-এফিশিয়েন্ট স্প্লিট এসি",
  price: "65000",
  compare_at_price: "72000",
  category_slug: "split-ac",
  category_path: "Air Conditioners > Split AC",
  category_name_en: "Split AC",
  category_name_bn: "স্প্লিট এসি",
  brand_slug: "samsung",
  brand_name_en: "Samsung",
  brand_name_bn: "স্যামসাং",
  stock: "8",
  sku: "DJ-2026-0001",
  weight: "42kg",
  dimensions: "100x35x25 cm",
  is_active: "true",
  is_featured: "true",
  image_files: "DJ-2026-0001-1.jpg|DJ-2026-0001-2.jpg",
  colors: "#ffffff:White:সাদা",
  specifications:
    "capacity:1.5 Ton|energy_rating:5 Star|type:Inverter|warranty:10 Years",
};

function buildTemplateCsv(): string {
  const header = CSV_COLUMNS.join(",");
  const sample = CSV_COLUMNS.map((key) => {
    const v = SAMPLE_ROW[key];
    return /[,"\n|]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
  }).join(",");
  return `${header}\n${sample}\n`;
}

function downloadTemplate(): void {
  const csv = buildTemplateCsv();
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "products-template.csv";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/* ============================================================
 * Row validation
 * ============================================================ */

function validateRow(
  raw: Record<string, string>,
  rowIndex: number,
): ParsedCsvRow {
  const nonEmptyValues = Object.values(raw).filter(
    (v) => typeof v === "string" && v.trim() !== "",
  );

  if (nonEmptyValues.length === 0) {
    return { rowIndex, raw, errors: ["Empty row"], status: "invalid" };
  }

  const parsed = csvRowSchema.safeParse(raw);

  if (parsed.success) {
    return {
      rowIndex,
      raw,
      data: parsed.data as CsvRow,
      errors: [],
      status: "valid",
    };
  }

  const errors = parsed.error.issues.map((issue) => {
    const path = issue.path.length > 0 ? issue.path.join(".") : "row";
    return `${path}: ${issue.message}`;
  });

  return { rowIndex, raw, errors, status: "invalid" };
}

/* ============================================================
 * Component
 * ============================================================ */

export function Step1UploadCsv() {
  const csvRows = useImportStore((s) => s.csvRows);
  const fileName = useImportStore((s) => s.fileName);
  const setCsvRows = useImportStore((s) => s.setCsvRows);
  const setFileName = useImportStore((s) => s.setFileName);
  const setStep = useImportStore((s) => s.setStep);
  const reset = useImportStore((s) => s.reset);

  const [isDragging, setIsDragging] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  const validRows = useMemo(
    () => csvRows.filter((r) => r.status === "valid"),
    [csvRows],
  );
  const invalidRows = useMemo(
    () => csvRows.filter((r) => r.status === "invalid"),
    [csvRows],
  );

  const parseFile = useCallback(
    (file: File) => {
      setParseError(null);
      setIsParsing(true);

      Papa.parse<Record<string, string>>(file, {
        header: true,
        skipEmptyLines: "greedy",
        transformHeader: (h: string) => h.trim().toLowerCase(),

        complete: (result: Papa.ParseResult<Record<string, string>>) => {
          setIsParsing(false);

          if (result.errors.length > 0) {
            const critical = result.errors.find(
              (e: Papa.ParseError) =>
                e.type === "Delimiter" || e.type === "Quotes",
            );
            if (critical) {
              setParseError(
                `Could not parse CSV: ${critical.message} (row ${critical.row ?? "?"})`,
              );
              return;
            }
          }

          if (result.data.length === 0) {
            setParseError("The CSV file is empty.");
            return;
          }

          const headers = result.meta.fields ?? [];
          const missing = [
            "name_en",
            "name_bn",
            "price",
            "category_slug",
          ].filter((col) => !headers.includes(col));
          if (missing.length > 0) {
            setParseError(
              `Missing required column${missing.length > 1 ? "s" : ""}: ${missing.join(", ")}`,
            );
            return;
          }

          const validated: ParsedCsvRow[] = result.data.map(
            (raw: Record<string, string>, i: number) => validateRow(raw, i),
          );

          setCsvRows(validated);
          setFileName(file.name);
        },

        error: (err: Error) => {
          setIsParsing(false);
          setParseError(err.message || "Failed to parse CSV.");
        },
      });
    },
    [setCsvRows, setFileName],
  );

  const handleFiles = (files: FileList | File[]) => {
    const file = Array.from(files)[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".csv")) {
      setParseError("Please upload a .csv file.");
      return;
    }
    parseFile(file);
  };

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) handleFiles(e.target.files);
    e.target.value = "";
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const clearFile = () => {
    reset();
    setParseError(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const canProceed = validRows.length > 0;

  const goNext = () => {
    if (!canProceed) return;
    setStep(2);
  };

  return (
    <div className="space-y-6">
      {!fileName && (
        <div
          onDragEnter={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragOver={(e) => e.preventDefault()}
          onDragLeave={(e) => {
            if (e.currentTarget === e.target) setIsDragging(false);
          }}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              inputRef.current?.click();
            }
          }}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-brand-border bg-muted/30 px-6 py-16 text-center transition-colors",
            "hover:border-brand-accent/60 hover:bg-muted/50",
            isDragging && "border-brand-accent bg-brand-accent-light",
          )}
        >
          <div className="grid h-14 w-14 place-items-center rounded-full bg-brand-surface text-brand-text-secondary">
            {isParsing ? (
              <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" />
            ) : (
              <Upload className="h-6 w-6" aria-hidden="true" />
            )}
          </div>

          <div className="space-y-1">
            <p className="text-sm font-medium text-brand-primary">
              {isParsing
                ? "Parsing…"
                : isDragging
                  ? "Drop CSV here"
                  : "Drop your CSV file, or click to browse"}
            </p>
            <p className="text-xs text-brand-text-secondary">
              UTF-8 encoded .csv, first row must be the header.
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              downloadTemplate();
            }}
            className="mt-1"
          >
            <Download className="mr-2 h-3.5 w-3.5" aria-hidden="true" />
            Download template
          </Button>

          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv"
            hidden
            onChange={onInputChange}
          />
        </div>
      )}

      {parseError && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <p>{parseError}</p>
        </div>
      )}

      {fileName && csvRows.length > 0 && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-brand-border bg-brand-surface px-4 py-3">
            <div className="flex items-center gap-3">
              <FileSpreadsheet
                className="h-5 w-5 shrink-0 text-brand-primary"
                aria-hidden="true"
              />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-brand-primary">
                  {fileName}
                </p>
                <p className="text-xs text-brand-text-secondary">
                  {csvRows.length} row{csvRows.length === 1 ? "" : "s"} parsed
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {validRows.length > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-300 bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">
                  <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                  {validRows.length} valid
                </span>
              )}
              {invalidRows.length > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-md border border-destructive/30 bg-destructive/10 px-2 py-1 text-xs font-medium text-destructive">
                  <AlertCircle className="h-3 w-3" aria-hidden="true" />
                  {invalidRows.length} with errors
                </span>
              )}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearFile}
                className="h-8 px-2 text-xs text-brand-text-secondary hover:text-brand-primary"
              >
                <X className="mr-1 h-3 w-3" aria-hidden="true" />
                Replace
              </Button>
            </div>
          </div>

          <div className="overflow-hidden rounded-md border border-brand-border bg-brand-surface">
            <div className="max-h-105 overflow-auto">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-muted/80 backdrop-blur-sm">
                  <TableRow>
                    <TableHead className="w-12 text-xs">#</TableHead>
                    <TableHead className="w-20 text-xs">Status</TableHead>
                    <TableHead className="text-xs">Name (EN)</TableHead>
                    <TableHead className="text-xs">Price</TableHead>
                    <TableHead className="text-xs">Category</TableHead>
                    <TableHead className="text-xs">SKU</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {csvRows.map((row) => (
                    <PreviewRow key={row.rowIndex} row={row} />
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-brand-border pt-4">
            <Button
              type="button"
              onClick={goNext}
              disabled={!canProceed}
              className="min-w-35"
            >
              Continue
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

/* ============================================================
 * Preview row
 * ============================================================ */

function PreviewRow({ row }: { row: ParsedCsvRow }) {
  const isValid = row.status === "valid";
  const data = row.data;

  return (
    <TableRow className={cn(!isValid && "bg-destructive/3")}>
      <TableCell className="text-xs text-brand-text-secondary tabular-nums">
        {row.rowIndex + 1}
      </TableCell>

      <TableCell>
        {isValid ? (
          <CheckCircle2
            className="h-4 w-4 text-emerald-600"
            aria-label="Valid"
          />
        ) : (
          <div className="group relative">
            <AlertCircle
              className="h-4 w-4 text-destructive"
              aria-label="Invalid"
            />
            <div className="invisible absolute left-6 top-0 z-20 w-64 rounded-md border border-brand-border bg-brand-surface px-3 py-2 text-xs text-destructive shadow-md group-hover:visible">
              <ul className="space-y-1">
                {row.errors.slice(0, 5).map((err, i) => (
                  <li key={i} className="flex gap-1.5">
                    <span aria-hidden="true">•</span>
                    <span>{err}</span>
                  </li>
                ))}
                {row.errors.length > 5 && (
                  <li className="text-brand-text-secondary">
                    + {row.errors.length - 5} more
                  </li>
                )}
              </ul>
            </div>
          </div>
        )}
      </TableCell>

      <TableCell className="text-sm text-brand-text">
        {data?.name_en ?? row.raw.name_en ?? "—"}
      </TableCell>

      <TableCell className="text-sm text-brand-text tabular-nums">
        {data ? Number(data.price).toFixed(0) : (row.raw.price ?? "—")}
      </TableCell>

      <TableCell className="text-sm text-brand-text-secondary">
        {data?.category_slug ?? row.raw.category_slug ?? "—"}
      </TableCell>

      <TableCell className="text-xs text-brand-text-secondary tabular-nums">
        {data?.sku ?? row.raw.sku ?? "—"}
      </TableCell>
    </TableRow>
  );
}

export default Step1UploadCsv;
