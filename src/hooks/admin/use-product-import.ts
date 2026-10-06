// src/hooks/admin/use-product-import.ts

"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  productsApi,
  AdminApiError,
  signUpload,
  saveBlob,
  type SignUploadRequest,
  isAbortError,
} from "@/lib/admin/api";
import { adminKeys } from "@/lib/admin/query-keys";
import type {
  BulkCreateProductInput,
  ImportPayload,
  ExportFormat,
} from "@/lib/validations/import.schema";

function errorMessage(err: unknown, fallback: string): string | null {
  if (isAbortError(err)) return null;
  if (err instanceof AdminApiError) return err.message;
  if (err instanceof Error) return err.message;
  return fallback;
}
/* ============================================================
 * Bulk create
 * ============================================================ */

export function useBulkCreateProducts() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (input: BulkCreateProductInput) =>
      productsApi.bulkCreate(input),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: adminKeys.products.all() });
      qc.invalidateQueries({ queryKey: adminKeys.categories.all() });
      toast.success(
        `Bulk create done — ${data.created} created, ${data.failed} failed`,
      );
    },
    onError: (err) => {
      const msg = errorMessage(err, "Bulk create failed");
      if (msg) toast.error(msg);
    },
  });
}

/* ============================================================
 * Import
 * ============================================================ */

export function useImportProducts() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (input: ImportPayload) => productsApi.import(input),
    onSuccess: (data) => {
      if (!data.dryRun) {
        qc.invalidateQueries({ queryKey: adminKeys.products.all() });
        qc.invalidateQueries({ queryKey: adminKeys.categories.all() });
      }
      const verb = data.dryRun ? "Dry run" : "Import";
      toast.success(
        `${verb} — ${data.created} created, ${data.updated} updated, ${data.skipped} skipped, ${data.failed} failed`,
      );
    },
    onError: (err) => toast.error(errorMessage(err, "Import failed")),
  });
}

/* ============================================================
 * Export — downloads the file directly, returns filename
 * ============================================================ */

export function useExportProducts() {
  return useMutation({
    mutationFn: async (input: {
      format: ExportFormat;
      category?: string;
      isActive?: boolean;
      includeDeleted?: boolean;
      ids?: string[];
    }) => {
      const { format, ...params } = input;
      const { blob, filename } = await productsApi.export(format, params);
      saveBlob(blob, filename);
      return filename;
    },
    onSuccess: (filename) => toast.success(`Exported ${filename}`),
    onError: (err) => toast.error(errorMessage(err, "Export failed")),
  });
}

/* ============================================================
 * Cloudinary signed upload
 *
 * No cache, no side effects — just a plain async wrapper for the
 * sign endpoint. Caller handles success/error inline (the image
 * uploader shows its own progress + retry UI).
 * ============================================================ */

export function useSignUpload() {
  return useMutation({
    mutationFn: (input: SignUploadRequest) => signUpload(input),
  });
}
