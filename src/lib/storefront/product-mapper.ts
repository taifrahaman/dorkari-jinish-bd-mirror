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
  /** Root ancestor of `category`. Equal to `category` when the product sits on a root. */
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

/* ============================================================
 * Lean doc shape — what listStorefrontProducts() will hand us
 * after .populate(POPULATE).lean().
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
  isFeatured: boolean;
  averageRating?: number;
  totalReviews?: number;
  createdAt: Date;
};

/* ============================================================
 * Mapper
 * ============================================================ */

function toLocalized(name: LocalizedName | undefined): StorefrontLocalizedName {
  return {
    en: name?.en ?? "",
    bn: name?.bn ?? name?.en ?? "",
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
