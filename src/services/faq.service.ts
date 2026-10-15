// src/services/faq.service.ts

import mongoose from "mongoose";

import FAQ from "@/models/FAQ.model";
import {
  toStorefrontFaq,
  type StorefrontFaq,
} from "@/lib/storefront/faq-mapper";

/* ============================================================
 * Public read — FAQs shown on a product detail page.
 *
 * Returns global FAQs plus any FAQs targeted at the given product,
 * filtered to active and non-deleted, ordered by `order` ascending.
 * ============================================================ */

export async function listProductFaqs(
  productId: string,
): Promise<StorefrontFaq[]> {
  if (!mongoose.Types.ObjectId.isValid(productId)) return [];

  const productOid = new mongoose.Types.ObjectId(productId);

  const docs = await FAQ.find({
    isActive: true,
    deletedAt: null,
    $or: [
      { targetType: "product", targetId: productOid },
      { targetType: "global" },
    ],
  })
    .sort({ order: 1, _id: 1 })
    .lean();

  return docs.map(toStorefrontFaq);
}
