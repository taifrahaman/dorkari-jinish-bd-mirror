// src/hooks/admin/use-staff.ts

"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AdminApiError } from "@/lib/admin/api";
import type { CreateStaffInput } from "@/lib/validations/staff.schema";

export type StaffMember = {
  _id: string;
  name: string;
  email: string;
  role: "admin" | "moderator" | "customer";
  canCreateProduct: boolean;
  deletedAt: string | null;
  status: string;
  createdAt: string;
};

const fetchApi = async (url: string, options?: RequestInit) => {
  const res = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
  });
  const data = await res.json();
  if (!res.ok)
    throw new AdminApiError(data.message || "Request failed", res.status, data);
  return data.data;
};

export function useStaff() {
  return useQuery({
    queryKey: ["admin", "staff"],
    queryFn: () => fetchApi("/api/admin/staff") as Promise<StaffMember[]>,
  });
}

export function useCreateStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateStaffInput) =>
      fetchApi("/api/admin/staff", {
        method: "POST",
        body: JSON.stringify(data),
      }) as Promise<StaffMember>,
    onSuccess: (newStaff) => {
      // Instantly add the new staff member to the cached list
      qc.setQueryData(["admin", "staff"], (old: StaffMember[] | undefined) => {
        return old ? [newStaff, ...old] : [newStaff];
      });
      toast.success("Moderator account created");
    },
    onError: (err) => {
      toast.error(
        err instanceof Error ? err.message : "Failed to create staff",
      );
    },
  });
}

export function useUpdateStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      canCreateProduct,
    }: {
      id: string;
      canCreateProduct: boolean;
    }) =>
      fetchApi(`/api/admin/staff/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ canCreateProduct }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "staff"] });
      toast.success("Permissions updated");
    },
  });
}

export function useDeleteStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetchApi(`/api/admin/staff/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "staff"] });
      toast.success("Staff member deactivated");
    },
  });
}

export function usePermanentDeleteStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetchApi(`/api/admin/staff/${id}?permanent=true`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "staff"] });
      toast.success("Staff member permanently deleted");
    },
    onError: (err) => {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete staff",
      );
    },
  });
}

export function useReactivateStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetchApi(`/api/admin/staff/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ reactivate: true }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "staff"] });
      toast.success("Staff member reactivated");
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to reactivate");
    },
  });
}
