// src/lib/storefront/faq-mapper.ts

import { toLocalized, type StorefrontLocalizedName } from "./product-mapper";

export type StorefrontFaq = {
  id: string;
  question: StorefrontLocalizedName;
  answer: StorefrontLocalizedName;
};

type LeanFaqDoc = {
  _id: unknown;
  question?: { en?: string; bn?: string };
  answer?: { en?: string; bn?: string };
};

export function toStorefrontFaq(doc: LeanFaqDoc): StorefrontFaq {
  return {
    id: String(doc._id),
    question: toLocalized(doc.question),
    answer: toLocalized(doc.answer),
  };
}
