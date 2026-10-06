// src/services/cloudinary.service.ts

import {
  deleteAsset,
  deleteMany,
  promoteToCategory,
  promoteToProduct,
  purgeFolder,
  type DeleteResult,
  type PromotedAsset,
} from "@/lib/cloudinary/manage";
import {
  ENTITY,
  parsePublicId,
  sanitizeFolderSegment,
} from "@/lib/cloudinary/paths";
import type { imageRefSchema } from "@/lib/validations/common.schema";
import type { z } from "zod";

/* ============================================================
 * Types
 * ============================================================ */

export type ImageRef = z.infer<typeof imageRefSchema>;

export type PromoteImagesInput = {
  tmpPublicIds: string[];
  sku: string;
};

export type PromoteCategoryImageInput = {
  tmpPublicId: string;
  slug: string;
};

export type SyncImagesResult = {
  removed: string[];
  kept: ImageRef[];
  errors: Array<{ publicId: string; message: string }>;
};

/* ============================================================
 * Promote staged tmp uploads
 * ============================================================ */

export async function promoteProductImages(
  input: PromoteImagesInput,
): Promise<ImageRef[]> {
  if (input.tmpPublicIds.length === 0) return [];

  const promoted: PromotedAsset[] = await promoteToProduct(
    input.tmpPublicIds,
    input.sku,
  );

  return promoted.map((p) => ({
    url: p.url,
    publicId: p.publicId,
    alt: "",
  }));
}

export async function promoteCategoryImage(
  input: PromoteCategoryImageInput,
): Promise<ImageRef> {
  const promoted = await promoteToCategory(input.tmpPublicId, input.slug);
  return { url: promoted.url, publicId: promoted.publicId, alt: "" };
}

/* ============================================================
 * Sync product images on update
 * ============================================================ */

export async function syncProductImages(
  previous: ImageRef[],
  next: ImageRef[],
): Promise<SyncImagesResult> {
  const nextIds = new Set(next.map((i) => i.publicId));
  const prevIds = new Set(previous.map((i) => i.publicId));

  const toRemove = previous.filter((i) => !nextIds.has(i.publicId));
  const kept = next.filter((i) => prevIds.has(i.publicId) || !i.publicId);

  const removed: string[] = [];
  const errors: SyncImagesResult["errors"] = [];

  if (toRemove.length > 0) {
    const deletable = toRemove
      .filter((i) => !isTmp(i.publicId))
      .map((i) => i.publicId);

    if (deletable.length > 0) {
      const results: DeleteResult[] = await deleteMany(deletable);
      for (const r of results) {
        if (r.result === "ok" || r.result === "not found") {
          removed.push(r.publicId);
        } else {
          errors.push({
            publicId: r.publicId,
            message: r.message ?? "delete failed",
          });
        }
      }
    }
  }

  return { removed, kept, errors };
}

/* ============================================================
 * Delete helpers
 * ============================================================ */

export async function deleteImageRefs(images: ImageRef[]): Promise<{
  deleted: string[];
  errors: Array<{ publicId: string; message: string }>;
}> {
  if (images.length === 0) return { deleted: [], errors: [] };

  const ids = images.map((i) => i.publicId).filter(Boolean);
  const results = await deleteMany(ids);

  const deleted: string[] = [];
  const errors: Array<{ publicId: string; message: string }> = [];

  for (const r of results) {
    if (r.result === "ok" || r.result === "not found") {
      deleted.push(r.publicId);
    } else {
      errors.push({
        publicId: r.publicId,
        message: r.message ?? "delete failed",
      });
    }
  }

  return { deleted, errors };
}

export async function deleteProductFolder(sku: string): Promise<number> {
  const res = await purgeFolder(ENTITY.PRODUCTS, sku);
  return res.deleted;
}

export async function deleteCategoryFolder(slug: string): Promise<number> {
  const res = await purgeFolder(ENTITY.CATEGORIES, slug);
  return res.deleted;
}

/* ============================================================
 * Cleanup
 * ============================================================ */

export async function cleanupSession(sessionId: string): Promise<number> {
  const res = await purgeFolder(ENTITY.TMP, sessionId);
  return res.deleted;
}

export async function cleanupSessions(
  sessionIds: string[],
): Promise<{ sessions: number; deleted: number }> {
  let total = 0;
  let count = 0;

  for (const id of sessionIds) {
    try {
      total += await cleanupSession(id);
      count += 1;
    } catch {
      // best-effort
    }
  }

  return { sessions: count, deleted: total };
}

/* ============================================================
 * Validation
 * ============================================================ */

export function filterProductRefs(images: ImageRef[]): ImageRef[] {
  return images.filter((i) => parsePublicId(i.publicId).kind === "product");
}

export function filterCategoryRefs(images: ImageRef[]): ImageRef[] {
  return images.filter((i) => parsePublicId(i.publicId).kind === "category");
}

export function assertAllTmp(publicIds: string[]): void {
  for (const id of publicIds) {
    const parsed = parsePublicId(id);
    if (parsed.kind !== "tmp") {
      throw new Error(
        `Expected tmp public_id, got "${id}" (kind: ${parsed.kind})`,
      );
    }
  }
}

export function assertValidSku(sku: string): void {
  if (!sanitizeFolderSegment(sku)) {
    throw new Error(`Invalid SKU for Cloudinary: "${sku}"`);
  }
}

export function assertValidSlug(slug: string): void {
  if (!sanitizeFolderSegment(slug)) {
    throw new Error(`Invalid slug for Cloudinary: "${slug}"`);
  }
}

/* ============================================================
 * Internal
 * ============================================================ */

function isTmp(publicId: string): boolean {
  return parsePublicId(publicId).kind === "tmp";
}

/* ============================================================
 * Re-exports
 * ============================================================ */

export type { DeleteResult, PromotedAsset };
