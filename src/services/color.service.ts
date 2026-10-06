// src/services/color.service.ts

import mongoose from "mongoose";
import Color from "@/models/Color.model";
import { NotFoundError, BadRequestError } from "@/lib/errors";
import { generateUniqueSlug, normalizeUserSlug } from "@/lib/admin/slug";
import type {
  ColorListQuery,
  ColorResponse,
  ColorSuggestQuery,
  CreateColorInput,
  UpdateColorInput,
} from "@/lib/validations/color.schema";

/* ============================================================
 * Internal types
 * ============================================================ */

type LeanColor = {
  _id: mongoose.Types.ObjectId;
  name: { en: string; bn: string };
  hex: string;
  slug: string;
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

/* ============================================================
 * toColorResponse
 * ============================================================ */

function toColorResponse(doc: LeanColor): ColorResponse {
  return {
    _id: String(doc._id),
    name: { en: doc.name?.en ?? "", bn: doc.name?.bn ?? "" },
    hex: doc.hex,
    slug: doc.slug,
    order: doc.order,
    isActive: doc.isActive,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

/* ============================================================
 * Helpers
 * ============================================================ */

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function assertObjectId(id: string): void {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new BadRequestError("Invalid color id");
  }
}

/* ============================================================
 * List
 * ============================================================ */

export async function listColors(query: ColorListQuery): Promise<{
  items: ColorResponse[];
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

  if (query.isActive !== undefined) {
    filter.isActive = query.isActive;
  }

  const sortField = query.sortBy === "name" ? "name.en" : query.sortBy;
  const sort: Record<string, 1 | -1> = {
    [sortField]: query.sortOrder === "asc" ? 1 : -1,
  };

  const skip = (query.page - 1) * query.limit;

  const [docs, total] = await Promise.all([
    Color.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(query.limit)
      .lean<LeanColor[]>(),
    Color.countDocuments(filter),
  ]);

  return {
    items: docs.map(toColorResponse),
    total,
    page: query.page,
    limit: query.limit,
    totalPages: Math.max(1, Math.ceil(total / query.limit)),
  };
}

/* ============================================================
 * Suggest (fast, no pagination)
 * ============================================================ */

export async function suggestColors(
  query: ColorSuggestQuery,
): Promise<ColorResponse[]> {
  const rx = new RegExp(escapeRegex(query.q), "i");

  const docs = await Color.find({
    isActive: true,
    $or: [{ "name.en": rx }, { "name.bn": rx }, { slug: rx }],
  })
    .sort({ order: 1, "name.en": 1 })
    .limit(query.limit)
    .lean<LeanColor[]>();

  return docs.map(toColorResponse);
}

/* ============================================================
 * Get by ID
 * ============================================================ */

export async function getColorById(id: string): Promise<ColorResponse> {
  assertObjectId(id);

  const doc = await Color.findById(id).lean<LeanColor | null>();
  if (!doc) throw new NotFoundError("Color not found");
  return toColorResponse(doc);
}

/* ============================================================
 * Create
 * ============================================================ */

export async function createColor(
  input: CreateColorInput,
): Promise<ColorResponse> {
  const slug = input.slug
    ? await generateUniqueSlug({
        name: normalizeUserSlug(input.slug),
        model: Color,
      })
    : await generateUniqueSlug({ name: input.name.en, model: Color });

  const doc = await Color.create({
    name: input.name,
    hex: input.hex,
    slug,
    order: input.order ?? 0,
    isActive: input.isActive ?? true,
  });

  return toColorResponse(doc.toObject() as LeanColor);
}

/* ============================================================
 * Update
 * ============================================================ */

export async function updateColor(
  id: string,
  input: UpdateColorInput,
): Promise<ColorResponse> {
  assertObjectId(id);

  const doc = await Color.findById(id);
  if (!doc) throw new NotFoundError("Color not found");

  if (input.slug !== undefined) {
    const normalized = normalizeUserSlug(input.slug);
    if (normalized !== doc.slug) {
      doc.slug = await generateUniqueSlug({
        name: normalized,
        model: Color,
        excludeId: id,
      });
    }
  }

  if (input.name !== undefined) doc.name = input.name;
  if (input.hex !== undefined) doc.hex = input.hex;
  if (input.order !== undefined) doc.order = input.order;
  if (input.isActive !== undefined) doc.isActive = input.isActive;

  await doc.save();
  return toColorResponse(doc.toObject() as LeanColor);
}

/* ============================================================
 * Delete (hard — safe because products store colors inline)
 * ============================================================ */

export async function deleteColor(id: string): Promise<{ _id: string }> {
  assertObjectId(id);

  const doc = await Color.findById(id).select("_id");
  if (!doc) throw new NotFoundError("Color not found");

  await Color.deleteOne({ _id: id });
  return { _id: id };
}

/* ============================================================
 * Bulk find-or-create (used by the import pipeline)
 *
 * Given a list of { hex, name }, returns the matching color docs,
 * creating any that don't exist. Idempotent per unique slug.
 * ============================================================ */

export type ColorUpsertInput = {
  hex: string;
  name: { en: string; bn: string };
};

export async function findOrCreateColors(
  inputs: ColorUpsertInput[],
): Promise<ColorResponse[]> {
  if (inputs.length === 0) return [];

  const out: ColorResponse[] = [];

  for (const input of inputs) {
    const slug = input.name.en
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    let doc = await Color.findOne({ slug }).lean<LeanColor | null>();
    if (!doc) {
      const created = await Color.create({
        name: input.name,
        hex: input.hex,
        slug,
      });
      doc = created.toObject() as LeanColor;
    }
    out.push(toColorResponse(doc));
  }

  return out;
}
