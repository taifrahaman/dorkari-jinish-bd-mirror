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
 *   dorkari-jinish-bd/brands/walton/logo
 *   dorkari-jinish-bd/tmp/8f3a1c9e-...           ← staging tray uploads
 * ============================================================ */

export const ENTITY = {
  PRODUCTS: "products",
  CATEGORIES: "categories",
  BRANDS: "brands",
  TMP: "tmp",
} as const;

export type EntityType = (typeof ENTITY)[keyof typeof ENTITY];

/* ============================================================
 * Sanitizers
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

export function productFolder(sku: string): string {
  const segment = sanitizeFolderSegment(sku);
  if (!segment) {
    throw new Error(`Invalid SKU for Cloudinary folder: "${sku}"`);
  }
  return `${FOLDER_PREFIX}/${ENTITY.PRODUCTS}/${segment}`;
}

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

export function categoryFolder(slug: string): string {
  const segment = sanitizeFolderSegment(slug);
  if (!segment) {
    throw new Error(`Invalid slug for Cloudinary folder: "${slug}"`);
  }
  return `${FOLDER_PREFIX}/${ENTITY.CATEGORIES}/${segment}`;
}

export function categoryImagePublicId(slug: string): string {
  const segment = sanitizeFolderSegment(slug);
  return `${categoryFolder(slug)}/cover`;
}

/* ============================================================
 * Brand paths
 * ============================================================ */

export function brandFolder(slug: string): string {
  const segment = sanitizeFolderSegment(slug);
  if (!segment) {
    throw new Error(`Invalid slug for Cloudinary folder: "${slug}"`);
  }
  return `${FOLDER_PREFIX}/${ENTITY.BRANDS}/${segment}`;
}

export function brandLogoPublicId(slug: string): string {
  const segment = sanitizeFolderSegment(slug);
  return `${brandFolder(slug)}/logo`;
}

/* ============================================================
 * Temporary staging
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
 * Parsing
 * ============================================================ */

export type ParsedPublicId =
  | { kind: "product"; sku: string; index: number }
  | { kind: "category"; slug: string }
  | { kind: "brand"; slug: string }
  | { kind: "tmp"; sessionId: string }
  | { kind: "unknown" };

export function parsePublicId(publicId: string): ParsedPublicId {
  const parts = publicId.split("/");
  if (parts.length < 2) return { kind: "unknown" };

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

  if (entity === ENTITY.BRANDS && owner) {
    return { kind: "brand", slug: owner };
  }

  if (entity === ENTITY.TMP && owner) {
    return { kind: "tmp", sessionId: owner };
  }

  return { kind: "unknown" };
}

/* ============================================================
 * Rename between entities
 * ============================================================ */

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
 * URL builder
 * ============================================================ */

export function cdnUrl(publicId: string, transform?: string): string {
  const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  if (!cloud) {
    const cloudName = FOLDER_PREFIX;
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
