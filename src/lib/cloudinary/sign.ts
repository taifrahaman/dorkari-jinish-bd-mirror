// src/lib/cloudinary/sign.ts

import { createHash } from "node:crypto";
import { CLOUD_NAME, FOLDER_PREFIX, SIGNATURE_TTL, cloudinary } from "./client";
import { ENTITY, sanitizeFolderSegment, type EntityType } from "./paths";

/* ============================================================
 * Signed upload params
 *
 * The client never sees the API secret. Instead, it asks our
 * server for a short-lived signature + timestamp + api_key,
 * then POSTs the file directly to Cloudinary's upload endpoint.
 * ============================================================ */

export type SignUploadInput = {
  /** Which entity this upload belongs to (drives folder layout). */
  entity: EntityType;

  /**
   * Owner identifier for the folder:
   *   - products:   SKU (e.g. "DJ-2026-0001")
   *   - categories: slug (e.g. "panjabi")
   *   - tmp:        session id (e.g. "lz9k2p-a3f7c1")
   */
  owner: string;

  /**
   * Optional override for the full public_id (no extension).
   * If omitted, Cloudinary generates a random one inside the folder.
   */
  publicId?: string;

  /** Optional: restrict accepted formats. Defaults to a safe list. */
  allowedFormats?: string[];

  /** Optional: max file size in bytes. Defaults to 5 MB. */
  maxBytes?: number;
};

export type SignedUploadParams = {
  /** Cloudinary cloud name — public. */
  cloudName: string;

  /** Public API key — safe to expose with a signature. */
  apiKey: string;

  /** Unix timestamp (seconds) used in the signature. */
  timestamp: number;

  /** SHA-1 signature. Do not reuse. */
  signature: string;

  /** Target folder inside the cloud. */
  folder: string;

  /** Optional — only present if caller supplied it. */
  publicId?: string;

  /** Restrict upload to these formats. */
  allowedFormats: string;

  /** Client-side hint only (Cloudinary still enforces quotas). */
  maxBytes: number;

  /** Seconds until the signature expires — for client UX. */
  expiresIn: number;

  /** The Cloudinary upload endpoint for POST requests. */
  uploadUrl: string;
};

/* ============================================================
 * Defaults
 * ============================================================ */

const DEFAULT_FORMATS = ["jpg", "jpeg", "png", "webp", "avif"];
const DEFAULT_MAX_BYTES = 5 * 1024 * 1024; // 5 MB

/* ============================================================
 * Signature builder
 *
 * Cloudinary expects:
 *   - only params that go into the request (excluding file,
 *     api_key, resource_type, cloud_name)
 *   - sorted alphabetically by key
 *   - joined as key=value pairs with & between them
 *   - append api_secret
 *   - SHA-1 hash, hex encoded
 * ============================================================ */

function buildSignature(
  params: Record<string, string | number>,
  apiSecret: string,
): string {
  const sorted = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");

  return createHash("sha1").update(`${sorted}${apiSecret}`).digest("hex");
}

/* ============================================================
 * Folder builder (delegates to paths.ts conventions)
 * ============================================================ */

function folderFor(entity: EntityType, owner: string): string {
  const safeOwner = sanitizeFolderSegment(owner);
  if (!safeOwner) {
    throw new Error(`Invalid owner for Cloudinary folder: "${owner}"`);
  }
  return `${FOLDER_PREFIX}/${entity}/${safeOwner}`;
}

/* ============================================================
 * Main helper
 * ============================================================ */

export function createSignedUploadParams(
  input: SignUploadInput,
): SignedUploadParams {
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!apiSecret) {
    throw new Error("CLOUDINARY_API_SECRET is not set — cannot sign uploads.");
  }

  const config = cloudinary.config();
  const apiKey = config.api_key;
  if (!apiKey) {
    throw new Error("Cloudinary API key is not configured. Check .env.local.");
  }

  const folder = folderFor(input.entity, input.owner);
  const allowedFormats = (input.allowedFormats ?? DEFAULT_FORMATS).join(",");
  const maxBytes = input.maxBytes ?? DEFAULT_MAX_BYTES;

  const timestamp = Math.floor(Date.now() / 1000);

  // Params that participate in the signature — must match exactly
  // what the client sends (except file/api_key/cloud_name).
  const signable: Record<string, string | number> = {
    timestamp,
    folder,
    allowed_formats: allowedFormats,
  };

  if (input.publicId) {
    // Cloudinary requires `public_id` at the folder level:
    //   folder=…&public_id=<name>  →  stored at <folder>/<name>
    signable.public_id = input.publicId;
  }

  const signature = buildSignature(signable, apiSecret);

  return {
    cloudName: CLOUD_NAME,
    apiKey,
    timestamp,
    signature,
    folder,
    publicId: input.publicId,
    allowedFormats,
    maxBytes,
    expiresIn: SIGNATURE_TTL,
    uploadUrl: `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
  };
}

/* ============================================================
 * Batch signing — same session, many uploads
 *
 * For the media-tray wizard: the admin drops N images and we
 * sign each one. Using a single `entity: tmp, owner: sessionId`
 * keeps them isolated under tmp/<sessionId>/.
 * ============================================================ */

export type SignBatchItem = {
  owner: string;
  publicId?: string;
};

export type SignBatchInput = {
  entity: EntityType;
  items: SignBatchItem[];
  allowedFormats?: string[];
  maxBytes?: number;
};

export function createSignedUploadBatch(
  input: SignBatchInput,
): SignedUploadParams[] {
  return input.items.map((item) =>
    createSignedUploadParams({
      entity: input.entity,
      owner: item.owner,
      publicId: item.publicId,
      allowedFormats: input.allowedFormats,
      maxBytes: input.maxBytes,
    }),
  );
}

/* ============================================================
 * Constants exposed for client-side validation
 * ============================================================ */

export const UPLOAD_FORMATS = DEFAULT_FORMATS;
export const UPLOAD_MAX_BYTES = DEFAULT_MAX_BYTES;

/* ============================================================
 * Convenience presets
 * ============================================================ */

export const signProductImage = (sku: string, index: number) =>
  createSignedUploadParams({
    entity: ENTITY.PRODUCTS,
    owner: sku,
    publicId: `${sanitizeFolderSegment(sku)}-${index}`,
  });

export const signCategoryImage = (slug: string) =>
  createSignedUploadParams({
    entity: ENTITY.CATEGORIES,
    owner: slug,
    publicId: "cover",
  });

export const signTmpImage = (sessionId: string, filename: string) => {
  const base = filename.replace(/\.[^.]+$/, "");
  return createSignedUploadParams({
    entity: ENTITY.TMP,
    owner: sessionId,
    publicId: sanitizeFolderSegment(base) || "image",
  });
};
