// src/lib/admin/slug.ts

import slugifyLib from "slugify";

/* ============================================================
 * Types
 * ============================================================ */

/**
 * Minimal structural type for any Mongoose model that has a
 * unique `slug` field. Avoids importing concrete models here
 * (which would create circular dependency risk).
 */
type SlugCheckModel = {
  exists(filter: Record<string, unknown>): Promise<{ _id: unknown } | null>;
};

export type GenerateUniqueSlugInput = {
  /** Raw name — usually `product.name.en` or `category.name`. */
  name: string;
  /** Model to check collisions against (Product or Category). */
  model: SlugCheckModel;
  /**
   * When updating an existing document, pass its `_id` here so the
   * generator doesn't treat the doc's own slug as a collision.
   */
  excludeId?: string;
  /**
   * Optional extra filter (e.g. `{ deletedAt: null }`). Leave unset
   * to consider every document, which matches the DB unique index.
   */
  extraFilter?: Record<string, unknown>;
};

/* ============================================================
 * Pure slug generator
 * ============================================================ */

const SLUG_OPTIONS = {
  replacement: "-",
  lower: true,
  strict: true,
  trim: true,
} as const;

/**
 * Converts a name into a URL-safe slug. No database access.
 * Returns an empty string if nothing usable remains.
 */
export function slugifyName(name: string): string {
  return slugifyLib(name, SLUG_OPTIONS);
}

/**
 * Same as `slugifyName` but throws when the result is empty.
 * Use when a slug is required to proceed.
 */
export function requireSlug(name: string, label = "name"): string {
  const slug = slugifyName(name);
  if (!slug) {
    throw new Error(
      `Cannot generate slug from empty or non-Latin ${label}: "${name}"`,
    );
  }
  return slug;
}

/* ============================================================
 * Validation
 * ============================================================ */

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function isValidSlug(slug: string): boolean {
  return SLUG_RE.test(slug);
}

/* ============================================================
 * Unique slug generator (DB-aware)
 * ============================================================ */

const MAX_SUFFIX_ATTEMPTS = 100;

/**
 * Generates a slug that is guaranteed not to collide with an
 * existing document. Appends `-2`, `-3`, … on collision.
 *
 * Strategy:
 *   1. Slugify the name.
 *   2. Check the model for an existing doc with that slug.
 *   3. If found, try `base-2`, `base-3`, …
 *   4. Beyond `MAX_SUFFIX_ATTEMPTS`, fall back to a timestamp
 *      suffix so we never loop forever.
 */
export async function generateUniqueSlug(
  input: GenerateUniqueSlugInput,
): Promise<string> {
  const base = requireSlug(input.name);
  const extra = input.extraFilter ?? {};

  // 1st attempt: base slug as-is
  if (await slugIsFree(base, input.model, input.excludeId, extra)) {
    return base;
  }

  // 2nd..N attempts: base-2, base-3, …
  for (let i = 2; i <= MAX_SUFFIX_ATTEMPTS; i += 1) {
    const candidate = `${base}-${i}`;
    if (await slugIsFree(candidate, input.model, input.excludeId, extra)) {
      return candidate;
    }
  }

  // Absolute fallback — practically unreachable
  const stamp = Date.now().toString(36);
  const fallback = `${base}-${stamp}`;
  if (await slugIsFree(fallback, input.model, input.excludeId, extra)) {
    return fallback;
  }

  throw new Error(
    `Could not generate a unique slug for "${input.name}" after ${MAX_SUFFIX_ATTEMPTS + 1} attempts`,
  );
}

async function slugIsFree(
  slug: string,
  model: SlugCheckModel,
  excludeId: string | undefined,
  extra: Record<string, unknown>,
): Promise<boolean> {
  const filter: Record<string, unknown> = { slug, ...extra };
  if (excludeId) {
    filter._id = { $ne: excludeId };
  }
  const existing = await model.exists(filter);
  return existing === null;
}

/* ============================================================
 * Validation of user-supplied slugs
 * ============================================================ */

/**
 * Used when the admin types a custom slug. Normalizes it and
 * validates the shape. Returns the normalized slug.
 */
export function normalizeUserSlug(input: string): string {
  const normalized = slugifyLib(input, SLUG_OPTIONS);
  if (!normalized || !isValidSlug(normalized)) {
    throw new Error(
      `Invalid slug: "${input}". Use lowercase letters, numbers, and hyphens.`,
    );
  }
  return normalized;
}

/* ============================================================
 * Convenience wrappers (optional — keep callers terse)
 * ============================================================ */

export function productSlugFromName(name: string): string {
  return requireSlug(name, "product name");
}

export function categorySlugFromName(name: string): string {
  return requireSlug(name, "category name");
}
