// src/hooks/admin/use-media.ts

"use client";

import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { AdminApiError, mediaApi, type MediaListParams } from "@/lib/admin/api";
import { adminKeys } from "@/lib/admin/query-keys";
import type { ListMediaResult, MediaAsset } from "@/services/media.service";
import { useMutation, type UseMutationOptions } from "@tanstack/react-query";
import { toast } from "sonner";
import type { DeleteMediaResult } from "@/services/media.service";

/* ============================================================
 * Infinite list
 * ============================================================ */

export function useMediaList(params: Omit<MediaListParams, "cursor">) {
  return useInfiniteQuery({
    queryKey: adminKeys.media.list(params),
    queryFn: ({ pageParam, signal }) =>
      mediaApi.list({ ...params, cursor: pageParam }, signal),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage: ListMediaResult) =>
      lastPage.nextCursor ?? undefined,
    staleTime: 30 * 1000,
  });
}

/* ============================================================
 * Flatten helper
 * ============================================================ */

export function flattenMediaPages(
  pages: ListMediaResult[] | undefined,
): MediaAsset[] {
  if (!pages) return [];
  return pages.flatMap((p) => p.assets);
}

/* ============================================================
 * Usage (single-shot; for the detail drawer)
 * ============================================================ */

export function useMediaUsage(publicIds: string[]) {
  return useQuery({
    queryKey: adminKeys.media.usage(publicIds),
    queryFn: ({ signal }) => mediaApi.getUsage(publicIds, signal),
    enabled: publicIds.length > 0,
    staleTime: 30 * 1000,
  });
}

/* ============================================================
 * Invalidation helper — call after uploads or deletes
 * ============================================================ */

export function useInvalidateMedia() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: adminKeys.media.all() });
  };
}

/* ============================================================
 * Delete mutation
 * ============================================================ */

export type DeleteMediaInput = {
  publicIds: string[];
  /** When true, cascades: strips the ref from products/categories/brands. */
  force: boolean;
};

export type DeleteMediaOutput = {
  deleted: string[];
  affectedProducts: Array<{ productId: string; name: string }>;
};

export function useDeleteMedia(
  options?: UseMutationOptions<DeleteMediaOutput, unknown, DeleteMediaInput>,
) {
  const qc = useQueryClient();

  return useMutation<DeleteMediaOutput, unknown, DeleteMediaInput>({
    mutationFn: async ({ publicIds, force }) => {
      // Sequential, not parallel — Cloudinary rate-limits destroy calls
      // and we want a clear failure point if one fails mid-batch.
      const deleted: string[] = [];
      const affectedProducts: Array<{ productId: string; name: string }> = [];

      for (const pid of publicIds) {
        const res: DeleteMediaResult = await mediaApi.remove(pid, force);
        deleted.push(...res.deleted);
        affectedProducts.push(...res.affectedProducts);
      }

      return { deleted, affectedProducts };
    },
    onSuccess: (data, _vars, _ctx) => {
      // Library
      qc.invalidateQueries({ queryKey: adminKeys.media.all() });
      // Anything that might have had an image stripped
      qc.invalidateQueries({ queryKey: adminKeys.products.all() });
      qc.invalidateQueries({ queryKey: adminKeys.categories.all() });
      // brands don't have a top-level key in your file — add one in a moment
      // (see note at the bottom of this file)

      const n = data.deleted.length;
      toast.success(n === 1 ? "Image deleted" : `${n} images deleted`);
    },
    onError: (err) => {
      const msg =
        err instanceof AdminApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Failed to delete";
      toast.error(msg);
    },
    ...options,
  });
}
