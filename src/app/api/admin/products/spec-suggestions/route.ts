// src/app/api/admin/products/spec-suggestions/route.ts

import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { z } from "zod";
import { withDb } from "@/lib/api/api-handler";
import { handleApiError } from "@/lib/errors";
import { verifyAuth, requireRole } from "@/middlewares/auth";
import Product from "@/models/Product.model";

/* ============================================================
 * Query
 * ============================================================ */

const querySchema = z.object({
  q: z.string().trim().max(80).optional(),
  category: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

/* ============================================================
 * Response
 * ============================================================ */

export type SpecSuggestion = {
  key: string;
  usageCount: number;
  exampleValue?: string;
};

/* ============================================================
 * GET /api/admin/products/spec-suggestions
 *
 * Aggregates all `specifications` keys across products and
 * returns them sorted by usage count. Used by the spec key
 * combobox to suggest previously-used keys.
 * ============================================================ */

export const GET = withDb(async (request: NextRequest) => {
  try {
    const payload = await verifyAuth(request);
    requireRole(payload, ["admin", "moderator"]);

    const raw = Object.fromEntries(request.nextUrl.searchParams);
    const query = querySchema.parse(raw);

    /* --------------------------------------------------------
     * Match stage
     * -------------------------------------------------------- */

    const match: Record<string, unknown> = { deletedAt: null };
    if (query.category && mongoose.Types.ObjectId.isValid(query.category)) {
      match.mainCategory = new mongoose.Types.ObjectId(query.category);
    }

    /* --------------------------------------------------------
     * Optional regex on the key name
     * -------------------------------------------------------- */

    const groupMatch: Record<string, unknown> = {};
    if (query.q && query.q.length > 0) {
      const escaped = query.q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      groupMatch._id = { $regex: escaped, $options: "i" };
    }

    /* --------------------------------------------------------
     * Aggregation pipeline
     * -------------------------------------------------------- */

    const pipeline: mongoose.PipelineStage[] = [
      { $match: match },
      {
        $project: {
          specs: {
            $objectToArray: {
              $ifNull: ["$specifications", {}],
            },
          },
        },
      },
      { $unwind: "$specs" },
      { $match: { "specs.k": { $type: "string", $ne: "" } } },
      {
        $group: {
          _id: "$specs.k",
          usageCount: { $sum: 1 },
          exampleValue: { $first: "$specs.v" },
        },
      },
    ];

    if (Object.keys(groupMatch).length > 0) {
      pipeline.push({ $match: groupMatch });
    }

    pipeline.push({ $sort: { usageCount: -1, _id: 1 } });
    pipeline.push({ $limit: query.limit });

    const rows = await Product.aggregate<{
      _id: string;
      usageCount: number;
      exampleValue?: string;
    }>(pipeline);

    const data: SpecSuggestion[] = rows.map((r) => ({
      key: r._id,
      usageCount: r.usageCount,
      exampleValue:
        r.exampleValue !== undefined && r.exampleValue !== null
          ? String(r.exampleValue)
          : undefined,
    }));

    return NextResponse.json({ success: true, data });
  } catch (err) {
    return handleApiError(err);
  }
});
