// src/lib/admin/orders/order-number.ts

import mongoose from "mongoose";

/* ============================================================
 * Order number format
 *
 *   ORD-YYYY-NNNN
 *
 *   ORD   → prefix
 *   YYYY  → year of creation
 *   NNNN  → zero-padded sequence (resets each year)
 *
 * Examples:
 *   ORD-2026-0001
 *   ORD-2026-0042
 *   ORD-2027-0001
 * ============================================================ */

export const ORDER_NUMBER_PREFIX = "ORD";
export const ORDER_SEQUENCE_WIDTH = 5;
export const ORDER_MAX_PER_YEAR = 10 ** ORDER_SEQUENCE_WIDTH - 1;

const RE = new RegExp(
  `^${ORDER_NUMBER_PREFIX}-(\\d{4})-(\\d{${ORDER_SEQUENCE_WIDTH}})$`,
);

/* ============================================================
 * Types
 * ============================================================ */

type OrderModel = {
  exists(filter: Record<string, unknown>): Promise<{ _id: unknown } | null>;
  findOne(
    filter: Record<string, unknown>,
    projection?: Record<string, 0 | 1>,
  ): {
    sort(spec: Record<string, 1 | -1>): {
      lean(): Promise<{ orderNumber?: string } | null>;
    };
  };
};

/* ============================================================
 * Formatting / parsing
 * ============================================================ */

export function formatOrderNumber(year: number, sequence: number): string {
  if (!Number.isInteger(year) || year < 2000 || year > 9999) {
    throw new Error(`Invalid year for order number: ${year}`);
  }
  if (!Number.isInteger(sequence) || sequence < 1) {
    throw new Error(`Invalid sequence for order number: ${sequence}`);
  }
  if (sequence > ORDER_MAX_PER_YEAR) {
    throw new Error(
      `Order sequence overflow: ${sequence} exceeds max ${ORDER_MAX_PER_YEAR} for year ${year}`,
    );
  }
  return `${ORDER_NUMBER_PREFIX}-${year}-${String(sequence).padStart(
    ORDER_SEQUENCE_WIDTH,
    "0",
  )}`;
}

export function parseOrderNumber(
  orderNumber: string,
): { year: number; sequence: number } | null {
  const match = RE.exec(orderNumber);
  if (!match) return null;
  return {
    year: Number.parseInt(match[1], 10),
    sequence: Number.parseInt(match[2], 10),
  };
}

export function isValidOrderNumber(orderNumber: string): boolean {
  return RE.test(orderNumber);
}

/* ============================================================
 * Generator
 * ============================================================ */

export async function generateOrderNumber(
  model: OrderModel,
  year = new Date().getFullYear(),
): Promise<string> {
  const prefix = `${ORDER_NUMBER_PREFIX}-${year}-`;

  const highest = await model
    .findOne({ orderNumber: { $regex: `^${prefix}` } }, { orderNumber: 1 })
    .sort({ orderNumber: -1 })
    .lean();

  let nextSeq = 1;
  if (highest?.orderNumber) {
    const parsed = parseOrderNumber(highest.orderNumber);
    if (parsed && parsed.year === year) {
      nextSeq = parsed.sequence + 1;
    }
  }

  if (nextSeq > ORDER_MAX_PER_YEAR) {
    throw new Error(
      `Order sequence exhausted for year ${year} (max ${ORDER_MAX_PER_YEAR})`,
    );
  }

  // Verify uniqueness — guards against concurrent creates
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const candidate = formatOrderNumber(year, nextSeq);
    const collision = await model.exists({ orderNumber: candidate });
    if (!collision) return candidate;
    nextSeq += 1;
    if (nextSeq > ORDER_MAX_PER_YEAR) {
      throw new Error(
        `Order sequence exhausted for year ${year} (max ${ORDER_MAX_PER_YEAR})`,
      );
    }
  }

  throw new Error(
    `Could not generate a unique order number for year ${year} after 20 attempts`,
  );
}

/** Re-export for convenience. */
export { mongoose };
