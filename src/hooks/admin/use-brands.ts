// src/hooks/admin/use-brands.ts

"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { brandsApi, AdminApiError } from "@/lib/admin/api";
import { adminKeys } from "@/lib/admin/query-keys";
import type {
  BrandListQuery,
  CreateBrandInput,
  UpdateBrandInput,
} from "@/lib/validations/brand.schema";
import { isAbortError } from "@/lib/admin/api";

/* ============================================================
 * Shared
 * ============================================================ */

function invalidateBrandCaches(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: adminKeys.brands.all() });
  qc.invalidateQueries({ queryKey: adminKeys.products.lists() });
}

function errorMessage(err: unknown): string | null {
  if (isAbortError(err)) return null;
  if (err instanceof AdminApiError) return err.message;
  if (err instanceof Error) return err.message;
  return "Something went wrong";
}

/* ============================================================
 * Queries
 * ============================================================ */

export function useBrands(params: Partial<BrandListQuery> = {}) {
  return useQuery({
    queryKey: adminKeys.brands.list(params),
    queryFn: ({ signal }) => brandsApi.list(params, signal),
    staleTime: 30 * 1000,
    placeholderData: (prev) => prev,
  });
}

export function useBrand(id: string | undefined) {
  return useQuery({
    queryKey: adminKeys.brands.detail(id ?? ""),
    queryFn: ({ signal }) => brandsApi.get(id!, signal),
    enabled: Boolean(id),
    staleTime: 60 * 1000,
  });
}

export function useBrandSuggest(q: string, limit = 10) {
  const trimmed = q.trim();

  return useQuery({
    queryKey: adminKeys.brands.suggest(trimmed, limit),
    queryFn: ({ signal }) => brandsApi.suggest(trimmed, limit, signal),
    enabled: trimmed.length >= 1,
    staleTime: 30 * 1000,
    placeholderData: (prev) => prev,
  });
}

/* ============================================================
 * Mutations
 * ============================================================ */

export function useCreateBrand() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateBrandInput) => brandsApi.create(input),
    onSuccess: (data) => {
      invalidateBrandCaches(qc);
      toast.success(`Brand "${data.name.en}" created`);
    },
    onError: (err) => {
      const msg = errorMessage(err);
      if (msg) toast.error(msg);
    },
  });
}

export function useUpdateBrand(id: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateBrandInput) => brandsApi.update(id, input),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: adminKeys.brands.detail(id) });
      invalidateBrandCaches(qc);
      toast.success(`Brand "${data.name.en}" updated`);
    },
    onError: (err) => {
      const msg = errorMessage(err);
      if (msg) toast.error(msg);
    },
  });
}

export function useArchiveBrand() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => brandsApi.archive(id),
    onSuccess: () => {
      invalidateBrandCaches(qc);
      toast.success("Brand archived");
    },
    onError: (err) => {
      const msg = errorMessage(err);
      if (msg) toast.error(msg);
    },
  });
}

export function useRestoreBrand() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => brandsApi.restore(id),
    onSuccess: (data) => {
      invalidateBrandCaches(qc);
      toast.success(`Brand "${data.name.en}" restored`);
    },
    onError: (err) => {
      const msg = errorMessage(err);
      if (msg) toast.error(msg);
    },
  });
}
