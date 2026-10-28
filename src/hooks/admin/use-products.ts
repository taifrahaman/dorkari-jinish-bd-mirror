// src/hooks/admin/use-products.ts

"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { productsApi, AdminApiError, isAbortError } from "@/lib/admin/api";
import { adminKeys } from "@/lib/admin/query-keys";
import type {
  CreateProductInput,
  UpdateProductInput,
  ProductListQuery,
} from "@/lib/validations/product.schema";

/* ============================================================
 * Shared
 * ============================================================ */

function invalidateProductCaches(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({
    queryKey: adminKeys.products.all(),
    refetchType: "all",
  });
  qc.invalidateQueries({
    queryKey: adminKeys.categories.all(),
    refetchType: "all",
  });
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

export function useProducts(params: Partial<ProductListQuery> = {}) {
  return useQuery({
    queryKey: adminKeys.products.list(params),
    queryFn: ({ signal }) => productsApi.list(params, signal),
    staleTime: 30 * 1000,
    placeholderData: (prev) => prev,
  });
}

export function useProduct(id: string | undefined) {
  return useQuery({
    queryKey: adminKeys.products.detail(id ?? ""),
    queryFn: ({ signal }) => productsApi.get(id!, signal),
    enabled: Boolean(id),
    staleTime: 60 * 1000,
  });
}

/* ============================================================
 * Mutations
 * ============================================================ */

export function useCreateProduct() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateProductInput) => productsApi.create(input),
    onSuccess: (data) => {
      invalidateProductCaches(qc);
      toast.success(`Product "${data.name.en}" created`);
    },
    onError: (err) => {
      const msg = errorMessage(err);
      if (msg) toast.error(msg);
    },
  });
}

export function useUpdateProduct(id: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateProductInput) => productsApi.update(id, input),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: adminKeys.products.detail(id) });
      invalidateProductCaches(qc);
      toast.success(`Product "${data.name.en}" updated`);
    },
    onError: (err) => {
      const msg = errorMessage(err);
      if (msg) toast.error(msg);
    },
  });
}

export function useArchiveProduct() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => productsApi.archive(id),
    onSuccess: () => {
      invalidateProductCaches(qc);
      toast.success("Product archived");
    },
    onError: (err) => {
      const msg = errorMessage(err);
      if (msg) toast.error(msg);
    },
  });
}

export function useRestoreProduct() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => productsApi.restore(id),
    onSuccess: (data) => {
      invalidateProductCaches(qc);
      toast.success(`Product "${data.name.en}" restored`);
    },
    onError: (err) => {
      const msg = errorMessage(err);
      if (msg) toast.error(msg);
    },
  });
}

export function usePermanentDeleteProduct() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => productsApi.permanentDelete(id),
    onSuccess: () => {
      invalidateProductCaches(qc);
      toast.success("Product permanently deleted");
    },
    onError: (err) => {
      const msg = errorMessage(err);
      if (msg) toast.error(msg);
    },
  });
}
