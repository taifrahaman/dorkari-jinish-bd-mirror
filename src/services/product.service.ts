// src/services/product.service.ts

import mongoose from "mongoose";
import { revalidateTag } from "next/cache";
import { STOREFRONT_PRODUCTS_TAG } from "@/lib/storefront/cache-tags";
import Product from "@/models/Product.model";
import Category from "@/models/Category.model";
import Brand from "@/models/Brand.model";
import { NotFoundError, ConflictError, BadRequestError } from "@/lib/errors";
import { generateUniqueSlug, normalizeUserSlug } from "@/lib/admin/slug";
import {
  resolveSku,
  generateSkuBatch,
  ensureSkuIsUnique,
} from "@/lib/admin/sku";
import {
  deleteProductFolder,
  deleteImageRefs,
  promoteProductImages,
  syncProductImages,
  type ImageRef,
} from "@/services/cloudinary.service";
import type {
  CreateProductInput,
  UpdateProductInput,
  ProductListQuery,
  ProductResponse,
  ProductSupplierInput,
} from "@/lib/validations/product.schema";
import type {
  BulkCreateProductInput,
  ImportPayload,
  ImportResult,
  ImportRowResult,
  ImportDuplicateMode,
  CsvRow,
} from "@/lib/validations/import.schema";
import { csvRowToProductPartial } from "@/lib/validations/import.schema";
import type {
  BulkResult,
  Paginated,
  BulkRowResult,
} from "@/lib/validations/common.schema";
import { LOW_STOCK_THRESHOLD } from "@/lib/validations/product.schema";
import {
  toStorefrontProduct,
  toStorefrontProductDetail,
  type StorefrontProduct,
  type StorefrontProductDetail,
} from "@/lib/storefront/product-mapper";
import { rankRelated } from "@/lib/storefront/related";

/* ============================================================
 * Internal types
 * ============================================================ */

type LocalizedName = string | { en: string; bn: string };

type PopulatedRef = {
  _id: mongoose.Types.ObjectId;
  name: LocalizedName;
  slug: string;
};

type LeanProductImage = {
  url: string;
  publicId: string;
  alt?: string;
};

type LeanProductColor = {
  hex: string;
  name?: { en?: string; bn?: string };
};

type LeanCostHistoryEntry = {
  cost: number;
  changedAt: Date;
  changedBy?: mongoose.Types.ObjectId | null;
  note?: string;
};

type LeanSupplier = {
  name?: string;
  phone?: string;
  email?: string;
  address?: string;
};

