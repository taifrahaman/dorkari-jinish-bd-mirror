// src/lib/cloudinary/search.ts

import { cloudinary, FOLDER_PREFIX } from "./client";
import { ENTITY, type EntityType } from "./paths";

/* ============================================================
 * Types
 * ============================================================ */

export type CloudinaryResource = {
  public_id: string;
  secure_url: string;
  width: number;
  height: number;
  bytes: number;
  format: string;
  created_at: string;
  resource_type: string;
  type: string;
};

export type ListCloudinaryAssetsInput = {
  /** Folder-level filter. `"all"` (or undefined) = entire app folder. */
  entity?: EntityType | "all";
  /** Explicit prefix — overrides `entity` when provided. */
  prefix?: string;
  /** Cursor from a previous call's `nextCursor`. */
  cursor?: string;
  /** 1–500. Default 100. */
  limit?: number;
};

export type ListCloudinaryAssetsResult = {
  resources: CloudinaryResource[];
  nextCursor: string | null;
  /** Total assets under the prefix, across all pages. */
  totalCount: number;
};

/* ============================================================
 * Resolve prefix from entity
 * ============================================================ */

function resolvePrefix(input: ListCloudinaryAssetsInput): string {
  if (input.prefix) return input.prefix;
  if (!input.entity || input.entity === "all") return `${FOLDER_PREFIX}/`;
  return `${FOLDER_PREFIX}/${input.entity}`;
}

/* ============================================================
 * List
 * ============================================================ */

export async function listCloudinaryAssets(
  input: ListCloudinaryAssetsInput,
): Promise<ListCloudinaryAssetsResult> {
  const limit = Math.min(Math.max(input.limit ?? 100, 1), 500);
  const prefix = resolvePrefix(input);

  const result = await cloudinary.api.resources({
    type: "upload",
    resource_type: "image",
    prefix,
    max_results: limit,
    next_cursor: input.cursor,
    direction: "desc",
  });

  return {
    resources: (result.resources ?? []) as CloudinaryResource[],
    nextCursor: (result.next_cursor as string | undefined) ?? null,
    totalCount: (result.total_count as number | undefined) ?? 0,
  };
}

/* ============================================================
 * Re-exports
 * ============================================================ */

export { ENTITY };
