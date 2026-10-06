// src/lib/admin/sku.ts

/* ============================================================
 * SKU format
 *
 *   DJ-YYYY-NNNN
 *
 *   DJ    → brand prefix (Dorkari Jinish)
 *   YYYY  → creation year (resets sequence each year)
 *   NNNN  → zero-padded sequence (0001, 0002, …, 9999)
 *
 * Examples:
 *   DJ-2026-0001
 *   DJ-2026-0042
 *   DJ-2027-0001
 * ============================================================ */

export const SKU_PREFIX = "DJ";
export const SKU_SEQUENCE_WIDTH = 4;
export const SKU_MAX_PER_YEAR = 10 ** SKU_SEQUENCE_WIDTH - 1; // 9999

/* ============================================================
 * Types
 * ============================================================ */

/**
 * Structural type for any model that has a unique `sku` field.
 * Avoids importing Product here (prevents circular deps).
 */
type SkuCheckModel = {
  exists(filter: Record<string, unknown>): Promise<{ _id: unknown } | null>;
};

/**
 * Model that can return the highest existing SKU for a given
 * prefix — used to seed the next sequence number.
 */
type SkuFindOneModel = {
  findOne(
    filter: Record<string, unknown>,
    projection?: Record<string, 0 | 1>,
  ): {
    sort(spec: Record<string, 1 | -1>): {
      lean(): Promise<{ sku?: string } | null>;
    };
  };
};

export type GenerateSkuModel = SkuCheckModel & SkuFindOneModel;

export type GenerateSkuInput = {
  /** Model to query against (usually the Product model). */
  model: GenerateSkuModel;
  /** Override the year (defaults to current year). Useful for tests. */
  year?: number;
};

/* ============================================================
 * Regex — matches our full format
 * ============================================================ */

const SKU_RE = new RegExp(
  `^${SKU_PREFIX}-(\\d{4})-(\\d{${SKU_SEQUENCE_WIDTH}})$`,
);

/* ============================================================
 * Formatting / parsing
 * ============================================================ */

export function formatSku(year: number, sequence: number): string {
  if (!Number.isInteger(year) || year < 2000 || year > 9999) {
    throw new Error(`Invalid year for SKU: ${year}`);
  }
  if (!Number.isInteger(sequence) || sequence < 1) {
    throw new Error(`Invalid sequence for SKU: ${sequence}`);
  }
  if (sequence > SKU_MAX_PER_YEAR) {
    throw new Error(
      `SKU sequence overflow: ${sequence} exceeds max ${SKU_MAX_PER_YEAR} for year ${year}`,
    );
  }
  return `${SKU_PREFIX}-${year}-${String(sequence).padStart(SKU_SEQUENCE_WIDTH, "0")}`;
}

export function parseSku(
  sku: string,
): { year: number; sequence: number } | null {
  const match = SKU_RE.exec(sku);
  if (!match) return null;
  return {
    year: Number.parseInt(match[1], 10),
    sequence: Number.parseInt(match[2], 10),
  };
}

export function isValidSku(sku: string): boolean {
  return SKU_RE.test(sku);
}

/* ============================================================
 * Unique SKU generator
 * ============================================================ */

/**
 * Produces the next `DJ-YYYY-NNNN` SKU for the current year.
 *
 * Strategy:
 *   1. Find the highest existing SKU for this year
 *      (sort by `sku` descending — lexicographic works because
 *      the format is fixed-width).
 *   2. Extract its sequence, add 1.
 *   3. If no SKUs exist yet for this year, start at 0001.
 *
 * Uniqueness is verified with a final `exists()` check — belt
 * and braces against race conditions (two creates in the same ms).
 */
