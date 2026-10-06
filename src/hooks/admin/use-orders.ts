// src/hooks/admin/use-orders.ts

"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ordersApi,
  AdminApiError,
  isAbortError,
  type OrderStatsRange,
} from "@/lib/admin/api";
import { adminKeys } from "@/lib/admin/query-keys";
import type {
  OrderListQuery,
  CreateOrderInput,
  UpdateOrderInput,
} from "@/lib/validations/order.schema";

/* ============================================================
 * Shared
 * ============================================================ */

function invalidateOrderCaches(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: adminKeys.orders.all() });
  // Product detail stats include recent orders + totals
  qc.invalidateQueries({ queryKey: adminKeys.products.all() });
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

export function useOrders(params: Partial<OrderListQuery> = {}) {
  return useQuery({
    queryKey: adminKeys.orders.list(params),
    queryFn: ({ signal }) => ordersApi.list(params, signal),
    staleTime: 30 * 1000,
    placeholderData: (prev) => prev,
  });
}

export function useOrder(id: string | undefined) {
  return useQuery({
    queryKey: adminKeys.orders.detail(id ?? ""),
    queryFn: ({ signal }) => ordersApi.get(id!, signal),
    enabled: Boolean(id),
    staleTime: 60 * 1000,
  });
}

export function useOrderStats(range: OrderStatsRange = "30d") {
  return useQuery({
    queryKey: adminKeys.orders.stats(range),
    queryFn: ({ signal }) => ordersApi.stats(range, signal),
    staleTime: 60 * 1000,
    placeholderData: (prev) => prev,
  });
}

/* ============================================================
 * Mutations
 * ============================================================ */

export function useCreateOrder() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateOrderInput) => ordersApi.create(input),
    onSuccess: (data) => {
      invalidateOrderCaches(qc);
      toast.success(`Order ${data.orderNumber} created`);
    },
    onError: (err) => {
      const msg = errorMessage(err);
      if (msg) toast.error(msg);
    },
  });
}

export function useUpdateOrder(id: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateOrderInput) => ordersApi.update(id, input),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: adminKeys.orders.detail(id) });
      invalidateOrderCaches(qc);
      toast.success(`Order ${data.orderNumber} updated`);
    },
    onError: (err) => {
      const msg = errorMessage(err);
      if (msg) toast.error(msg);
    },
  });
}

export function useArchiveOrder() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => ordersApi.archive(id),
    onSuccess: () => {
      invalidateOrderCaches(qc);
      toast.success("Order archived");
    },
    onError: (err) => {
      const msg = errorMessage(err);
      if (msg) toast.error(msg);
    },
  });
}
