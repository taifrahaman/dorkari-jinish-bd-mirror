// src/services/media.service.ts

import mongoose from "mongoose";
import Product from "@/models/Product.model";
import Category from "@/models/Category.model";
import Brand from "@/models/Brand.model";
import { cloudinary, FOLDER_PREFIX } from "@/lib/cloudinary/client";
import {
  listCloudinaryAssets,
  type CloudinaryResource,
} from "@/lib/cloudinary/search";
import { parsePublicId, type EntityType } from "@/lib/cloudinary/paths";
import { BadRequestError, ConflictError, NotFoundError } from "@/lib/errors";
import type { MediaListQuery } from "@/lib/validations/media.schema";

/* ============================================================
 * Types
 * ============================================================ */

export type MediaEntity = EntityType | "unknown";

export type UsageRef =
  | { kind: "product"; id: string; name: string; slug: string }
  | { kind: "category"; id: string; name: string; slug: string }
  | { kind: "brand"; id: string; name: string; slug: string };

export type MediaAsset = {
  publicId: string;
  url: string;
  thumbnailUrl: string;
  width: number;
  height: number;
  bytes: number;
  format: string;
  createdAt: string;
  entity: MediaEntity;
  used: boolean;
  usedBy: UsageRef[];
};

export type ListMediaResult = {
  assets: MediaAsset[];
  nextCursor: string | null;
  totalReturned: number;
  usedCount: number;
  unusedCount: number;
};

export type UsageEntry = {
  used: boolean;
  usedBy: UsageRef[];
};

export type DeleteMediaResult = {
  deleted: string[];
  affectedProducts: Array<{ productId: string; name: string }>;
};

/* ============================================================
 * Helpers
 * ============================================================ */

function thumbnailUrl(publicId: string): string {
  return cloudinary.url(publicId, {
    width: 240,
    height: 240,
    crop: "fill",
    fetch_format: "auto",
    quality: "auto",
    secure: true,
  });
}

function entityOf(publicId: string): MediaEntity {
  const parsed = parsePublicId(publicId);
  switch (parsed.kind) {
    case "product":
      return "products";
    case "category":
      return "categories";
    case "brand":
      return "brands";
    case "tmp":
      return "tmp";
    default:
      return "unknown";
  }
}

/**
 * Category / Brand names come from the DB and may be either a plain
 * string or a localized `{ en, bn }` object depending on the model.
 * This helper normalizes both to a display string.
 */
function displayName(
  name: string | { en?: string; bn?: string } | undefined | null,
): string {
  if (!name) return "Unnamed";
  if (typeof name === "string") return name;
  return name.en ?? name.bn ?? "Unnamed";
}

/* ============================================================
 * Usage map
 * ============================================================
 * Scans Product / Category / Brand collections for every given
 * publicId and returns who's using it.
 *
 * Soft-deleted entities (deletedAt != null) are still counted
 * as "used" — their assets would be re-attached if restored.
 * ============================================================ */

export async function getUsageMap(
  publicIds: string[],
): Promise<Record<string, UsageEntry>> {
  const map: Record<string, UsageEntry> = {};
  for (const id of publicIds) map[id] = { used: false, usedBy: [] };
  if (publicIds.length === 0) return map;

  const wanted = new Set(publicIds);

  /* -------- Products (array of images) -------- */

  const products = await Product.find(
    { "images.publicId": { $in: publicIds } },
    { _id: 1, name: 1, slug: 1, "images.publicId": 1 },
  ).lean();

  for (const p of products) {
    const seen = new Set<string>();
    for (const img of p.images ?? []) {
      const pid = img?.publicId;
      if (!pid || !wanted.has(pid) || seen.has(pid)) continue;
      seen.add(pid);

      map[pid].used = true;
      map[pid].usedBy.push({
        kind: "product",
        id: String(p._id),
        name: p.name?.en ?? p.name?.bn ?? "Unnamed",
        slug: p.slug ?? "",
      });
    }
  }

  /* -------- Categories (single optional image) -------- */

  const categories = await Category.find(
    { "image.publicId": { $in: publicIds } },
    { _id: 1, name: 1, slug: 1, "image.publicId": 1 },
  ).lean();

  for (const c of categories) {
    const pid = c.image?.publicId;
    if (!pid || !wanted.has(pid)) continue;

    const alreadyHasThis = map[pid].usedBy.some(
      (u) => u.kind === "category" && u.id === String(c._id),
    );
    if (alreadyHasThis) continue;

    map[pid].used = true;
    map[pid].usedBy.push({
      kind: "category",
      id: String(c._id),
      name: displayName(
        c.name as string | { en?: string; bn?: string } | undefined,
      ),
      slug: c.slug ?? "",
    });
  }

  /* -------- Brands (single optional logo) -------- */

  const brands = await Brand.find(
    { "logo.publicId": { $in: publicIds } },
    { _id: 1, name: 1, slug: 1, "logo.publicId": 1 },
  ).lean();

  for (const b of brands) {
    const pid = b.logo?.publicId;
    if (!pid || !wanted.has(pid)) continue;

    const alreadyHasThis = map[pid].usedBy.some(
      (u) => u.kind === "brand" && u.id === String(b._id),
    );
    if (alreadyHasThis) continue;

    map[pid].used = true;
    map[pid].usedBy.push({
      kind: "brand",
      id: String(b._id),
      name: displayName(
        b.name as string | { en?: string; bn?: string } | undefined,
      ),
      slug: b.slug ?? "",
    });
  }

  return map;
}

