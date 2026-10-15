// src/services/review.service.ts

import mongoose from "mongoose";

import Review from "@/models/Review.model";
import {
  toStorefrontReview,
  type StorefrontReview,
} from "@/lib/storefront/review-mapper";

/* ============================================================
 * Public read — approved reviews for one product.
 *
 * Only `status: "approved"` reviews are exposed. User is
 * populated so we can render the author's display name.
 * ============================================================ */

export async function listProductReviews(
  productId: string,
): Promise<StorefrontReview[]> {
  if (!mongoose.Types.ObjectId.isValid(productId)) return [];

  const productOid = new mongoose.Types.ObjectId(productId);

  const docs = await Review.find({
    product: productOid,
    status: "approved",
  })
    .sort({ createdAt: -1 })
    .populate({ path: "user", select: "name" })
    .lean<Parameters<typeof toStorefrontReview>[0][]>();

  return docs.map(toStorefrontReview);
}
