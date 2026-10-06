// src/hooks/admin/use-colors.ts

"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { colorsApi, AdminApiError, isAbortError } from "@/lib/admin/api";
import { adminKeys } from "@/lib/admin/query-keys";
import type {
  ColorListQuery,
  CreateColorInput,
  UpdateColorInput,
} from "@/lib/validations/color.schema";

/* ============================================================
 * Shared
 * ============================================================ */

function invalidateColorCaches(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: adminKeys.colors.all() });
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

export function useColors(params: Partial<ColorListQuery> = {}) {
  return useQuery({
    queryKey: adminKeys.colors.list(params),
    queryFn: ({ signal }) => colorsApi.list(params, signal),
    staleTime: 60 * 1000,
    placeholderData: (prev) => prev,
  });
}

export function useColor(id: string | undefined) {
  return useQuery({
    queryKey: adminKeys.colors.detail(id ?? ""),
    queryFn: ({ signal }) => colorsApi.get(id!, signal),
    enabled: Boolean(id),
    staleTime: 60 * 1000,
  });
}

/**
 * Autocomplete. Caller must debounce `q` (250ms is good).
 */
export function useColorSuggest(q: string, limit = 15) {
  const trimmed = q.trim();

  return useQuery({
    queryKey: adminKeys.colors.suggest(trimmed, limit),
    queryFn: ({ signal }) => colorsApi.suggest(trimmed, limit, signal),
    enabled: trimmed.length >= 1,
    staleTime: 30 * 1000,
    placeholderData: (prev) => prev,
  });
}

/* ============================================================
 * Mutations
 * ============================================================ */

export function useCreateColor() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateColorInput) => colorsApi.create(input),
    onSuccess: (data) => {
      invalidateColorCaches(qc);
      toast.success(`Color "${data.name.en}" created`);
    },
    onError: (err) => {
      const msg = errorMessage(err);
      if (msg) toast.error(msg);
    },
  });
}

export function useUpdateColor(id: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateColorInput) => colorsApi.update(id, input),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: adminKeys.colors.detail(id) });
      invalidateColorCaches(qc);
      toast.success(`Color "${data.name.en}" updated`);
    },
    onError: (err) => {
      const msg = errorMessage(err);
      if (msg) toast.error(msg);
    },
  });
}

export function useDeleteColor() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => colorsApi.delete(id),
    onSuccess: () => {
      invalidateColorCaches(qc);
      toast.success("Color deleted");
    },
    onError: (err) => {
      const msg = errorMessage(err);
      if (msg) toast.error(msg);
    },
  });
}
