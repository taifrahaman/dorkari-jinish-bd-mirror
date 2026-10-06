// src/lib/cloudinary/manage.ts

import { cloudinary, FOLDER_PREFIX } from "./client";
import {
  ENTITY,
  parsePublicId,
  sanitizeFolderSegment,
  type EntityType,
} from "./paths";

/* ============================================================
 * Types
 * ============================================================ */

export type CloudinaryAsset = {
  publicId: string;
  url: string;
  secureUrl: string;
  format: string;
  bytes: number;
  width: number;
  height: number;
  createdAt: string;
};

export type DeleteResult = {
  publicId: string;
  result: "ok" | "not found" | "error";
  message?: string;
};

export type RenameResult = {
  from: string;
  to: string;
  ok: boolean;
  url?: string;
  message?: string;
};

/* ============================================================
 * Metadata
 * ============================================================ */

export async function getAsset(
  publicId: string,
): Promise<CloudinaryAsset | null> {
  try {
    const res = await cloudinary.api.resource(publicId);
    return normalizeAsset(res);
  } catch (err: unknown) {
    if (isNotFound(err)) return null;
    throw err;
  }
}

export async function assetExists(publicId: string): Promise<boolean> {
  const asset = await getAsset(publicId);
  return asset !== null;
}

function normalizeAsset(raw: Record<string, unknown>): CloudinaryAsset {
  return {
    publicId: String(raw.public_id ?? ""),
    url: String(raw.url ?? ""),
    secureUrl: String(raw.secure_url ?? ""),
    format: String(raw.format ?? ""),
    bytes: Number(raw.bytes ?? 0),
    width: Number(raw.width ?? 0),
    height: Number(raw.height ?? 0),
    createdAt: String(raw.created_at ?? ""),
  };
}

function isNotFound(err: unknown): boolean {
  if (typeof err !== "object" || err === null) return false;
  const e = err as { http_code?: number; error?: { http_code?: number } };
  const code = e.http_code ?? e.error?.http_code;
  return code === 404;
}

/* ============================================================
 * Delete
 * ============================================================ */