export async function generateSku(input: GenerateSkuInput): Promise<string> {
  const year = input.year ?? new Date().getFullYear();
  const prefix = `${SKU_PREFIX}-${year}-`;

  const highest = await input.model
    .findOne({ sku: { $regex: `^${prefix}` } }, { sku: 1 })
    .sort({ sku: -1 })
    .lean();

  let nextSeq = 1;
  if (highest?.sku) {
    const parsed = parseSku(highest.sku);
    if (parsed && parsed.year === year) {
      nextSeq = parsed.sequence + 1;
    }
  }

  if (nextSeq > SKU_MAX_PER_YEAR) {
    throw new Error(
      `SKU sequence exhausted for year ${year} (max ${SKU_MAX_PER_YEAR})`,
    );
  }

  // Verify uniqueness. In practice this loop almost never runs
  // more than once, but guards against a race on concurrent creates.
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const candidate = formatSku(year, nextSeq);
    const collision = await input.model.exists({ sku: candidate });
    if (!collision) return candidate;
    nextSeq += 1;
    if (nextSeq > SKU_MAX_PER_YEAR) {
      throw new Error(
        `SKU sequence exhausted for year ${year} (max ${SKU_MAX_PER_YEAR})`,
      );
    }
  }

  throw new Error(
    `Could not generate a unique SKU for year ${year} after 20 attempts`,
  );
}

/* ============================================================
 * Manual SKU validation
 *
 * Admins can override the auto-generated SKU. In that case we:
 *   - normalize whitespace / case
 *   - reject empty
 *   - reject duplicates (unless editing the same doc via excludeId)
 * ============================================================ */

export function normalizeSkuInput(input: string): string {
  return input.trim().toUpperCase().replace(/\s+/g, "-");
}

export async function ensureSkuIsUnique(
  sku: string,
  model: SkuCheckModel,
  excludeId?: string,
): Promise<void> {
  const filter: Record<string, unknown> = { sku };
  if (excludeId) {
    filter._id = { $ne: excludeId };
  }
  const existing = await model.exists(filter);
  if (existing) {
    throw new Error(`SKU "${sku}" is already in use`);
  }
}

/* ============================================================
 * High-level resolver used by the product service
 * ============================================================ */

/**
 * Given an optional admin-supplied SKU and a model, returns the
 * SKU that should be stored on the new/updated product.
 *
 *   - If `inputSku` is provided, it is normalized, validated,
 *     and checked for uniqueness.
 *   - Otherwise, a new SKU is auto-generated.
 */
export async function resolveSku(
  inputSku: string | undefined,
  model: GenerateSkuModel,
  excludeId?: string,
): Promise<string> {
  if (inputSku && inputSku.trim().length > 0) {
    const normalized = normalizeSkuInput(inputSku);
    await ensureSkuIsUnique(normalized, model, excludeId);
    return normalized;
  }
  return generateSku({ model });
}

/* ============================================================
 * Sequential bulk generator
 *
 * Used by bulk create / import: reserves a contiguous block of
 * N SKUs up front so we don't query the DB once per row.
 * ============================================================ */

export async function generateSkuBatch(
  count: number,
  model: GenerateSkuModel,
  year?: number,
): Promise<string[]> {
  if (!Number.isInteger(count) || count < 1) {
    throw new Error(`Batch size must be a positive integer, got ${count}`);
  }

  const y = year ?? new Date().getFullYear();
  const prefix = `${SKU_PREFIX}-${y}-`;

  const highest = await model
    .findOne({ sku: { $regex: `^${prefix}` } }, { sku: 1 })
    .sort({ sku: -1 })
    .lean();

  let startSeq = 1;
  if (highest?.sku) {
    const parsed = parseSku(highest.sku);
    if (parsed && parsed.year === y) {
      startSeq = parsed.sequence + 1;
    }
  }

  if (startSeq + count - 1 > SKU_MAX_PER_YEAR) {
    throw new Error(
      `Not enough SKU space for year ${y}: need ${count}, have ${SKU_MAX_PER_YEAR - startSeq + 1}`,
    );
  }

  const out: string[] = [];
  for (let i = 0; i < count; i += 1) {
    out.push(formatSku(y, startSeq + i));
  }
  return out;
}