/* ============================================================
 * Category descendants
 * ============================================================ */

async function collectCategoryAndDescendants(
  rootId: string,
): Promise<mongoose.Types.ObjectId[]> {
  if (!mongoose.Types.ObjectId.isValid(rootId)) return [];

  const root = new mongoose.Types.ObjectId(rootId);
  const all: mongoose.Types.ObjectId[] = [root];
  let frontier: mongoose.Types.ObjectId[] = [root];

  // BFS down the tree via `parent`
  while (frontier.length > 0) {
    const children = await Category.find(
      { parent: { $in: frontier } },
      { _id: 1 },
    ).lean();

    const ids = children.map((c) => c._id as mongoose.Types.ObjectId);
    if (ids.length === 0) break;
    all.push(...ids);
    frontier = ids;
  }

  return all;
}

/* ============================================================
 * List
 * ============================================================ */

export async function listMedia(
  query: MediaListQuery,
): Promise<ListMediaResult> {
  const limit = query.limit;

  /* -------- Category filter: build whitelist of publicIds -------- */

  let categoryPublicIds: Set<string> | null = null;

  const categoryApplies =
    query.category && (query.entity === "all" || query.entity === "products");

  if (categoryApplies && query.category) {
    const catIds = await collectCategoryAndDescendants(query.category);
    if (catIds.length === 0) {
      return emptyResult();
    }

    const products = await Product.find(
      { category: { $in: catIds } },
      { "images.publicId": 1 },
    ).lean();

    categoryPublicIds = new Set<string>();
    for (const p of products) {
      for (const img of p.images ?? []) {
        if (img.publicId) categoryPublicIds.add(img.publicId);
      }
    }

    if (categoryPublicIds.size === 0) {
      return emptyResult();
    }
  }

  /* -------- Fetch Cloudinary page -------- */

  const { resources, nextCursor } = await listCloudinaryAssets({
    entity: query.entity,
    cursor: query.cursor,
    limit,
  });

  /* -------- In-memory filters -------- */

  let filtered: CloudinaryResource[] = resources;

  if (query.q) {
    const needle = query.q.toLowerCase();
    filtered = filtered.filter((r) =>
      r.public_id.toLowerCase().includes(needle),
    );
  }

  if (categoryPublicIds) {
    const set = categoryPublicIds;
    filtered = filtered.filter((r) => set.has(r.public_id));
  }

  /* -------- Enrich with usage -------- */

  const publicIds = filtered.map((r) => r.public_id);
  const usageMap = await getUsageMap(publicIds);

  let assets: MediaAsset[] = filtered.map((r) => {
    const u = usageMap[r.public_id] ?? { used: false, usedBy: [] };
    return {
      publicId: r.public_id,
      url: r.secure_url,
      thumbnailUrl: thumbnailUrl(r.public_id),
      width: r.width,
      height: r.height,
      bytes: r.bytes,
      format: r.format,
      createdAt: r.created_at,
      entity: entityOf(r.public_id),
      used: u.used,
      usedBy: u.usedBy,
    };
  });

  /* -------- Used filter -------- */

  if (query.used === "true") assets = assets.filter((a) => a.used);
  else if (query.used === "false") assets = assets.filter((a) => !a.used);

  /* -------- Sort (Cloudinary already gives newest first) -------- */

  if (query.sort === "oldest") {
    assets = [...assets].reverse();
  } else if (query.sort === "name") {
    assets = [...assets].sort((a, b) => a.publicId.localeCompare(b.publicId));
  } else if (query.sort === "size") {
    assets = [...assets].sort((a, b) => b.bytes - a.bytes);
  }

  const usedCount = assets.filter((a) => a.used).length;

  return {
    assets,
    nextCursor,
    totalReturned: assets.length,
    usedCount,
    unusedCount: assets.length - usedCount,
  };
}

