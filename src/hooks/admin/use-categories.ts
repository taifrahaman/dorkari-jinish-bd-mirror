// src/hooks/admin/use-categories.ts

"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { categoriesApi, AdminApiError } from "@/lib/admin/api";
import { adminKeys } from "@/lib/admin/query-keys";
import type {
  CategoryListQuery,
  CreateCategoryInput,
  UpdateCategoryInput,
} from "@/lib/validations/category.schema";
import { isAbortError } from "@/lib/admin/api";

/* ============================================================
 * Shared
 * ============================================================ */

function invalidateCategoryCaches(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: adminKeys.categories.all() });
  qc.invalidateQueries({ queryKey: adminKeys.products.lists() });
}

function errorMessage(err: unknown): string | null {
  if (isAbortError(err)) return null;

  // Helper to safely extract a string from whatever the API returned
  const extractString = (val: unknown): string => {
    if (typeof val === "string") return val;
    if (val && typeof val === "object") {
      // Check if there's a nested "message" property
      const record = val as Record<string, unknown>;
      if (typeof record.message === "string") {
        return record.message;
      }
      // Fallback to stringifying the object so you can see the exact data
      return JSON.stringify(val);
    }
    return String(val);
  };

  if (err instanceof AdminApiError) return extractString(err.message);
  if (err instanceof Error) return extractString(err.message);
  return "Something went wrong";
}

/* ============================================================
 * Queries
 * ============================================================ */

export function useCategories(params: Partial<CategoryListQuery> = {}) {
  return useQuery({
    queryKey: adminKeys.categories.list(params),
    queryFn: ({ signal }) => categoriesApi.list(params, signal),
    staleTime: 30 * 1000,
    placeholderData: (prev) => prev,
  });
}

export function useCategoryTree(options?: {
  includeDeleted?: boolean;
  includeInactive?: boolean;
}) {
  return useQuery({
    queryKey: [
      ...adminKeys.categories.tree(),
      {
        includeDeleted: options?.includeDeleted ?? false,
        includeInactive: options?.includeInactive ?? false,
      },
    ],
    queryFn: ({ signal }) => categoriesApi.treeWithOptions(options, signal),
    staleTime: 60 * 1000,
  });
}

export function useCategory(id: string | undefined) {
  return useQuery({
    queryKey: adminKeys.categories.detail(id ?? ""),
    queryFn: ({ signal }) => categoriesApi.get(id!, signal),
    enabled: Boolean(id),
    staleTime: 60 * 1000,
  });
}

/**
 * Debounce `q` in the caller (e.g. 250ms) before passing it in.
 */
export function useCategorySuggest(q: string, limit = 10) {
  const trimmed = q.trim();

  return useQuery({
    queryKey: adminKeys.categories.suggest({ q: trimmed, limit }),
    queryFn: ({ signal }) => categoriesApi.suggest(trimmed, limit, signal),
    enabled: trimmed.length >= 1,
    staleTime: 30 * 1000,
    placeholderData: (prev) => prev,
  });
}

/* ============================================================
 * Mutations
 * ============================================================ */

export function useCreateCategory() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateCategoryInput) => categoriesApi.create(input),
    onSuccess: (data) => {
      invalidateCategoryCaches(qc);
      toast.success(`Category "${data.name}" created`);
    },
    onError: (err) => {
      const msg = errorMessage(err);
      if (msg) toast.error(msg);
    },
  });
}

export function useUpdateCategory(id: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateCategoryInput) => categoriesApi.update(id, input),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: adminKeys.categories.detail(id) });
      invalidateCategoryCaches(qc);
      toast.success(`Category "${data.name}" updated`);
    },
    onError: (err) => {
      const msg = errorMessage(err);
      if (msg) toast.error(msg);
    },
  });
}

export function useArchiveCategory() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => categoriesApi.archive(id),
    onSuccess: () => {
      invalidateCategoryCaches(qc);
      toast.success("Category archived");
    },
    onError: (err) => {
      const msg = errorMessage(err);
      if (msg) toast.error(msg);
    },
  });
}

export function useRestoreCategory() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => categoriesApi.restore(id),
    onSuccess: (data) => {
      invalidateCategoryCaches(qc);
      toast.success(`Category "${data.name}" restored`);
    },
    onError: (err) => {
      const msg = errorMessage(err);
      if (msg) toast.error(msg);
    },
  });
}

export function usePermanentDeleteCategory() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id }: { id: string; cascade?: boolean }) =>
      categoriesApi.permanentDelete(id),
    onSuccess: () => {
      invalidateCategoryCaches(qc);
      toast.success("Category permanently deleted");
    },
    onError: (err) => {
      const msg = errorMessage(err);
      if (msg) toast.error(msg);
    },
  });
}
