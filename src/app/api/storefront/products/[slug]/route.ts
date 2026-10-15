// src/app/api/storefront/products/[slug]/route.ts

import { NextResponse, type NextRequest } from "next/server";

import { withDb } from "@/lib/api/api-handler";
import { handleApiError, NotFoundError } from "@/lib/errors";
import {
  getCachedRelatedProducts,
  getCachedStorefrontFaqs,
  getCachedStorefrontProductBySlug,
  getCachedStorefrontReviews,
  getCachedStorefrontSettings,
} from "@/lib/storefront/products-cache";

const RELATED_LIMIT = 8;

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

      const [product, settings] = await Promise.all([
        getCachedStorefrontProductBySlug(slug),
        getCachedStorefrontSettings(),
      ]);

      if (!product) {
        throw new NotFoundError("Product not found");
      }

      const [faqs, reviews, related] = await Promise.all([
        getCachedStorefrontFaqs(product.id),
        getCachedStorefrontReviews(product.id),
        getCachedRelatedProducts(slug, RELATED_LIMIT),
      ]);

      return NextResponse.json({
        success: true,
        data: {
          product,
          faqs,
          reviews,
          settings,
          related,
        },
      });
    } catch (err) {
      return handleApiError(err);
    }
  },
);
