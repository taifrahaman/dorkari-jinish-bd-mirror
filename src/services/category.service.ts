// src/services/category.service.ts

import mongoose from "mongoose";
import Category from "@/models/Category.model";
import Product from "@/models/Product.model";
import { NotFoundError, ConflictError, BadRequestError } from "@/lib/errors";
import { generateUniqueSlug, normalizeUserSlug } from "@/lib/admin/slug";
import {
  deleteCategoryFolder,
  deleteImageRefs,
} from "@/services/cloudinary.service";
import type {
  CategoryListQuery,
  CategoryResponse,
  CategorySuggestQuery,
  CategoryTreeNode,
  CreateCategoryInput,
  UpdateCategoryInput,
} from "@/lib/validations/category.schema";

/* ============================================================
 * Internal types
 * ============================================================ */

type LocalizedName = { en: string; bn: string };

type LeanCategory = {
  _id: mongoose.Types.ObjectId;
  name: LocalizedName;
  slug: string;
  description?: string;
  parent?: mongoose.Types.ObjectId | null;
  image?: { url: string; publicId: string; alt?: string };
  specTemplate?: string[];
  order: number;
  isActive: boolean;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type Lookup = Map<string, LeanCategory>;

/* ============================================================
 * toCategoryResponse
 * ============================================================ */

export function toCategoryResponse(
  doc: LeanCategory,
  lookup?: Lookup,
): CategoryResponse {
  const id = String(doc._id);
  const parentId = doc.parent ? String(doc.parent) : null;

  const name: LocalizedName = {
    en: doc.name?.en ?? "",
    bn: doc.name?.bn ?? "",
  };

  let parentName: string | undefined;
  let path: string | undefined;

  if (lookup) {
    const segments: string[] = [name.en];
    let cursor = parentId;
    let safety = 0;
    while (cursor && safety < 50) {
      const parent = lookup.get(cursor);
      if (!parent) break;
      segments.unshift(parent.name.en);
      parentName = parentName ?? parent.name.en;
      cursor = parent.parent ? String(parent.parent) : null;
      safety += 1;
    }
    path = segments.join(" > ");
  }

  return {
    _id: id,
    name,
    slug: doc.slug,
    description: doc.description ?? "",
    parent: parentId,
    parentName,
    path,
    image: doc.image
      ? {
          url: doc.image.url,
          publicId: doc.image.publicId,
          alt: doc.image.alt ?? "",
        }
      : undefined,
    specTemplate: doc.specTemplate ?? [],
    order: doc.order,
    isActive: doc.isActive,
    deletedAt: doc.deletedAt ? doc.deletedAt.toISOString() : null,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

/* ============================================================
 * Lookups
 * ============================================================ */

async function loadLookup(): Promise<Lookup> {
  const all = await Category.find()
    .select("_id name parent")
    .lean<LeanCategory[]>();

  const map: Lookup = new Map();
  for (const c of all) {
    map.set(String(c._id), c);
  }
  return map;
}

async function loadProductCounts(): Promise<Map<string, number>> {
  const rows = await Product.aggregate<{
    _id: mongoose.Types.ObjectId;
    count: number;
  }>([
    { $match: { deletedAt: null } },
    { $group: { _id: "$category", count: { $sum: 1 } } },
  ]);

  const map = new Map<string, number>();
  for (const r of rows) {
    map.set(String(r._id), r.count);
  }
  return map;
}

/* ============================================================
 * List
 * ============================================================ */

export async function listCategories(query: CategoryListQuery): Promise<{
  items: CategoryResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> {
  const filter: Record<string, unknown> = {};

  if (!query.includeDeleted) {
    filter.deletedAt = null;
  }

  if (query.q) {
    const rx = new RegExp(escapeRegex(query.q), "i");
    filter.$or = [
      { "name.en": rx },
      { "name.bn": rx },
      { slug: rx },
      { description: rx },
    ];
  }

  if (query.parent === "root") {
    filter.parent = null;
  } else if (query.parent) {
    filter.parent = new mongoose.Types.ObjectId(query.parent);
  }

  if (query.isActive !== undefined) {
    filter.isActive = query.isActive;
  }

  const sortField = query.sortBy === "name" ? "name.en" : query.sortBy;
  const sort: Record<string, 1 | -1> = {
    [sortField]: query.sortOrder === "asc" ? 1 : -1,
  };

  const skip = (query.page - 1) * query.limit;

  const [docs, total, lookup, productCounts] = await Promise.all([
    Category.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(query.limit)
      .lean<LeanCategory[]>(),
    Category.countDocuments(filter),
    loadLookup(),
    loadProductCounts(),
  ]);

  const items = docs.map((d) => {
    const res = toCategoryResponse(d, lookup);
    res.productCount = productCounts.get(res._id) ?? 0;
    return res;
  });

  return {
    items,
    total,
    page: query.page,
    limit: query.limit,
    totalPages: Math.max(1, Math.ceil(total / query.limit)),
  };
}

/* ============================================================
 * Tree
 * ============================================================ */

export async function getCategoryTree(options?: {
  includeDeleted?: boolean;
  includeInactive?: boolean;
}): Promise<CategoryTreeNode[]> {
  const filter: Record<string, unknown> = {};
  if (!options?.includeDeleted) filter.deletedAt = null;
  if (!options?.includeInactive) filter.isActive = true;

  const [docs, productCounts] = await Promise.all([
    Category.find(filter)
      .sort({ order: 1, "name.en": 1 })
      .lean<LeanCategory[]>(),
    loadProductCounts(),
  ]);

  const lookup: Lookup = new Map();
  for (const d of docs) lookup.set(String(d._id), d);

  const nodes = new Map<string, CategoryTreeNode>();
  for (const d of docs) {
    const res = toCategoryResponse(d, lookup);
    res.productCount = productCounts.get(res._id) ?? 0;
    nodes.set(res._id, { ...res, children: [] });
  }

  const roots: CategoryTreeNode[] = [];
  for (const node of nodes.values()) {
    const parentId = node.parent as string | null;
    if (parentId && nodes.has(parentId)) {
      nodes.get(parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}

/* ============================================================
 * Suggest
 * ============================================================ */

export async function suggestCategories(
  query: CategorySuggestQuery,
): Promise<CategoryResponse[]> {
  const rx = new RegExp(escapeRegex(query.q), "i");

  const docs = await Category.find({
    deletedAt: null,
    isActive: true,
    $or: [{ "name.en": rx }, { "name.bn": rx }, { slug: rx }],
  })
    .sort({ order: 1, "name.en": 1 })
    .limit(query.limit)
    .lean<LeanCategory[]>();

  const lookup = await loadLookup();
  return docs.map((d) => toCategoryResponse(d, lookup));
}

/* ============================================================
 * Get by ID
 * ============================================================ */

export async function getCategoryById(id: string): Promise<CategoryResponse> {
  assertObjectId(id);

  const doc = await Category.findById(id).lean<LeanCategory | null>();
  if (!doc) throw new NotFoundError("Category not found");

  const [lookup, productCounts] = await Promise.all([
    loadLookup(),
    loadProductCounts(),
  ]);

  const res = toCategoryResponse(doc, lookup);
  res.productCount = productCounts.get(res._id) ?? 0;
  return res;
}

/* ============================================================
 * Create
 * ============================================================ */

export async function createCategory(
  input: CreateCategoryInput,
): Promise<CategoryResponse> {
  let parentId: mongoose.Types.ObjectId | null = null;
  if (input.parent) {
    assertObjectId(input.parent);
    const parent = await Category.findById(input.parent).select(
      "_id deletedAt",
    );
    if (!parent) throw new BadRequestError("Parent category does not exist");
    if (parent.deletedAt) {
      throw new BadRequestError("Cannot nest under an archived category");
    }
    parentId = parent._id as mongoose.Types.ObjectId;
  }

  const slug = input.slug
    ? await generateUniqueSlug({
        name: normalizeUserSlug(input.slug),
        model: Category,
      })
    : await generateUniqueSlug({ name: input.name.en, model: Category });

  const doc = await Category.create({
    name: input.name,
    slug,
    description: input.description ?? "",
    parent: parentId,
    image: input.image,
    specTemplate: dedupeSpecKeys(input.specTemplate ?? []),
    order: input.order ?? 0,
    isActive: input.isActive ?? true,
  });

  const lookup = await loadLookup();
  return toCategoryResponse(doc.toObject() as LeanCategory, lookup);
}

/* ============================================================
 * Update
 * ============================================================ */

export async function updateCategory(
  id: string,
  input: UpdateCategoryInput,
): Promise<CategoryResponse> {
  assertObjectId(id);

  const doc = await Category.findById(id);
  if (!doc) throw new NotFoundError("Category not found");

  if (input.parent !== undefined) {
    if (input.parent === null) {
      doc.parent = null;
    } else {
      assertObjectId(input.parent);
      if (String(input.parent) === id) {
        throw new BadRequestError("A category cannot be its own parent");
      }
      const parent = await Category.findById(input.parent).select(
        "_id deletedAt",
      );
      if (!parent) throw new BadRequestError("Parent category does not exist");
      if (parent.deletedAt) {
        throw new BadRequestError("Cannot nest under an archived category");
      }
      await assertNoCycle(id, input.parent);
      doc.parent = parent._id as mongoose.Types.ObjectId;
    }
  }

  if (input.slug !== undefined) {
    const normalized = normalizeUserSlug(input.slug);
    if (normalized !== doc.slug) {
      doc.slug = await generateUniqueSlug({
        name: normalized,
        model: Category,
        excludeId: id,
      });
    }
  }

  if (input.name !== undefined) doc.name = input.name;
  if (input.description !== undefined) doc.description = input.description;
  if (input.order !== undefined) doc.order = input.order;
  if (input.isActive !== undefined) doc.isActive = input.isActive;
  if (input.image !== undefined) doc.image = input.image;
  if (input.specTemplate !== undefined) {
    doc.specTemplate = dedupeSpecKeys(input.specTemplate);
  }

  await doc.save();

  const [lookup, productCounts] = await Promise.all([
    loadLookup(),
    loadProductCounts(),
  ]);

  const res = toCategoryResponse(doc.toObject() as LeanCategory, lookup);
  res.productCount = productCounts.get(res._id) ?? 0;
  return res;
}

/* ============================================================
 * Archive
 * ============================================================ */

export async function archiveCategory(
  id: string,
): Promise<{ _id: string; archivedIds: string[] }> {
  assertObjectId(id);

  const doc = await Category.findById(id);
  if (!doc) throw new NotFoundError("Category not found");
  if (doc.deletedAt) throw new ConflictError("Category is already archived");

  const descendantIds = await collectDescendantIds(id);
  const now = new Date();
  const allIds = [id, ...descendantIds];

  await Category.updateMany(
    { _id: { $in: allIds } },
    { $set: { deletedAt: now } },
  );

  return { _id: id, archivedIds: allIds };
}

/* ============================================================
 * Restore
 * ============================================================ */

export async function restoreCategory(id: string): Promise<CategoryResponse> {
  assertObjectId(id);

  const doc = await Category.findById(id);
  if (!doc) throw new NotFoundError("Category not found");
  if (!doc.deletedAt) throw new ConflictError("Category is not archived");

  if (doc.parent) {
    const parent = await Category.findById(doc.parent).select("deletedAt");
    if (parent?.deletedAt) {
      throw new BadRequestError(
        "Cannot restore: parent category is archived. Restore the parent first.",
      );
    }
  }

  const descendantIds = await collectDescendantIds(id);
  const allIds = [id, ...descendantIds];

  await Category.updateMany(
    { _id: { $in: allIds } },
    { $set: { deletedAt: null } },
  );

  const [lookup, productCounts] = await Promise.all([
    loadLookup(),
    loadProductCounts(),
  ]);

  const refreshed = await Category.findById(id).lean<LeanCategory | null>();
  if (!refreshed) throw new NotFoundError("Category not found after restore");

  const res = toCategoryResponse(refreshed, lookup);
  res.productCount = productCounts.get(res._id) ?? 0;
  return res;
}

/* ============================================================
 * Permanent delete
 * ============================================================ */

export type PermanentDeleteOptions = {
  cascade?: boolean;
};

export type PermanentDeleteResult = {
  _id: string;
  deletedIds: string[];
  cloudinaryDeleted: number;
};

export async function permanentDeleteCategory(
  id: string,
  options: PermanentDeleteOptions = {},
): Promise<PermanentDeleteResult> {
  assertObjectId(id);

  const doc = await Category.findById(id).select("_id slug deletedAt name");
  if (!doc) throw new NotFoundError("Category not found");
  if (!doc.deletedAt) {
    throw new ConflictError(
      "Category must be archived before it can be permanently deleted",
    );
  }

  const descendantIds = await collectDescendantIds(id);
  if (descendantIds.length > 0 && !options.cascade) {
    throw new ConflictError(
      `Category has ${descendantIds.length} descendant(s). ` +
        `Pass cascade=true to delete the whole subtree.`,
    );
  }

  const allIds = [id, ...descendantIds];

  const productCount = await Product.countDocuments({
    category: { $in: allIds.map((s) => new mongoose.Types.ObjectId(s)) },
  });
  if (productCount > 0) {
    throw new ConflictError(
      `Cannot delete: ${productCount} product(s) still reference ${
        allIds.length > 1 ? "these categories" : "this category"
      }. Reassign or permanently delete the products first.`,
    );
  }

  const docs = await Category.find({ _id: { $in: allIds } }).lean<
    Array<{
      _id: mongoose.Types.ObjectId;
      slug: string;
      image?: { publicId: string; url: string; alt?: string };
    }>
  >();

  let cloudinaryDeleted = 0;
  for (const d of docs) {
    try {
      cloudinaryDeleted += await deleteCategoryFolder(d.slug);
    } catch {
      // best-effort
    }
    if (d.image?.publicId) {
      const res = await deleteImageRefs([
        {
          url: d.image.url,
          publicId: d.image.publicId,
          alt: d.image.alt ?? "",
        },
      ]);
      cloudinaryDeleted += res.deleted.length;
    }
  }

  await Category.deleteMany({ _id: { $in: allIds } });

  return {
    _id: id,
    deletedIds: allIds,
    cloudinaryDeleted,
  };
}

/* ============================================================
 * Internal helpers
 * ============================================================ */

async function collectDescendantIds(rootId: string): Promise<string[]> {
  const all = await Category.find({}, { _id: 1, parent: 1 }).lean<
    Array<{
      _id: mongoose.Types.ObjectId;
      parent?: mongoose.Types.ObjectId | null;
    }>
  >();

  const childrenByParent = new Map<string, string[]>();
  for (const c of all) {
    const parent = c.parent ? String(c.parent) : "__root__";
    if (!childrenByParent.has(parent)) childrenByParent.set(parent, []);
    childrenByParent.get(parent)!.push(String(c._id));
  }

  const out: string[] = [];
  const stack = [...(childrenByParent.get(rootId) ?? [])];
  const seen = new Set<string>();

  while (stack.length) {
    const next = stack.pop()!;
    if (seen.has(next)) continue;
    seen.add(next);
    out.push(next);
    const kids = childrenByParent.get(next);
    if (kids) stack.push(...kids);
  }

  return out;
}

async function assertNoCycle(id: string, newParentId: string): Promise<void> {
  let cursor: string | null = newParentId;
  const guard = new Set<string>();
  let safety = 0;

  while (cursor && safety < 100) {
    if (cursor === id) {
      throw new BadRequestError(
        "Cannot move a category under one of its own descendants",
      );
    }
    if (guard.has(cursor)) break;
    guard.add(cursor);

    const parentDoc: { parent?: mongoose.Types.ObjectId | null } | null =
      await Category.findById(cursor)
        .select("parent")
        .lean<{ parent?: mongoose.Types.ObjectId | null } | null>();

    cursor = parentDoc?.parent ? String(parentDoc.parent) : null;
    safety += 1;
  }
}

function assertObjectId(id: string): void {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new BadRequestError("Invalid category id");
  }
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function dedupeSpecKeys(keys: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of keys) {
    const key = raw.trim();
    if (!key) continue;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(key);
  }
  return out;
}