type LeanProduct = {
  _id: mongoose.Types.ObjectId;
  name: { en: string; bn: string };
  slug: string;
  sku?: string;
  barcode?: string;
  description?: { en?: string; bn?: string };
  price: number;
  compareAtPrice?: number | null;
  costPrice?: number | null;
  taxRate?: number;
  category: mongoose.Types.ObjectId | PopulatedRef;
  mainCategory?: mongoose.Types.ObjectId | PopulatedRef;
  brand?: mongoose.Types.ObjectId | PopulatedRef | null;
  stock: number;
  lowStockThreshold?: number | null;
  images: LeanProductImage[];
  colors: LeanProductColor[];
  weight?: string;
  dimensions?: string;
  specifications?: Record<string, unknown>;
  boxContents?: Array<{ en: string; bn: string }>;
  supplier?: LeanSupplier | null;
  costHistory?: LeanCostHistoryEntry[];
  totalSold?: number;
  totalRevenue?: number;
  isActive: boolean;
  isFeatured: boolean;
  averageRating: number;
  totalReviews: number;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type ProductSort = Record<string, 1 | -1>;

/* ============================================================
 * Normalization — DB doc → client shape
 * ============================================================ */

function toImageRef(img: LeanProductImage): ImageRef {
  return {
    url: img.url,
    publicId: img.publicId,
    alt: img.alt ?? "",
  };
}

function toColorResponse(color: LeanProductColor): {
  hex: string;
  name?: { en: string; bn: string };
} {
  if (!color.name) {
    return { hex: color.hex };
  }
  return {
    hex: color.hex,
    name: {
      en: color.name.en ?? "",
      bn: color.name.bn ?? "",
    },
  };
}

function normalizeRef(
  ref: mongoose.Types.ObjectId | PopulatedRef | null | undefined,
): string | { _id: string; name: string; slug: string } | null {
  if (!ref) return null;
  if (ref instanceof mongoose.Types.ObjectId) return String(ref);
  const name =
    typeof ref.name === "string" ? ref.name : ref.name.en || ref.name.bn;
  return { _id: String(ref._id), name, slug: ref.slug };
}

/**
 * Trim each field; return undefined when every field is empty.
 * Service layer enforces "name required if any other field set".
 */
function normalizeSupplier(
  input: ProductSupplierInput | null | undefined,
): ProductSupplierInput | undefined {
  if (!input) return undefined;

  const name = (input.name ?? "").trim();
  const phone = (input.phone ?? "").trim();
  const email = (input.email ?? "").trim();
  const address = (input.address ?? "").trim();

  const hasContent = Boolean(name || phone || email || address);
  if (!hasContent) return undefined;

  if (!name) {
    throw new BadRequestError(
      "Supplier name is required when other supplier fields are provided",
    );
  }

  return {
    name,
    phone: phone || undefined,
    email: email || undefined,
    address: address || undefined,
  };
}

export function toProductResponse(doc: LeanProduct): ProductResponse {
  return {
    _id: String(doc._id),
    name: doc.name,
    slug: doc.slug,
    sku: doc.sku,
    barcode: doc.barcode,
    description: {
      en: doc.description?.en ?? "",
      bn: doc.description?.bn ?? "",
    },
    price: doc.price,
    compareAtPrice:
      doc.compareAtPrice === undefined || doc.compareAtPrice === null
        ? null
        : doc.compareAtPrice,
    costPrice:
      doc.costPrice === undefined || doc.costPrice === null
        ? null
        : doc.costPrice,
    taxRate: doc.taxRate ?? 0,
    category: normalizeRef(doc.category) as ProductResponse["category"],
    mainCategory: (normalizeRef(doc.mainCategory) ?? undefined) as
      ProductResponse["mainCategory"] | undefined,
    brand: normalizeRef(doc.brand) as ProductResponse["brand"],
    stock: doc.stock,
    lowStockThreshold:
      doc.lowStockThreshold === undefined || doc.lowStockThreshold === null
        ? undefined
        : doc.lowStockThreshold,
    images: (doc.images ?? []).map(toImageRef),
    colors: (doc.colors ?? []).map(toColorResponse),
    weight: doc.weight,
    dimensions: doc.dimensions,
    specifications: doc.specifications ?? {},
    boxContents: doc.boxContents ?? [],
    supplier:
      doc.supplier && doc.supplier.name
        ? {
            name: doc.supplier.name,
            phone: doc.supplier.phone,
            email: doc.supplier.email,
            address: doc.supplier.address,
          }
        : undefined,
    costHistory:
      doc.costHistory?.map((entry) => ({
        cost: entry.cost,
        changedAt: entry.changedAt.toISOString(),
        changedBy: entry.changedBy
          ? { _id: String(entry.changedBy) }
          : undefined,
        note: entry.note,
      })) ?? [],
    totalSold: doc.totalSold ?? 0,
    totalRevenue: doc.totalRevenue ?? 0,
    isActive: doc.isActive,
    isFeatured: doc.isFeatured,
    averageRating: doc.averageRating,
    totalReviews: doc.totalReviews,
    deletedAt: doc.deletedAt ? doc.deletedAt.toISOString() : null,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

/* ============================================================
 * Helpers
 * ============================================================ */

function assertObjectId(id: string, label = "product"): void {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new BadRequestError(`Invalid ${label} id`);
  }
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildSort(
  sortBy: ProductListQuery["sortBy"],
  order: "asc" | "desc",
): ProductSort {
  const dir: 1 | -1 = order === "asc" ? 1 : -1;
  switch (sortBy) {
    case "name":
      return { "name.en": dir };
    case "price":
      return { price: dir };
    case "costPrice":
      return { costPrice: dir };
    case "stock":
      return { stock: dir };
    case "averageRating":
      return { averageRating: dir };
    case "updatedAt":
      return { updatedAt: dir };
    case "createdAt":
    default:
      return { createdAt: dir };
  }
}

function buildFilter(query: ProductListQuery): Record<string, unknown> {
  const filter: Record<string, unknown> = {};

  if (!query.includeDeleted) {
    filter.deletedAt = null;
  }

  if (query.q) {
    const rx = new RegExp(escapeRegex(query.q), "i");
    filter.$or = [
      { "name.en": rx },
      { "name.bn": rx },
      { sku: rx },
      { barcode: rx },
      { "description.en": rx },
      { "description.bn": rx },
    ];
  }

  if (query.category) {
    filter.category = new mongoose.Types.ObjectId(query.category);
  }
  if (query.mainCategory) {
    filter.mainCategory = new mongoose.Types.ObjectId(query.mainCategory);
  }
  if (query.brand) {
    filter.brand = new mongoose.Types.ObjectId(query.brand);
  }

  if (query.isActive !== undefined) filter.isActive = query.isActive;
  if (query.isFeatured !== undefined) filter.isFeatured = query.isFeatured;

  if (query.stockStatus === "out") {
    filter.stock = 0;
  } else if (query.stockStatus === "low") {
    filter.stock = { $gt: 0, $lte: LOW_STOCK_THRESHOLD };
  } else if (query.stockStatus === "in") {
    filter.stock = { $gt: LOW_STOCK_THRESHOLD };
  }

  if (query.minPrice !== undefined || query.maxPrice !== undefined) {
    const range: Record<string, number> = {};
    if (query.minPrice !== undefined) range.$gte = query.minPrice;
    if (query.maxPrice !== undefined) range.$lte = query.maxPrice;
    filter.price = range;
  }

  return filter;
}

const POPULATE = [
  { path: "category", select: "_id name slug" },
  { path: "mainCategory", select: "_id name slug" },
  { path: "brand", select: "_id name slug" },
];

function mapDuplicateKey(err: unknown): never {
  if (typeof err === "object" && err !== null && "code" in err) {
    const e = err as { code?: number; keyPattern?: Record<string, unknown> };
    if (e.code === 11000) {
      const key = e.keyPattern ? Object.keys(e.keyPattern)[0] : "";
      if (key === "barcode") {
        throw new ConflictError("This barcode is already in use");
      }
      if (key === "sku") {
        throw new ConflictError("This SKU is already in use");
      }
      if (key === "slug") {
        throw new ConflictError("This slug is already in use");
      }
      throw new ConflictError("Duplicate value detected");
    }
  }
  throw err;
}

/* ============================================================
 * List
 * ============================================================ */

export async function listProducts(
  query: ProductListQuery,
): Promise<Paginated<ProductResponse>> {
  const filter = buildFilter(query);
  const sort = buildSort(query.sortBy, query.sortOrder);
  const skip = (query.page - 1) * query.limit;

  const [docs, total] = await Promise.all([
    Product.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(query.limit)
      .populate(POPULATE)
      .lean<LeanProduct[]>(),
    Product.countDocuments(filter),
  ]);

  return {
    items: docs.map(toProductResponse),
    total,
    page: query.page,
    limit: query.limit,
    totalPages: Math.max(1, Math.ceil(total / query.limit)),
  };
}

/* ============================================================
 * Storefront list — public, slim, no auth
 *
 * Same query pattern as listProducts but:
 *   - hard-filters to isActive:true and deletedAt:null
 *   - returns the public StorefrontProduct shape via a
 *     separate mapper (keeps admin output untouched)
 *   - sorts by createdAt desc so newest appears first
 * ============================================================ */

export async function listStorefrontProducts(): Promise<StorefrontProduct[]> {
  const docs = await Product.find({
    isActive: true,
    deletedAt: null,
  })
    .sort({ createdAt: -1 })
    .populate(POPULATE)
    .lean<Parameters<typeof toStorefrontProduct>[0][]>();

  return docs.map(toStorefrontProduct);
}

/**
 * Single product by slug. Returns null on miss so the caller can
 * distinguish "not found" from an error.
 */
export async function getStorefrontProductBySlug(
  slug: string,
): Promise<StorefrontProductDetail | null> {
  const doc = await Product.findOne({
    slug,
    isActive: true,
    deletedAt: null,
  })
    .populate(POPULATE)
    .lean<Parameters<typeof toStorefrontProductDetail>[0] | null>();

  if (!doc) return null;
  return toStorefrontProductDetail(doc);
}

/* ============================================================
 * Related products
 *
 * Two queries: the current product (by slug) and up to 1000 active
 * candidates. Scoring happens in-memory — see lib/storefront/related.ts.
 * ============================================================ */

const RELATED_CANDIDATE_CAP = 1000;

export async function getRelatedProducts(
  slug: string,
  limit: number,
): Promise<StorefrontProduct[]> {
  const [currentDoc, candidateDocs] = await Promise.all([
    Product.findOne({ slug, isActive: true, deletedAt: null })
      .populate(POPULATE)
      .lean<Parameters<typeof toStorefrontProductDetail>[0] | null>(),
    Product.find({
      slug: { $ne: slug },
      isActive: true,
      deletedAt: null,
      stock: { $gt: 0 },
    })
      .limit(RELATED_CANDIDATE_CAP)
      .populate(POPULATE)
      .lean<Parameters<typeof toStorefrontProductDetail>[0][]>(),
  ]);

  if (!currentDoc) return [];

  const current = toStorefrontProductDetail(currentDoc);
  const candidates = candidateDocs.map(toStorefrontProductDetail);

  return rankRelated(current, candidates, limit);
}
/* ============================================================
 * Get by ID
 * ============================================================ */

export async function getProductById(id: string): Promise<ProductResponse> {
  assertObjectId(id);

  const doc = await Product.findById(id)
    .populate(POPULATE)
    .lean<LeanProduct | null>();

  if (!doc) throw new NotFoundError("Product not found");
  return toProductResponse(doc);
}

/* ============================================================
 * Create
 * ============================================================ */

export async function createProduct(
  input: CreateProductInput,
): Promise<ProductResponse> {
  assertObjectId(input.category, "category");
  const category = await Category.findById(input.category).select(
    "_id deletedAt",
  );
  if (!category) throw new BadRequestError("Category does not exist");
  if (category.deletedAt) {
    throw new BadRequestError("Cannot assign an archived category");
  }

  if (input.brand) {
    assertObjectId(input.brand, "brand");
    const brand = await Brand.findById(input.brand).select("_id");
    if (!brand) throw new BadRequestError("Brand does not exist");
  }

  const slug = input.slug
    ? await generateUniqueSlug({
        name: normalizeUserSlug(input.slug),
        model: Product,
      })
    : await generateUniqueSlug({ name: input.name.en, model: Product });

  const sku = await resolveSku(input.sku, Product);

  const barcode = input.barcode?.trim() ? input.barcode.trim() : undefined;
  const supplier = normalizeSupplier(input.supplier);

  try {
    const doc = await Product.create({
      name: input.name,
      slug,
      sku,
      barcode,
      description: input.description ?? { en: "", bn: "" },
      price: input.price,
      compareAtPrice: input.compareAtPrice,
      costPrice: input.costPrice,
      taxRate: input.taxRate ?? 0,
      category: category._id,
      brand: input.brand,
      stock: input.stock ?? 0,
      lowStockThreshold: input.lowStockThreshold,
      images: input.images ?? [],
      colors: input.colors ?? [],
      weight: input.weight,
      dimensions: input.dimensions,
      specifications: input.specifications ?? {},
      boxContents: input.boxContents ?? [],
      supplier,
      isActive: input.isActive ?? true,
      isFeatured: input.isFeatured ?? false,
    });

    const populated = await Product.findById(doc._id)
      .populate(POPULATE)
      .lean<LeanProduct>();
    if (!populated) throw new NotFoundError("Product not found after create");

    revalidateTag(STOREFRONT_PRODUCTS_TAG, "max");
    return toProductResponse(populated);
  } catch (err) {
    mapDuplicateKey(err);
  }
}

/* ============================================================
 * Update
 * ============================================================ */

export async function updateProduct(
  id: string,
  input: UpdateProductInput,
  changedBy?: string,
): Promise<ProductResponse> {
  assertObjectId(id);

  const doc = await Product.findById(id);
  if (!doc) throw new NotFoundError("Product not found");

  if (input.category !== undefined) {
    assertObjectId(input.category, "category");
    const category = await Category.findById(input.category).select(
      "_id deletedAt",
    );
    if (!category) throw new BadRequestError("Category does not exist");
    if (category.deletedAt) {
      throw new BadRequestError("Cannot assign an archived category");
    }
    doc.category = category._id as mongoose.Types.ObjectId;
  }

  if (input.brand !== undefined) {
    if (input.brand === null) {
      doc.brand = undefined;
    } else {
      assertObjectId(input.brand, "brand");
      const brand = await Brand.findById(input.brand).select("_id");
      if (!brand) throw new BadRequestError("Brand does not exist");
      doc.brand = brand._id as mongoose.Types.ObjectId;
    }
  }

  if (input.slug !== undefined) {
    const normalized = normalizeUserSlug(input.slug);
    if (normalized !== doc.slug) {
      doc.slug = await generateUniqueSlug({
        name: normalized,
        model: Product,
        excludeId: id,
      });
    }
  }

  if (input.sku !== undefined && input.sku.trim() !== "") {
    const normalizedSku = input.sku.trim().toUpperCase().replace(/\s+/g, "-");
    if (normalizedSku !== doc.sku) {
      await ensureSkuIsUnique(normalizedSku, Product, id);
      doc.sku = normalizedSku;
    }
  }

  if (input.barcode !== undefined) {
    if (input.barcode === null || input.barcode.trim() === "") {
      doc.barcode = undefined;
    } else {
      doc.barcode = input.barcode.trim();
    }
  }

  if (input.images !== undefined) {
    const previous = (doc.images ?? []).map((i) => ({
      url: i.url,
      publicId: i.publicId,
      alt: i.alt ?? "",
    }));
    const syncResult = await syncProductImages(previous, input.images);
    doc.images = syncResult.kept;
  }

  if (input.name !== undefined) doc.name = input.name;
  if (input.description !== undefined) {
    doc.description = {
      en: input.description.en ?? "",
      bn: input.description.bn ?? "",
    };
  }
  if (input.price !== undefined) doc.price = input.price;
  if (input.compareAtPrice !== undefined) {
    doc.compareAtPrice =
      input.compareAtPrice === null ? undefined : input.compareAtPrice;
  }

  if (input.costPrice !== undefined) {
    const incoming = input.costPrice === null ? undefined : input.costPrice;
    if (incoming !== doc.costPrice) {
      doc.costPrice = incoming;
    }
  }

  if (input.taxRate !== undefined) {
    doc.taxRate = input.taxRate === null ? 0 : input.taxRate;
  }
  if (input.stock !== undefined) doc.stock = input.stock;
  if (input.lowStockThreshold !== undefined) {
    doc.lowStockThreshold =
      input.lowStockThreshold === null ? undefined : input.lowStockThreshold;
  }
  if (input.colors !== undefined) doc.colors = input.colors;
  if (input.weight !== undefined) {
    doc.weight = input.weight === null ? undefined : input.weight;
  }
  if (input.dimensions !== undefined) {
    doc.dimensions = input.dimensions === null ? undefined : input.dimensions;
  }
  if (input.specifications !== undefined) {
    doc.specifications = input.specifications;
  }
  if (input.boxContents !== undefined) {
    doc.boxContents = input.boxContents;
  }
  if (input.supplier !== undefined) {
    const normalized = normalizeSupplier(input.supplier);
    doc.supplier = normalized;
  }
  if (input.isActive !== undefined) doc.isActive = input.isActive;
  if (input.isFeatured !== undefined) doc.isFeatured = input.isFeatured;

  if (changedBy) {
    (doc as unknown as { __changedBy?: mongoose.Types.ObjectId }).__changedBy =
      new mongoose.Types.ObjectId(changedBy);
  }

  try {
    await doc.save();
  } catch (err) {
    mapDuplicateKey(err);
  }

  const populated = await Product.findById(doc._id)
    .populate(POPULATE)
    .lean<LeanProduct>();
  if (!populated) throw new NotFoundError("Product not found after update");

  revalidateTag(STOREFRONT_PRODUCTS_TAG, "max");
  return toProductResponse(populated);
}

/* ============================================================
 * Archive / Restore
 * ============================================================ */

export async function archiveProduct(id: string): Promise<{ _id: string }> {
  assertObjectId(id);

  const doc = await Product.findById(id);
  if (!doc) throw new NotFoundError("Product not found");
  if (doc.deletedAt) throw new ConflictError("Product is already archived");

  doc.deletedAt = new Date();
  doc.isActive = false;
  await doc.save();

  revalidateTag(STOREFRONT_PRODUCTS_TAG, "max");
  return { _id: id };
}

export async function restoreProduct(id: string): Promise<ProductResponse> {
  assertObjectId(id);

  const doc = await Product.findById(id);
  if (!doc) throw new NotFoundError("Product not found");
  if (!doc.deletedAt) throw new ConflictError("Product is not archived");

  const category = await Category.findById(doc.category).select("deletedAt");
  if (category?.deletedAt) {
    throw new BadRequestError(
      "Cannot restore: parent category is archived. Restore the category first.",
    );
  }

  doc.deletedAt = null;
  await doc.save();

  const populated = await Product.findById(doc._id)
    .populate(POPULATE)
    .lean<LeanProduct>();
  if (!populated) throw new NotFoundError("Product not found after restore");

  revalidateTag(STOREFRONT_PRODUCTS_TAG, "max");
  return toProductResponse(populated);
}

/* ============================================================
 * Permanent delete
 * ============================================================ */

export type PermanentDeleteProductResult = {
  _id: string;
  cloudinaryDeleted: number;
};

export async function permanentDeleteProduct(
  id: string,
): Promise<PermanentDeleteProductResult> {
  assertObjectId(id);

  const doc = await Product.findById(id);
  if (!doc) throw new NotFoundError("Product not found");
  if (!doc.deletedAt) {
    throw new ConflictError(
      "Product must be archived before it can be permanently deleted",
    );
  }

  let cloudinaryDeleted = 0;

  try {
    cloudinaryDeleted += await deleteProductFolder(doc.slug);
  } catch {
    // continue
  }

  if (doc.images?.length) {
    const res = await deleteImageRefs(
      doc.images.map((i) => ({
        url: i.url,
        publicId: i.publicId,
        alt: i.alt ?? "",
      })),
    );
    cloudinaryDeleted += res.deleted.length;
  }

  await Product.deleteOne({ _id: id });

  revalidateTag(STOREFRONT_PRODUCTS_TAG, "max");
  return { _id: id, cloudinaryDeleted };
}

/* ============================================================
 * Bulk create
 * ============================================================ */

export async function bulkCreateProducts(
  input: BulkCreateProductInput,
): Promise<BulkResult> {
  const rows: BulkRowResult[] = [];
  let created = 0;
  let failed = 0;

  const needAutoSku = input.products.filter((p) => !p.sku).length;
  const skuBatch =
    needAutoSku > 0 ? await generateSkuBatch(needAutoSku, Product) : [];
  let skuIdx = 0;

  for (let i = 0; i < input.products.length; i += 1) {
    const product = input.products[i];

    try {
      assertObjectId(product.category, "category");
      const category = await Category.findById(product.category).select(
        "_id deletedAt",
      );
      if (!category) throw new BadRequestError("Category does not exist");
      if (category.deletedAt) {
        throw new BadRequestError("Category is archived");
      }

      const slug = product.slug
        ? await generateUniqueSlug({
            name: normalizeUserSlug(product.slug),
            model: Product,
          })
        : await generateUniqueSlug({ name: product.name.en, model: Product });

      let sku: string;
      if (product.sku && product.sku.trim() !== "") {
        sku = product.sku.trim().toUpperCase().replace(/\s+/g, "-");
        await ensureSkuIsUnique(sku, Product);
      } else {
        sku = skuBatch[skuIdx];
        skuIdx += 1;
      }

      const doc = await Product.create({
        ...product,
        slug,
        sku,
        category: category._id,
        description: product.description ?? { en: "", bn: "" },
        specifications: product.specifications ?? {},
      });

      rows.push({ row: i, status: "created", id: String(doc._id) });
      created += 1;
    } catch (err: unknown) {
      rows.push({
        row: i,
        status: "failed",
        message: err instanceof Error ? err.message : "Unknown error",
      });
      failed += 1;
    }
  }

  if (created > 0) {
    revalidateTag(STOREFRONT_PRODUCTS_TAG, "max");
  }

  return {
    total: input.products.length,
    created,
    updated: 0,
    skipped: 0,
    failed,
    rows,
  };
}

/* ============================================================
 * Import
 * ============================================================ */

export async function importProducts(
  payload: ImportPayload,
): Promise<ImportResult> {
  const { products, options } = payload;
  const rows: ImportRowResult[] = [];

  let created = 0;
  let updated = 0;
  let skipped = 0;
  let failed = 0;

  const needAutoSku = products.filter((p) => !p.sku).length;
  const skuBatch =
    needAutoSku > 0 ? await generateSkuBatch(needAutoSku, Product) : [];
  let skuIdx = 0;

  for (let i = 0; i < products.length; i += 1) {
    const product = products[i];

    try {
      assertObjectId(product.category, "category");
      const category = await Category.findById(product.category).select(
        "_id deletedAt",
      );
      if (!category) throw new BadRequestError("Category does not exist");
      if (category.deletedAt) throw new BadRequestError("Category is archived");

      const existing = product.sku
        ? await Product.findOne({ sku: product.sku.trim().toUpperCase() })
        : null;

      if (existing) {
        if (options.onDuplicate === "skip") {
          rows.push({
            row: i,
            status: "skipped",
            id: String(existing._id),
            sku: existing.sku,
            message: `Skipped (duplicate SKU ${existing.sku})`,
          });
          skipped += 1;
          continue;
        }

        if (options.onDuplicate === "fail") {
          throw new ConflictError(`SKU "${product.sku}" already exists`);
        }

        if (options.dryRun) {
          rows.push({
            row: i,
            status: "updated",
            id: String(existing._id),
            sku: existing.sku,
            message: "Dry run — would update",
          });
          updated += 1;
          continue;
        }

        const sync = await syncProductImages(
          (existing.images ?? []).map((img) => ({
            url: img.url,
            publicId: img.publicId,
            alt: img.alt ?? "",
          })),
          product.images ?? [],
        );

        existing.name = product.name;
        existing.description = product.description ?? { en: "", bn: "" };
        existing.price = product.price;
        existing.compareAtPrice = product.compareAtPrice;
        existing.costPrice = product.costPrice;
        existing.category = category._id as mongoose.Types.ObjectId;
        existing.stock = product.stock ?? 0;
        existing.images = sync.kept;
        existing.colors = product.colors ?? [];
        existing.weight = product.weight;
        existing.dimensions = product.dimensions;
        existing.specifications = product.specifications ?? {};
        existing.isActive = product.isActive ?? existing.isActive;
        existing.isFeatured = product.isFeatured ?? existing.isFeatured;

        await existing.save();

        rows.push({
          row: i,
          status: "updated",
          id: String(existing._id),
          sku: existing.sku,
        });
        updated += 1;
        continue;
      }

      if (options.dryRun) {
        rows.push({
          row: i,
          status: "created",
          message: "Dry run — would create",
        });
        created += 1;
        continue;
      }

      const slug = product.slug
        ? await generateUniqueSlug({
            name: normalizeUserSlug(product.slug),
            model: Product,
          })
        : await generateUniqueSlug({ name: product.name.en, model: Product });

      let sku: string;
      if (product.sku && product.sku.trim() !== "") {
        sku = product.sku.trim().toUpperCase().replace(/\s+/g, "-");
        await ensureSkuIsUnique(sku, Product);
      } else {
        sku = skuBatch[skuIdx];
        skuIdx += 1;
      }

      const doc = await Product.create({
        ...product,
        slug,
        sku,
        category: category._id,
        description: product.description ?? { en: "", bn: "" },
        specifications: product.specifications ?? {},
      });

      rows.push({
        row: i,
        status: "created",
        id: String(doc._id),
        sku: doc.sku,
      });
      created += 1;
    } catch (err: unknown) {
      rows.push({
        row: i,
        status: "failed",
        message: err instanceof Error ? err.message : "Unknown error",
      });
      failed += 1;
    }
  }

  // Skip invalidation entirely for dry runs — no DB writes happened.
  if (!options.dryRun && (created > 0 || updated > 0)) {
    revalidateTag(STOREFRONT_PRODUCTS_TAG, "max");
  }

  return {
    total: products.length,
    created,
    updated,
    skipped,
    failed,
    dryRun: options.dryRun,
    rows,
  };
}

/* ============================================================
 * Import with images
 * ============================================================ */

export type ImportWithImagesRow = {
  rowIndex: number;
  csvRow: CsvRow;
  tmpPublicIds: string[];
};

export type ImportWithImagesPayload = {
  rows: ImportWithImagesRow[];
  options: ImportPayload["options"];
};

const ZERO_OID = "000000000000000000000000";

function slugToTitle(slug: string): string {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function resolveCategorySlug(row: CsvRow): string | undefined {
  if (row.category_slug?.trim()) {
    return row.category_slug.trim().toLowerCase();
  }
  if (row.category_path?.trim()) {
    const parts = row.category_path
      .split(">")
      .map((s) => s.trim())
      .filter(Boolean);
    const last = parts[parts.length - 1];
    if (last) return last.toLowerCase().replace(/\s+/g, "-");
  }
  return undefined;
}

export async function importProductsWithImages(
  payload: ImportWithImagesPayload,
): Promise<ImportResult> {
  const { rows, options } = payload;

  const categoryInputs = new Map<
    string,
    { slug: string; nameEn: string; nameBn: string }
  >();
  const brandInputs = new Map<
    string,
    { slug: string; nameEn: string; nameBn: string }
  >();

  for (const row of rows) {
    const catSlug = resolveCategorySlug(row.csvRow);
    if (catSlug && !categoryInputs.has(catSlug)) {
      const fallback = slugToTitle(catSlug);
      categoryInputs.set(catSlug, {
        slug: catSlug,
        nameEn: row.csvRow.category_name_en ?? fallback,
        nameBn:
          row.csvRow.category_name_bn ??
          row.csvRow.category_name_en ??
          fallback,
      });
    }

    const brandSlug = row.csvRow.brand_slug?.trim().toLowerCase();
    if (brandSlug && !brandInputs.has(brandSlug)) {
      const fallback = slugToTitle(brandSlug);
      brandInputs.set(brandSlug, {
        slug: brandSlug,
        nameEn: row.csvRow.brand_name_en ?? fallback,
        nameBn:
          row.csvRow.brand_name_bn ?? row.csvRow.brand_name_en ?? fallback,
      });
    }
  }

  let categoriesBySlug: Record<string, string> = {};
  let brandsBySlug: Record<string, string> = {};

  if (!options.dryRun) {
    const maps = await resolveCategoryAndBrandMaps(
      Array.from(categoryInputs.values()),
      Array.from(brandInputs.values()),
      {
        createMissingCategories: options.createMissingCategories,
        createMissingBrands: options.createMissingBrands,
      },
    );
    categoriesBySlug = maps.categoriesBySlug;
    brandsBySlug = maps.brandsBySlug;
  }

  const needAutoSku = rows.filter(
    (r) => !r.csvRow.sku || r.csvRow.sku.trim() === "",
  ).length;

  const skuBatch =
    needAutoSku > 0 ? await generateSkuBatch(needAutoSku, Product) : [];
  let skuIdx = 0;

  const preparedProducts: CreateProductInput[] = [];
  const skippedRows: Array<{ rowIndex: number; reason: string }> = [];
  const imageWarnings: Array<{ rowIndex: number; message: string }> = [];

  for (const row of rows) {
    const categorySlug = resolveCategorySlug(row.csvRow);
    if (!categorySlug) {
      skippedRows.push({
        rowIndex: row.rowIndex,
        reason: "Missing category",
      });
      continue;
    }

    const categoryId =
      categoriesBySlug[categorySlug] ?? (options.dryRun ? ZERO_OID : undefined);

    if (!categoryId) {
      skippedRows.push({
        rowIndex: row.rowIndex,
        reason: `Unknown category "${categorySlug}"${
          options.createMissingCategories
            ? ""
            : ' — enable "Create missing categories" to auto-create'
        }`,
      });
      continue;
    }

    let brandId: string | undefined;
    if (row.csvRow.brand_slug?.trim()) {
      const brandSlug = row.csvRow.brand_slug.trim().toLowerCase();
      brandId =
        brandsBySlug[brandSlug] ?? (options.dryRun ? ZERO_OID : undefined);
      if (!brandId) {
        imageWarnings.push({
          rowIndex: row.rowIndex,
          message: `Unknown brand "${brandSlug}" — import continues without it`,
        });
      }
    }

    let sku = (row.csvRow.sku ?? "").trim().toUpperCase().replace(/\s+/g, "-");
    if (!sku) {
      sku = skuBatch[skuIdx];
      skuIdx += 1;
    }

    let imageRefs: ImageRef[] = [];
    if (row.tmpPublicIds.length > 0 && !options.dryRun) {
      try {
        imageRefs = await promoteProductImages({
          tmpPublicIds: row.tmpPublicIds,
          sku,
        });
      } catch (err: unknown) {
        imageWarnings.push({
          rowIndex: row.rowIndex,
          message:
            err instanceof Error
              ? `Image promotion failed: ${err.message}`
              : "Image promotion failed",
        });
      }
    }

    const partial = csvRowToProductPartial(row.csvRow);
    const {
      categorySlug: _cs,
      categoryPath: _cp,
      categoryNameEn: _cne,
      categoryNameBn: _cnb,
      brandSlug: _bs,
      brandNameEn: _bne,
      brandNameBn: _bnb,
      imageFiles: _if,
      ...rest
    } = partial;

    preparedProducts.push({
      ...rest,
      category: categoryId,
      brand: brandId,
      sku,
      images: imageRefs,
    });
  }

  const result = await importProducts({
    products: preparedProducts,
    options,
  });

  for (let i = 0; i < result.rows.length; i += 1) {
    const original = rows.find(
      (r) =>
        r.csvRow.sku === preparedProducts[i].sku ||
        r.csvRow.name_en === preparedProducts[i].name.en,
    );
    if (original) {
      result.rows[i].row = original.rowIndex;
    }
  }

  for (const skip of skippedRows) {
    result.rows.push({
      row: skip.rowIndex,
      status: "failed",
      message: skip.reason,
    });
    result.failed += 1;
    result.total += 1;
  }

  for (const warn of imageWarnings) {
    const target = result.rows.find((r) => r.row === warn.rowIndex);
    if (target && target.status !== "failed") {
      target.message = target.message
        ? `${target.message} | ${warn.message}`
        : warn.message;
    }
  }

  return result;
}

/* ============================================================
 * Export
 * ============================================================ */

export type ExportRow = {
  _id: string;
  sku: string;
  barcode: string;
  slug: string;
  name_en: string;
  name_bn: string;
  description_en: string;
  description_bn: string;
  price: number;
  compare_at_price: number | "";
  cost_price: number | "";
  tax_rate: number;
  category_slug: string;
  category_name: string;
  brand_slug: string;
  stock: number;
  low_stock_threshold: number | "";
  weight: string;
  dimensions: string;
  is_active: boolean;
  is_featured: boolean;
  images: string;
  specifications: string;
  supplier_name: string;
  supplier_phone: string;
  created_at: string;
  updated_at: string;
};

export type ExportQuery = {
  category?: string;
  isActive?: boolean;
  includeDeleted?: boolean;
  ids?: string[];
};

export async function fetchProductsForExport(
  query: ExportQuery,
): Promise<ExportRow[]> {
  const filter: Record<string, unknown> = {};
  if (!query.includeDeleted) filter.deletedAt = null;
  if (query.isActive !== undefined) filter.isActive = query.isActive;
  if (query.category) {
    filter.category = new mongoose.Types.ObjectId(query.category);
  }
  if (query.ids?.length) {
    filter._id = {
      $in: query.ids
        .filter((id) => mongoose.Types.ObjectId.isValid(id))
        .map((id) => new mongoose.Types.ObjectId(id)),
    };
  }

  const docs = await Product.find(filter)
    .sort({ createdAt: -1 })
    .populate(POPULATE)
    .lean<LeanProduct[]>();

  return docs.map((doc) => {
    const cat = doc.category as PopulatedRef | mongoose.Types.ObjectId;
    const brand = doc.brand as
      PopulatedRef | mongoose.Types.ObjectId | null | undefined;

    const catSlug = cat instanceof mongoose.Types.ObjectId ? "" : cat.slug;
    const catName =
      cat instanceof mongoose.Types.ObjectId
        ? ""
        : typeof cat.name === "string"
          ? cat.name
          : cat.name.en || cat.name.bn;

    const brandSlug =
      brand instanceof mongoose.Types.ObjectId
        ? ""
        : brand && typeof brand === "object"
          ? brand.slug
          : "";

    return {
      _id: String(doc._id),
      sku: doc.sku ?? "",
      barcode: doc.barcode ?? "",
      slug: doc.slug,
      name_en: doc.name.en,
      name_bn: doc.name.bn,
      description_en: doc.description?.en ?? "",
      description_bn: doc.description?.bn ?? "",
      price: doc.price,
      compare_at_price: doc.compareAtPrice ?? "",
      cost_price: doc.costPrice ?? "",
      tax_rate: doc.taxRate ?? 0,
      category_slug: catSlug,
      category_name: catName,
      brand_slug: brandSlug,
      stock: doc.stock,
      low_stock_threshold: doc.lowStockThreshold ?? "",
      weight: doc.weight ?? "",
      dimensions: doc.dimensions ?? "",
      is_active: doc.isActive,
      is_featured: doc.isFeatured,
      images: (doc.images ?? []).map((i) => i.url).join("|"),
      specifications: Object.entries(doc.specifications ?? {})
        .map(([k, v]) => `${k}:${String(v)}`)
        .join("|"),
      supplier_name: doc.supplier?.name ?? "",
      supplier_phone: doc.supplier?.phone ?? "",
      created_at: doc.createdAt.toISOString(),
      updated_at: doc.updatedAt.toISOString(),
    };
  });
}

/* ============================================================
 * resolveCategoryAndBrandMaps
 * ============================================================ */

export type CategoryResolveInput = {
  slug: string;
  nameEn: string;
  nameBn: string;
};

export type BrandResolveInput = {
  slug: string;
  nameEn: string;
  nameBn: string;
};

export async function resolveCategoryAndBrandMaps(
  categories: CategoryResolveInput[],
  brands: BrandResolveInput[],
  options: {
    createMissingCategories?: boolean;
    createMissingBrands?: boolean;
  } = {},
): Promise<{
  categoriesBySlug: Record<string, string>;
  brandsBySlug: Record<string, string>;
  createdCategories: string[];
  createdBrands: string[];
}> {
  const categoriesBySlug: Record<string, string> = {};
  const brandsBySlug: Record<string, string> = {};
  const createdCategories: string[] = [];
  const createdBrands: string[] = [];

  for (const input of categories) {
    const slug = input.slug.trim().toLowerCase();
    if (!slug) continue;

    let doc = await Category.findOne({ slug }).select("_id");
    if (!doc && options.createMissingCategories) {
      const generated = await generateUniqueSlug({
        name: input.nameEn,
        model: Category,
      });
      const created = await Category.create({
        name: { en: input.nameEn, bn: input.nameBn },
        slug: generated,
      });
      doc = created;
      createdCategories.push(String(created._id));
    }
    if (doc) categoriesBySlug[slug] = String(doc._id);
  }

  for (const input of brands) {
    const slug = input.slug.trim().toLowerCase();
    if (!slug) continue;

    let doc = await Brand.findOne({ slug }).select("_id");
    if (!doc && options.createMissingBrands) {
      const generated = await generateUniqueSlug({
        name: input.nameEn,
        model: Brand,
      });
      const created = await Brand.create({
        name: { en: input.nameEn, bn: input.nameBn },
        slug: generated,
      });
      doc = created;
      createdBrands.push(String(created._id));
    }
    if (doc) brandsBySlug[slug] = String(doc._id);
  }

  return { categoriesBySlug, brandsBySlug, createdCategories, createdBrands };
}

/* ============================================================
 * Storefront Search
 * ============================================================ */

export async function searchStorefrontProducts(
  query: string,
  limit: number = 20,
): Promise<StorefrontProduct[]> {
  if (!query || query.trim() === "") return [];

  // Escape special regex characters to prevent crashes
  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const rx = new RegExp(escapedQuery, "i");

  const docs = await Product.find({
    isActive: true,
    deletedAt: null,
    $or: [
      { "name.en": rx },
      { "name.bn": rx },
      { "brand.name.en": rx }, // Optional: search by brand
    ],
  })
    .limit(limit)
    .populate(POPULATE)
    .lean<Parameters<typeof toStorefrontProduct>[0][]>();

  return docs.map(toStorefrontProduct);
}

/* Re-export types used by routes */
export type { ImportDuplicateMode };
