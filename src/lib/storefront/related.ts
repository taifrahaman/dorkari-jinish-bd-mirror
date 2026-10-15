// src/lib/storefront/related.ts

import type {
  StorefrontProduct,
  StorefrontProductDetail,
} from "./product-mapper";
import { toBaseProduct } from "./product-mapper";

/* ============================================================
 * Related-products ranking — weighted cosine similarity.
 *
 * Each product is projected into a sparse feature vector. Similarity
 * is cosine over shared feature weights. Rarity is handled
 * implicitly: features shared by every product contribute little to
 * any pair, while a rare feature (e.g. a niche category) dominates
 * the similarity of the two products that share it.
 * ============================================================ */

const WEIGHTS = {
  leafCategory: 1.0,
  mainCategory: 0.5,
  brand: 0.8,
  priceTier: 0.3,
  color: 0.4,
  specKey: 0.2,
  featured: 0.1,
} as const;

/* Price tiers, in BDT. Absolute, so vectors stay comparable across
 * catalogs and don't shift when the product range changes. */
const PRICE_TIERS: Array<[number, number]> = [
  [0, 2_000],
  [2_000, 10_000],
  [10_000, 30_000],
  [30_000, 100_000],
  [100_000, Number.POSITIVE_INFINITY],
];

type FeatureVector = Map<string, number>;

/* ------------------------------------------------------------ */

function priceTierIndex(price: number): number {
  return PRICE_TIERS.findIndex(([min, max]) => price >= min && price < max);
}

function normalizeSpecKey(key: string): string {
  return key.toLowerCase().replace(/[\s_\-.]/g, "");
}

/**
 * Build a feature vector from one product.
 * First write wins — duplicate features (e.g. two color entries with
 * the same hex) don't stack.
 */
function buildVector(p: StorefrontProductDetail): FeatureVector {
  const v: FeatureVector = new Map();

  const add = (key: string, weight: number) => {
    if (!v.has(key)) v.set(key, weight);
  };

  if (p.category.slug) add(`cat:${p.category.slug}`, WEIGHTS.leafCategory);
  if (p.mainCategory?.slug) {
    add(`main:${p.mainCategory.slug}`, WEIGHTS.mainCategory);
  }
  if (p.brand?.slug) add(`brand:${p.brand.slug}`, WEIGHTS.brand);

  const tier = priceTierIndex(p.price);
  if (tier >= 0) add(`price:${tier}`, WEIGHTS.priceTier);

  for (const c of p.colors) {
    add(`color:${c.hex.toLowerCase()}`, WEIGHTS.color);
  }

  for (const spec of p.specifications) {
    const k = normalizeSpecKey(spec.key);
    if (k) add(`spec:${k}`, WEIGHTS.specKey);
  }

  if (p.isFeatured) add("featured", WEIGHTS.featured);

  return v;
}

function magnitude(v: FeatureVector): number {
  let sum = 0;
  for (const w of v.values()) sum += w * w;
  return Math.sqrt(sum);
}

function cosineSimilarity(
  a: FeatureVector,
  aMag: number,
  b: FeatureVector,
): number {
  if (aMag === 0) return 0;

  const bMag = magnitude(b);
  if (bMag === 0) return 0;

  // Iterate over the smaller map for the dot product.
  const [small, large] = a.size <= b.size ? [a, b] : [b, a];
  let dot = 0;
  for (const [k, v] of small) {
    const other = large.get(k);
    if (other !== undefined) dot += v * other;
  }

  return dot / (aMag * bMag);
}

/* ------------------------------------------------------------ */

/**
 * Rank candidates against the current product.
 *
 * Tiebreak order (visible quality signals, then recency):
 *   1. higher averageRating
 *   2. higher totalReviews
 *   3. newer createdAt
 *
 * If fewer than `limit` candidates exist, the remainder is topped up
 * from featured products not already in the result set.
 */
export function rankRelated(
  current: StorefrontProductDetail,
  candidates: StorefrontProductDetail[],
  limit: number,
): StorefrontProduct[] {
  const currentVec = buildVector(current);
  const currentMag = magnitude(currentVec);

  const scored = candidates
    .filter((c) => c.id !== current.id)
    .map((c) => {
      const vec = buildVector(c);
      return {
        candidate: c,
        score: cosineSimilarity(currentVec, currentMag, vec),
      };
    });

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.candidate.averageRating !== a.candidate.averageRating) {
      return b.candidate.averageRating - a.candidate.averageRating;
    }
    if (b.candidate.totalReviews !== a.candidate.totalReviews) {
      return b.candidate.totalReviews - a.candidate.totalReviews;
    }
    return b.candidate.createdAt.localeCompare(a.candidate.createdAt);
  });

  const picked = scored.slice(0, limit).map((x) => toBaseProduct(x.candidate));

  if (picked.length >= limit) return picked;

  // Fallback: top up with featured products.
  const included = new Set(picked.map((p) => p.id));
  included.add(current.id);

  const fallback = candidates
    .filter((c) => c.isFeatured && !included.has(c.id))
    .slice(0, limit - picked.length)
    .map(toBaseProduct);

  return [...picked, ...fallback];
}
