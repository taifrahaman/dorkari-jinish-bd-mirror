// src/services/brand.service.ts

import mongoose from "mongoose";
import Brand from "@/models/Brand.model";
import Product from "@/models/Product.model";
import { NotFoundError, ConflictError, BadRequestError } from "@/lib/errors";
import { generateUniqueSlug, normalizeUserSlug } from "@/lib/admin/slug";
import type {
  BrandListQuery,
  BrandResponse,
  BrandSuggestQuery,
  CreateBrandInput,
  UpdateBrandInput,
} from "@/lib/validations/brand.schema";

/* ============================================================
 * Internal types
 * ============================================================ */

type LocalizedName = { en: string; bn: string };

type LeanBrand = {
  _id: mongoose.Types.ObjectId;
  name: LocalizedName;
  slug: string;
  logo?: { url: string; publicId: string; alt?: string };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

/* ============================================================
 * toBrandResponse
 * ============================================================ */

export function toBrandResponse(doc: LeanBrand): BrandResponse {
  return {
    _id: String(doc._id),
    name: {
      en: doc.name?.en ?? "",
      bn: doc.name?.bn ?? "",
    },
    slug: doc.slug,
    logo: doc.logo
      ? {
          url: doc.logo.url,
          publicId: doc.logo.publicId,
          alt: doc.logo.alt ?? "",
        }
      : undefined,
    isActive: doc.isActive,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

/* ============================================================
 * Product counts
 * ============================================================ */

async function loadProductCounts(): Promise<Map<string, number>> {
  const rows = await Product.aggregate<{
    _id: mongoose.Types.ObjectId;
    count: number;
  }>([
    { $match: { deletedAt: null, brand: { $ne: null } } },
    { $group: { _id: "$brand", count: { $sum: 1 } } },
  ]);
  const map = new Map<string, number>();
  for (const r of rows) map.set(String(r._id), r.count);
  return map;
}

/* ============================================================
 * List
 * ============================================================ */

export async function listBrands(query: BrandListQuery): Promise<{
  items: BrandResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> {
  const filter: Record<string, unknown> = {};

  if (query.q) {
    const rx = new RegExp(escapeRegex(query.q), "i");
    filter.$or = [{ "name.en": rx }, { "name.bn": rx }, { slug: rx }];
  }
  if (query.isActive !== undefined) filter.isActive = query.isActive;

  const sortField = query.sortBy === "name" ? "name.en" : query.sortBy;
  const sort: Record<string, 1 | -1> = {
    [sortField]: query.sortOrder === "asc" ? 1 : -1,
  };

  const skip = (query.page - 1) * query.limit;

  const [docs, total, counts] = await Promise.all([
    Brand.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(query.limit)
      .lean<LeanBrand[]>(),
    Brand.countDocuments(filter),
    loadProductCounts(),
  ]);

  return {
    items: docs.map((d) => {
      const res = toBrandResponse(d);
      res.productCount = counts.get(res._id) ?? 0;
      return res;
    }),
    total,
    page: query.page,
    limit: query.limit,
    totalPages: Math.max(1, Math.ceil(total / query.limit)),
  };
}

/* ============================================================
 * Get / Suggest
 * ============================================================ */

export async function getBrandById(id: string): Promise<BrandResponse> {
  assertObjectId(id);

  const doc = await Brand.findById(id).lean<LeanBrand | null>();
  if (!doc) throw new NotFoundError("Brand not found");

  const res = toBrandResponse(doc);
  const counts = await loadProductCounts();
  res.productCount = counts.get(res._id) ?? 0;
  return res;
}

export async function suggestBrands(
  query: BrandSuggestQuery,
): Promise<BrandResponse[]> {
  const rx = new RegExp(escapeRegex(query.q), "i");

  const docs = await Brand.find({
    isActive: true,
    $or: [{ "name.en": rx }, { "name.bn": rx }, { slug: rx }],
  })
    .sort({ "name.en": 1 })
    .limit(query.limit)
    .lean<LeanBrand[]>();

  const counts = await loadProductCounts();
  return docs.map((d) => {
    const res = toBrandResponse(d);
    res.productCount = counts.get(res._id) ?? 0;
    return res;
  });
}

/* ============================================================
 * Create / Update
 * ============================================================ */

export async function createBrand(
  input: CreateBrandInput,
): Promise<BrandResponse> {
  const slug = input.slug
    ? await generateUniqueSlug({
        name: normalizeUserSlug(input.slug),
        model: Brand,
      })
    : await generateUniqueSlug({ name: input.name.en, model: Brand });

  const doc = await Brand.create({
    name: input.name,
    slug,
    logo: input.logo,
    isActive: input.isActive ?? true,
  });

  return toBrandResponse(doc.toObject() as LeanBrand);
}

export async function updateBrand(
  id: string,
  input: UpdateBrandInput,
): Promise<BrandResponse> {
  assertObjectId(id);

  const doc = await Brand.findById(id);
  if (!doc) throw new NotFoundError("Brand not found");

  if (input.slug !== undefined) {
    const normalized = normalizeUserSlug(input.slug);
    if (normalized !== doc.slug) {
      doc.slug = await generateUniqueSlug({
        name: normalized,
        model: Brand,
        excludeId: id,
      });
    }
  }

  if (input.name !== undefined) doc.name = input.name;
  if (input.isActive !== undefined) doc.isActive = input.isActive;
  if (input.logo !== undefined) {
    doc.logo = input.logo === null ? undefined : input.logo;
  }

  await doc.save();

  const res = toBrandResponse(doc.toObject() as LeanBrand);
  const counts = await loadProductCounts();
  res.productCount = counts.get(res._id) ?? 0;
  return res;
}

/* ============================================================
 * Archive / Restore
 * ============================================================ */

export async function archiveBrand(id: string): Promise<{ _id: string }> {
  assertObjectId(id);

  const doc = await Brand.findById(id);
  if (!doc) throw new NotFoundError("Brand not found");
  if (!doc.isActive) throw new ConflictError("Brand is already archived");

  doc.isActive = false;
  await doc.save();
  return { _id: id };
}

export async function restoreBrand(id: string): Promise<BrandResponse> {
  assertObjectId(id);

  const doc = await Brand.findById(id);
  if (!doc) throw new NotFoundError("Brand not found");
  if (doc.isActive) throw new ConflictError("Brand is not archived");

  doc.isActive = true;
  await doc.save();
  return toBrandResponse(doc.toObject() as LeanBrand);
}

/* ============================================================
 * Helpers
 * ============================================================ */

function assertObjectId(id: string): void {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new BadRequestError("Invalid brand id");
  }
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
