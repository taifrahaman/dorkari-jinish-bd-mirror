// src/lib/storefront/review-mapper.ts

import { toLocalized, type StorefrontLocalizedName } from "./product-mapper";

export type StorefrontReview = {
  id: string;
  author: string;
  rating: number;
  /** ISO date string. */
  date: string;
  verified: boolean;
  body: StorefrontLocalizedName;
  helpfulCount: number;
};

type PopulatedUser = {
  name?: string;
} | null;

type LeanReviewDoc = {
  _id: unknown;
  user?: PopulatedUser;
  rating: number;
  comment?: { en?: string; bn?: string };
  isVerifiedPurchase?: boolean;
  helpfulCount?: number;
  createdAt: Date;
};

function resolveAuthor(user: PopulatedUser): string {
  const name = user?.name?.trim();
  return name && name.length > 0 ? name : "Anonymous";
}

export function toStorefrontReview(doc: LeanReviewDoc): StorefrontReview {
  return {
    id: String(doc._id),
    author: resolveAuthor(doc.user ?? null),
    rating: doc.rating,
    date: doc.createdAt.toISOString(),
    verified: doc.isVerifiedPurchase ?? false,
    body: toLocalized(doc.comment),
    helpfulCount: doc.helpfulCount ?? 0,
  };
}
