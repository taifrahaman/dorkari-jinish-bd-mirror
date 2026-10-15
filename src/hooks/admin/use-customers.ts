// src/hooks/admin/use-customers.ts

"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { customersApi, AdminApiError, isAbortError } from "@/lib/admin/api";
import { adminKeys } from "@/lib/admin/query-keys";
import type {
  CreateCustomerInput,
  CustomerListQuery,
  UpdateCustomerInput,
} from "@/lib/validations/customer.schema";

/* ============================================================
 * Shared
 * ============================================================ */

function invalidateCustomerCaches(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: adminKeys.customers.all() });
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

export function useCustomers(params: Partial<CustomerListQuery> = {}) {
  return useQuery({
    queryKey: adminKeys.customers.list(params),
    queryFn: ({ signal }) => customersApi.list(params, signal),
    staleTime: 30 * 1000,
    placeholderData: (prev) => prev,
  });
}

export function useCustomer(id: string | undefined) {
  return useQuery({
    queryKey: adminKeys.customers.detail(id ?? ""),
    queryFn: ({ signal }) => customersApi.get(id!, signal),
    enabled: Boolean(id),
    staleTime: 60 * 1000,
  });
}

export function useCustomerStats(id: string | undefined) {
  return useQuery({
    queryKey: adminKeys.customers.stats(id ?? ""),
    queryFn: ({ signal }) => customersApi.stats(id!, signal),
    enabled: Boolean(id),
    staleTime: 60 * 1000,
  });
}

/**
 * Fast autocomplete. Caller should debounce `q` (250ms is good).
 */
export function useCustomerSuggest(q: string, limit = 10) {
  const trimmed = q.trim();

  return useQuery({
    queryKey: adminKeys.customers.suggest(trimmed, limit),
    queryFn: ({ signal }) => customersApi.suggest(trimmed, limit, signal),
    enabled: trimmed.length >= 1,
    staleTime: 30 * 1000,
    placeholderData: (prev) => prev,
  });
}

/* ============================================================
 * Mutations
 * ============================================================ */

export function useCreateCustomer() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateCustomerInput) => customersApi.create(input),
    onSuccess: (data) => {
      invalidateCustomerCaches(qc);
      toast.success(`Customer "${data.name}" created`);
    },
    onError: (err) => {
      const msg = errorMessage(err);
      if (msg) toast.error(msg);
    },
  });
}

export function useUpdateCustomer(id: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateCustomerInput) => customersApi.update(id, input),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: adminKeys.customers.detail(id) });
      invalidateCustomerCaches(qc);
      toast.success(`Customer "${data.name}" updated`);
    },
    onError: (err) => {
      const msg = errorMessage(err);
      if (msg) toast.error(msg);
    },
  });
}

export function useArchiveCustomer() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => customersApi.archive(id),
    onSuccess: () => {
      invalidateCustomerCaches(qc);
      toast.success("Customer archived");
    },
    onError: (err) => {
      const msg = errorMessage(err);
      if (msg) toast.error(msg);
    },
  });
}

export function useRestoreCustomer() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => customersApi.restore(id),
    onSuccess: (data) => {
      invalidateCustomerCaches(qc);
      toast.success(`Customer "${data.name}" restored`);
    },
    onError: (err) => {
      const msg = errorMessage(err);
      if (msg) toast.error(msg);
    },
  });
}

export function usePermanentDeleteCustomer() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => customersApi.permanentDelete(id),
    onSuccess: () => {
      invalidateCustomerCaches(qc);
      toast.success("Customer permanently deleted");
    },
    onError: (err) => {
      const msg = errorMessage(err);
      if (msg) toast.error(msg);
    },
  });
}