function emptyResult(): ListMediaResult {
  return {
    assets: [],
    nextCursor: null,
    totalReturned: 0,
    usedCount: 0,
    unusedCount: 0,
  };
}

/* ============================================================
 * Delete
 * ============================================================ */

export async function deleteMedia(
  publicId: string,
  force: boolean,
): Promise<DeleteMediaResult> {
  /* -------- Guard: refuse to delete outside our app folder -------- */

  if (!publicId.startsWith(`${FOLDER_PREFIX}/`)) {
    throw new BadRequestError(
      "Refusing to delete an asset outside the application folder",
    );
  }

  /* -------- Check usage -------- */

  const usage = await getUsageMap([publicId]);
  const entry = usage[publicId] ?? { used: false, usedBy: [] };

  if (entry.used && !force) {
    const kinds = Array.from(new Set(entry.usedBy.map((u) => u.kind))).join(
      ", ",
    );
    throw new ConflictError(
      `Image is used by ${entry.usedBy.length} record(s) (${kinds}). Pass force=true to cascade.`,
    );
  }

  /* -------- Cascade: strip from everything that references it -------- */

  const affectedProducts: Array<{ productId: string; name: string }> = [];

  // Products — per-document save() so we trigger schema hooks and
  // can report accurate before/after for the UI.
  const products = await Product.find({ "images.publicId": publicId });
  for (const p of products) {
    const before = p.images.length;
    p.images = p.images.filter((img) => img.publicId !== publicId);
    if (p.images.length !== before) {
      await p.save();
      affectedProducts.push({
        productId: String(p._id),
        name: p.name?.en ?? p.name?.bn ?? "Unnamed",
      });
    }
  }

  // Categories — single ref, bulk unset is fine.
  await Category.updateMany(
    { "image.publicId": publicId },
    { $unset: { image: 1 } },
  );

  // Brands — single ref, bulk unset is fine.
  await Brand.updateMany(
    { "logo.publicId": publicId },
    { $unset: { logo: 1 } },
  );

  /* -------- Delete from Cloudinary -------- */

  //   const result = await cloudinary.uploader.destroy(publicId, {
  //     invalidate: true,
  //   });

  //   if (result.result !== "ok" && result.result !== "not found") {
  //     throw new NotFoundError(
  //       `Cloudinary delete failed for "${publicId}": ${result.result}`,
  //     );
  //   }

  //   return {
  //     deleted: [publicId],
  //     affectedProducts,
  //   };
  // }

  /* -------- Delete from Cloudinary -------- */

  console.log("[deleteMedia] destroying:", {
    publicId,
    force,
    cloud: process.env.CLOUDINARY_CLOUD_NAME,
  });

  const result = await cloudinary.uploader.destroy(publicId, {
    invalidate: true,
    resource_type: "image",
  });

  console.log("[deleteMedia] cloudinary raw response:", result);

  // Verify: ask Cloudinary directly whether the asset still exists.
  try {
    const check = await cloudinary.api.resource(publicId, {
      resource_type: "image",
    });
    console.error(
      "[deleteMedia] asset STILL EXISTS after destroy:",
      check.public_id,
    );
  } catch (verifyErr: unknown) {
    const msg =
      verifyErr instanceof Error ? verifyErr.message : String(verifyErr);
    if (msg.toLowerCase().includes("not found")) {
      console.log("[deleteMedia] asset confirmed gone ✅");
    } else {
      console.error("[deleteMedia] verify error:", msg);
    }
  }

  // Strict: only "ok" is a real success.
  if (result.result !== "ok") {
    throw new NotFoundError(
      `Cloudinary delete returned "${result.result}" for "${publicId}"`,
    );
  }

  return {
    deleted: [publicId],
    affectedProducts,
  };
}
