// src/lib/cloudinary/client.ts

import { v2 as cloudinary, type ConfigOptions } from "cloudinary";

/* ============================================================
 * Environment validation
 * ============================================================ */

function getEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === "") {
    throw new Error(
      `Missing required environment variable: ${name}. ` +
        `Add it to .env.local — see Cloudinary Console → Dashboard.`,
    );
  }
  return value;
}

/* ============================================================
 * Config
 * ============================================================ */

const CLOUD_NAME_VALUE: string = getEnv("CLOUDINARY_CLOUD_NAME");
const API_KEY_VALUE: string = getEnv("CLOUDINARY_API_KEY");
const API_SECRET_VALUE: string = getEnv("CLOUDINARY_API_SECRET");

const config: ConfigOptions = {
  cloud_name: CLOUD_NAME_VALUE,
  api_key: API_KEY_VALUE,
  api_secret: API_SECRET_VALUE,
  secure: true,
};

/* ============================================================
 * Singleton configuration
 *
 * `cloudinary.config()` is idempotent — safe to call multiple
 * times. We guard with a module-level flag anyway so hot reload
 * in dev doesn't re-run it on every request.
 * ============================================================ */

let configured = false;

export function ensureCloudinaryConfig(): void {
  if (configured) return;
  cloudinary.config(config);
  configured = true;
}

// Configure immediately on module load so callers don't need to
// remember to call ensureCloudinaryConfig() first.
ensureCloudinaryConfig();

/* ============================================================
 * Exports
 * ============================================================ */

export { cloudinary };

/** Cloud name — non-optional, safe to expose. */
export const CLOUD_NAME: string = CLOUD_NAME_VALUE;

/** Folder prefix used for every upload (from env). */
export const FOLDER_PREFIX: string =
  process.env.CLOUDINARY_FOLDER?.trim() || "dorkari-jinish-bd";

/** Signature TTL in seconds (default 10 minutes). */
export const SIGNATURE_TTL: number = Number.parseInt(
  process.env.CLOUDINARY_SIGNATURE_TTL ?? "600",
  10,
);
