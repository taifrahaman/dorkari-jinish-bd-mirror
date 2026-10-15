// src/lib/storefront/product-mapper.ts

import type { Types } from "mongoose";

/* ============================================================
 * Public DTO — the ONLY product shape a shopper can ever see.
 *
 * Deliberately excludes: costPrice, supplier, costHistory,
 * totalRevenue, totalSold, lowStockThreshold, sku, barcode,
 * taxRate, and raw stock counts.
 * ============================================================ */

export type StorefrontLocalizedName = { en: string; bn: string };

export type StorefrontProduct = {
  id: string;
  slug: string;
  name: StorefrontLocalizedName;
  description: StorefrontLocalizedName | null;
  price: number;
  compareAtPrice: number | null;
  category: {
    id: string;
    slug: string;
    name: StorefrontLocalizedName;
  };
  mainCategory: {
    id: string;
    slug: string;
    name: StorefrontLocalizedName;
  } | null;
  brand: {
    id: string;
    slug: string;
    name: StorefrontLocalizedName;
  } | null;
  images: Array<{ url: string; alt: string }>;
  colors: Array<{
    hex: string;
    name: StorefrontLocalizedName | null;
  }>;
  inStock: boolean;
  isFeatured: boolean;
  averageRating: number;
  totalReviews: number;
  createdAt: string;
};

/**
 * Detail-page superset of StorefrontProduct. Adds the fields that
 * are too heavy for the grid but needed on a single product page.
 */
export type StorefrontProductDetail = StorefrontProduct & {
  specifications: Array<{ key: string; value: string }>;
  boxContents: Array<{ en: string; bn: string }>;
};

/* ============================================================
 * Lean doc shape — what the service hands us after
 * .populate(POPULATE).lean().
 * ============================================================ */

type LocalizedName = { en: string; bn: string };

type PopulatedRef = {
  _id: Types.ObjectId;
  name: LocalizedName;
  slug: string;
};

type LeanStorefrontDoc = {
  _id: Types.ObjectId;
  name: LocalizedName;
  slug: string;
  description?: { en?: string; bn?: string };
  price: number;
  compareAtPrice?: number | null;
  category: PopulatedRef;
  mainCategory?: PopulatedRef | null;
  brand?: PopulatedRef | null;
  stock: number;
  images?: Array<{ url: string; alt?: string }>;
  colors?: Array<{ hex: string; name?: { en?: string; bn?: string } }>;
  specifications?: Record<string, unknown>;
  boxContents?: Array<{ en?: string; bn?: string }>;
  isFeatured: boolean;
  averageRating?: number;
  totalReviews?: number;
  createdAt: Date;
};

/* ============================================================
 * Helpers
 * ============================================================ */

/**
 * Bidirectional fallback: an empty or missing `en` falls back to `bn`,
 * and vice versa. Products always have both, but reviews and customer-
 * submitted content may only fill one side.
 */
export function toLocalized(
  name: { en?: string; bn?: string } | undefined,
): StorefrontLocalizedName {
  const en = name?.en ?? "";
  const bn = name?.bn ?? "";
  return {
    en: en || bn,
    bn: bn || en,
  };
}

function toRef(
  ref: PopulatedRef | null | undefined,
): { id: string; slug: string; name: StorefrontLocalizedName } | null {
  if (!ref) return null;
  return {
    id: String(ref._id),
    slug: ref.slug,
    name: toLocalized(ref.name),
  };
}

/* ============================================================
 * List mapper
 * ============================================================ */

export function toStorefrontProduct(doc: LeanStorefrontDoc): StorefrontProduct {
  return {
    id: String(doc._id),
    slug: doc.slug,
    name: toLocalized(doc.name),
    description: doc.description
      ? {
          en: doc.description.en ?? "",
          bn: doc.description.bn ?? doc.description.en ?? "",
        }
      : null,
    price: doc.price,
    compareAtPrice:
      doc.compareAtPrice === undefined || doc.compareAtPrice === null
        ? null
        : doc.compareAtPrice,
    category: toRef(doc.category) ?? {
      id: "",
      slug: "",
      name: { en: "", bn: "" },
    },
    mainCategory: toRef(doc.mainCategory),
    brand: toRef(doc.brand),
    images: (doc.images ?? []).map((img) => ({
      url: img.url,
      alt: img.alt ?? "",
    })),
    colors: (doc.colors ?? []).map((c) => ({
      hex: c.hex,
      name: c.name
        ? {
            en: c.name.en ?? "",
            bn: c.name.bn ?? c.name.en ?? "",
          }
        : null,
    })),
    inStock: doc.stock > 0,
    isFeatured: doc.isFeatured,
    averageRating: doc.averageRating ?? 0,
    totalReviews: doc.totalReviews ?? 0,
    createdAt: doc.createdAt.toISOString(),
  };
}

/* ============================================================
 * Detail mapper
 * ============================================================ */

export function toStorefrontProductDetail(
  doc: LeanStorefrontDoc,
): StorefrontProductDetail {
  const base = toStorefrontProduct(doc);

  const specifications = Object.entries(doc.specifications ?? {}).map(
    ([key, value]) => ({
      key,
      value: typeof value === "string" ? value : String(value),
    }),
  );

  const boxContents = (doc.boxContents ?? [])
    .map((row) => ({
      en: row.en ?? "",
      bn: row.bn ?? row.en ?? "",
    }))
    // Drop fully-empty rows that a half-filled admin form might leave behind.
    .filter((row) => row.en.trim() !== "" || row.bn.trim() !== "");

  return {
    ...base,
    specifications,
    boxContents,
  };
}
