// src/lib/product/mock-api.ts
//
// Stand-in for GET /api/products/:slug. Callers only ever see
// `fetchProductDetail`; everything else disappears once the real endpoint exists.

import type { ProductDetail } from "./types";
import { DUMMY_PRODUCT } from "./dummy-product";

export const SIMULATED_LATENCY_MS = 600;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function fetchProductDetail(
  slug: string,
  delayMs: number = SIMULATED_LATENCY_MS,
): Promise<ProductDetail | null> {
  await wait(delayMs);
  // Only one dummy product exists right now, so any slug resolves to it.
  // Once real data lands, look up by slug and return null on a genuine miss.
  void slug;
  return DUMMY_PRODUCT;
}
