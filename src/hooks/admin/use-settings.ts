// src/hooks/admin/use-settings.ts

"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { adminRequest, AdminApiError, isAbortError } from "@/lib/admin/api";
import { adminKeys } from "@/lib/admin/query-keys";
import type {
  SettingResponse,
  UpdateSettingsInput,
} from "@/lib/validations/setting.schema";

/* ============================================================
 * API calls
 * ============================================================ */

function fetchSettings(signal?: AbortSignal): Promise<SettingResponse> {
  return adminRequest<SettingResponse>("/settings", { signal });
}

function patchSettings(input: UpdateSettingsInput): Promise<SettingResponse> {
  return adminRequest<SettingResponse>("/settings", {
    method: "PATCH",
    body: input,
  });
}

/* ============================================================
 * Helpers
 * ============================================================ */

function errorMessage(err: unknown): string | null {
  if (isAbortError(err)) return null;
  if (err instanceof AdminApiError) return err.message;
  if (err instanceof Error) return err.message;
  return "Something went wrong";
}

/* ============================================================
 * Queries
 * ============================================================ */

export function useSettings() {
  return useQuery({
    queryKey: adminKeys.settings.all(),
    queryFn: ({ signal }) => fetchSettings(signal),
    staleTime: 5 * 60 * 1000,
  });
}

/* ============================================================
 * Mutations
 * ============================================================ */

export function useUpdateSettings() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateSettingsInput) => patchSettings(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminKeys.settings.all() });
      toast.success("Settings saved");
    },
    onError: (err) => {
      const msg = errorMessage(err);
      if (msg) toast.error(msg);
    },
  });
}
