// src/lib/cloudinary/paths.ts

import { FOLDER_PREFIX } from "./client";

/* ============================================================
 * Folder + public ID conventions
 *
 * Every asset lives under:
 *   <FOLDER_PREFIX>/<entity>/<owner-slug-or-sku>/<filename>
 *
 * Examples:
 *   dorkari-jinish-bd/products/DJ-2026-0001/DJ-2026-0001-1
 *   dorkari-jinish-bd/products/DJ-2026-0001/DJ-2026-0001-2
 *   dorkari-jinish-bd/categories/panjabi/cover
 *   dorkari-jinish-bd/tmp/8f3a1c9e-...           ← staging tray uploads
 * ============================================================ */

export const ENTITY = {
  PRODUCTS: "products",
  CATEGORIES: "categories",
  TMP: "tmp",
} as const;

export type EntityType = (typeof ENTITY)[keyof typeof ENTITY];

/* ============================================================
 * Sanitizers
 *
 * Cloudinary folder names allow most characters but it's safer
 * to normalize. We lowercase, replace anything not alphanumeric
 * or hyphen with a hyphen, and collapse repeats.
 * ============================================================ */

export function sanitizeFolderSegment(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/* ============================================================
 * Product paths
 * ============================================================ */

/**
 * Product folder path (no leading slash).
 * e.g. "dorkari-jinish-bd/products/DJ-2026-0001"
 */
export function productFolder(sku: string): string {
  const segment = sanitizeFolderSegment(sku);
  if (!segment) {
    throw new Error(`Invalid SKU for Cloudinary folder: "${sku}"`);
  }
  return `${FOLDER_PREFIX}/${ENTITY.PRODUCTS}/${segment}`;
}

/**
 * Full public_id for a product image (no file extension — Cloudinary
 * adds that based on the uploaded format).
 *
 * e.g. "dorkari-jinish-bd/products/DJ-2026-0001/DJ-2026-0001-1"
 */
export function productImagePublicId(sku: string, index: number): string {
  if (!Number.isInteger(index) || index < 1) {
    throw new Error(
      `Product image index must be a positive integer, got ${index}`,
    );
  }
  const segment = sanitizeFolderSegment(sku);
  return `${productFolder(sku)}/${segment}-${index}`;
}

/* ============================================================
 * Category paths
 * ============================================================ */

/**
 * Category folder path (no leading slash).
 * e.g. "dorkari-jinish-bd/categories/panjabi"
 */
export function categoryFolder(slug: string): string {
  const segment = sanitizeFolderSegment(slug);
  if (!segment) {
    throw new Error(`Invalid slug for Cloudinary folder: "${slug}"`);
  }
  return `${FOLDER_PREFIX}/${ENTITY.CATEGORIES}/${segment}`;
}

/**
 * Full public_id for a category image.
 * e.g. "dorkari-jinish-bd/categories/panjabi/cover"
 */
export function categoryImagePublicId(slug: string): string {
  const segment = sanitizeFolderSegment(slug);
  return `${categoryFolder(slug)}/cover`;
}

/* ============================================================
 * Temporary staging (media tray before assignment)
 *
 * Used by the bulk-import wizard: images are uploaded to tmp/
 * first, then either renamed into products/<sku>/ on commit or
 * deleted if discarded. This keeps /products/ clean if the user
 * abandons the wizard midway.
 * ============================================================ */

export function tmpFolder(sessionId: string): string {
  const segment = sanitizeFolderSegment(sessionId);
  if (!segment) {
    throw new Error(
      `Invalid sessionId for Cloudinary tmp folder: "${sessionId}"`,
    );
  }
  return `${FOLDER_PREFIX}/${ENTITY.TMP}/${segment}`;
}

/**
 * Generate a unique session ID for a media-tray session.
 * Not crypto-strong — just unique enough for folder isolation.
 */
export function newUploadSessionId(): string {
  const rand = Math.random().toString(36).slice(2, 10);
  const time = Date.now().toString(36);
  return `${time}-${rand}`;
}

export function tmpImagePublicId(sessionId: string, filename: string): string {
  const safe = sanitizeFolderSegment(filename.replace(/\.[^.]+$/, ""));
  return `${tmpFolder(sessionId)}/${safe || "image"}`;
}

/* ============================================================
 * Parsing — reverse of the above
 * ============================================================ */

/**
 * Attempts to extract metadata from a public_id.
 * Returns null if the public_id doesn't match our conventions.
 */
export type ParsedPublicId =
  | { kind: "product"; sku: string; index: number }
  | { kind: "category"; slug: string }
  | { kind: "tmp"; sessionId: string }
  | { kind: "unknown" };

export function parsePublicId(publicId: string): ParsedPublicId {
  const parts = publicId.split("/");
  if (parts.length < 2) return { kind: "unknown" };

  // Strip the folder prefix if present
  const prefixParts = FOLDER_PREFIX.split("/");
  const prefixLen = prefixParts.length;
  const hasPrefix = prefixParts.every((p, i) => parts[i] === p);
  const rest = hasPrefix ? parts.slice(prefixLen) : parts;

  const [entity, owner, ...tail] = rest;

  if (entity === ENTITY.PRODUCTS && owner) {
    const last = tail.join("/");
    const match = /-(\d+)$/.exec(last);
    const index = match ? Number.parseInt(match[1], 10) : 1;
    return { kind: "product", sku: owner, index };
  }

  if (entity === ENTITY.CATEGORIES && owner) {
    return { kind: "category", slug: owner };
  }

  if (entity === ENTITY.TMP && owner) {
    return { kind: "tmp", sessionId: owner };
  }

  return { kind: "unknown" };
}

/* ============================================================
 * Rename between entities (used after wizard commit)
 * ============================================================ */

/**
 * Given a tmp public_id and a target product SKU, produce the
 * final public_id. Cloudinary rename is done via the SDK in
 * manage.ts; this just computes the target.
 */
export function tmpToProductPublicId(
  tmpPublicId: string,
  sku: string,
  index: number,
): string {
  const parsed = parsePublicId(tmpPublicId);
  if (parsed.kind !== "tmp") {
    throw new Error(`Not a tmp public_id: ${tmpPublicId}`);
  }
  return productImagePublicId(sku, index);
}

/* ============================================================
 * URL builder (for the client if needed)
 * ============================================================ */

/**
 * Build a public delivery URL. Optional transforms:
 *   cdnUrl(publicId, "w_400,h_400,c_fill,q_auto,f_auto")
 */
export function cdnUrl(publicId: string, transform?: string): string {
  const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  if (!cloud) {
    // Fall back to server-only env if the public one isn't set
    const cloudName = FOLDER_PREFIX; // prevents a crash — but should be set
    console.warn(
      "[cloudinary] NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME not set; URL may be wrong",
    );
    return transform
      ? `https://res.cloudinary.com/${cloudName}/image/upload/${transform}/${publicId}`
      : `https://res.cloudinary.com/${cloudName}/image/upload/${publicId}`;
  }
  return transform
    ? `https://res.cloudinary.com/${cloud}/image/upload/${transform}/${publicId}`
    : `https://res.cloudinary.com/${cloud}/image/upload/${publicId}`;
}
