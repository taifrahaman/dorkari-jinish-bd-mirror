// src/app/api/storefront/products/[slug]/route.ts

import { NextResponse, type NextRequest } from "next/server";

import { withDb } from "@/lib/api/api-handler";
import { handleApiError, NotFoundError } from "@/lib/errors";
import {
  getCachedStorefrontFaqs,
  getCachedStorefrontProductBySlug,
  getCachedStorefrontReviews,
  getCachedStorefrontSettings,
} from "@/lib/storefront/products-cache";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export const GET = withDb(
  async (_request: NextRequest, context: RouteContext) => {
    try {
      const { slug } = await context.params;

      if (!slug || slug.trim() === "") {
        throw new NotFoundError("Product not found");
      }

      // Fetch the product first — if it doesn't exist, no reason to
      // fetch its FAQs or reviews. Settings are global and independent.
      const [product, settings] = await Promise.all([
        getCachedStorefrontProductBySlug(slug),
        getCachedStorefrontSettings(),
      ]);

      if (!product) {
        throw new NotFoundError("Product not found");
      }

      // FAQs and reviews are keyed by the product's ObjectId, not slug.
      const [faqs, reviews] = await Promise.all([
        getCachedStorefrontFaqs(product.id),
        getCachedStorefrontReviews(product.id),
      ]);

      return NextResponse.json({
        success: true,
        data: {
          product,
          faqs,
          reviews,
          settings,
        },
      });
    } catch (err) {
      return handleApiError(err);
    }
  },
);