export async function deleteAsset(publicId: string): Promise<DeleteResult> {
  try {
    const res = await cloudinary.uploader.destroy(publicId, {
      invalidate: true, // purge CDN cache
    });

    if (res.result === "ok") {
      return { publicId, result: "ok" };
    }
    if (res.result === "not found") {
      return { publicId, result: "not found" };
    }
    return { publicId, result: "error", message: String(res.result) };
  } catch (err: unknown) {
    return {
      publicId,
      result: "error",
      message: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

export async function deleteMany(publicIds: string[]): Promise<DeleteResult[]> {
  // Cloudinary supports up to 100 per call
  const chunks = chunk(publicIds, 100);
  const results: DeleteResult[] = [];

  for (const group of chunks) {
    try {
      const res = await cloudinary.api.delete_resources(group, {
        invalidate: true,
      });

      const deleted = (res.deleted ?? {}) as Record<string, string>;
      for (const id of group) {
        const status = deleted[id];
        results.push({
          publicId: id,
          result:
            status === "deleted"
              ? "ok"
              : status === "not_found"
                ? "not found"
                : "error",
          message: status,
        });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      for (const id of group) {
        results.push({ publicId: id, result: "error", message });
      }
    }
  }

  return results;
}

/**
 * Purges a whole folder. Use with care — this deletes every asset
 * under the folder prefix (e.g. cleanup of abandoned tmp/<session>/).
 */
export async function purgeFolder(
  entity: EntityType,
  owner: string,
): Promise<{ deleted: number }> {
  const prefix = `${FOLDER_PREFIX}/${entity}/${sanitizeFolderSegment(owner)}/`;

  const publicIds: string[] = [];
  let nextCursor: string | undefined;

  do {
    const res = await cloudinary.api.resources({
      type: "upload",
      prefix,
      max_results: 100,
      next_cursor: nextCursor,
    });
    for (const r of res.resources ?? []) {
      publicIds.push(String(r.public_id));
    }
    nextCursor = res.next_cursor;
  } while (nextCursor);

  if (publicIds.length === 0) return { deleted: 0 };

  await deleteMany(publicIds);
  return { deleted: publicIds.length };
}

/* ============================================================
 * Rename — used after import wizard commit (tmp → products)
 * ============================================================ */

export async function renameAsset(
  fromPublicId: string,
  toPublicId: string,
  overwrite = true,
): Promise<RenameResult> {
  try {
    const res = await cloudinary.uploader.rename(fromPublicId, toPublicId, {
      overwrite,
      invalidate: true,
      resource_type: "image",
    });

    return {
      from: fromPublicId,
      to: toPublicId,
      ok: true,
      url: String(res.secure_url ?? ""),
    };
  } catch (err: unknown) {
    return {
      from: fromPublicId,
      to: toPublicId,
      ok: false,
      message: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

/**
 * Renames a batch of tmp assets into the products/<sku>/ folder.
 * Returns the final URLs and publicIds in order.
 */
export type PromoteItem = {
  tmpPublicId: string;
  index: number;
};

export type PromotedAsset = {
  publicId: string;
  url: string;
  tmpPublicId: string;
};

export async function promoteToProduct(
  tmpPublicIds: string[],
  sku: string,
): Promise<PromotedAsset[]> {
  const segment = sanitizeFolderSegment(sku);
  if (!segment) throw new Error(`Invalid SKU: ${sku}`);

  const results: PromotedAsset[] = [];

  for (let i = 0; i < tmpPublicIds.length; i += 1) {
    const tmpId = tmpPublicIds[i];
    const target = `${FOLDER_PREFIX}/${ENTITY.PRODUCTS}/${segment}/${segment}-${i + 1}`;

    const res = await renameAsset(tmpId, target, true);
    if (!res.ok || !res.url) {
      throw new Error(
        `Failed to promote ${tmpId} → ${target}: ${res.message ?? "unknown"}`,
      );
    }

    results.push({
      publicId: target,
      url: res.url,
      tmpPublicId: tmpId,
    });
  }

  return results;
}

export async function promoteToCategory(
  tmpPublicId: string,
  slug: string,
): Promise<PromotedAsset> {
  const segment = sanitizeFolderSegment(slug);
  if (!segment) throw new Error(`Invalid category slug: ${slug}`);

  const target = `${FOLDER_PREFIX}/${ENTITY.CATEGORIES}/${segment}/cover`;
  const res = await renameAsset(tmpPublicId, target, true);

  if (!res.ok || !res.url) {
    throw new Error(
      `Failed to promote ${tmpPublicId} → ${target}: ${res.message ?? "unknown"}`,
    );
  }

  return { publicId: target, url: res.url, tmpPublicId };
}

/* ============================================================
 * Delivery URL builder
 *
 * Builds an optimized Cloudinary URL with:
 *   - f_auto  → browser picks best format (AVIF → WebP → JPEG/PNG)
 *   - q_auto  → optimal compression
 *   - optional transforms passed by caller
 * ============================================================ */

export type CdnTransform = {
  width?: number;
  height?: number;
  /** crop mode: fill | fit | scale | thumb | limit */
  crop?: "fill" | "fit" | "scale" | "thumb" | "limit";
  /** gravity when crop=fill: auto | face | center */
  gravity?: "auto" | "face" | "center";
  /** quality override — defaults to "auto" */
  quality?: string | number;
  /** additional raw transform segments, e.g. ["dpr_2.0"] */
  extra?: string[];
  /** true → skip f_auto/q_auto (rare) */
  raw?: boolean;
};

export function buildUrl(
  publicId: string,
  transform: CdnTransform = {},
): string {
  const cloudName = cloudinary.config().cloud_name;
  if (!cloudName) {
    throw new Error("Cloudinary cloud_name is not configured.");
  }

  const parts: string[] = [];

  if (!transform.raw) {
    parts.push("f_auto", "q_auto");
  } else if (transform.quality !== undefined) {
    parts.push(`q_${transform.quality}`);
  }

  if (transform.width) parts.push(`w_${transform.width}`);
  if (transform.height) parts.push(`h_${transform.height}`);
  if (transform.crop) parts.push(`c_${transform.crop}`);
  if (transform.gravity) parts.push(`g_${transform.gravity}`);
  if (transform.quality !== undefined && !transform.raw) {
    parts.push(`q_${transform.quality}`);
  }
  if (transform.extra?.length) parts.push(...transform.extra);

  const segment = parts.length ? `${parts.join(",")}/` : "";
  return `https://res.cloudinary.com/${cloudName}/image/upload/${segment}${publicId}`;
}

/**
 * Convenience: pre-built sizes for the admin UI.
 */
export const PRESETS = {
  thumb: {
    width: 120,
    height: 120,
    crop: "fill",
    gravity: "auto",
  } as CdnTransform,
  card: {
    width: 400,
    height: 400,
    crop: "fill",
    gravity: "auto",
  } as CdnTransform,
  detail: { width: 1200, crop: "limit" } as CdnTransform,
} as const;

export function thumbUrl(publicId: string): string {
  return buildUrl(publicId, PRESETS.thumb);
}

export function cardUrl(publicId: string): string {
  return buildUrl(publicId, PRESETS.card);
}

export function detailUrl(publicId: string): string {
  return buildUrl(publicId, PRESETS.detail);
}

/* ============================================================
 * Small utilities
 * ============================================================ */

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }
  return out;
}

/**
 * Returns true if the public_id belongs to the tmp staging folder.
 */
export function isTmpAsset(publicId: string): boolean {
  return parsePublicId(publicId).kind === "tmp";
}
