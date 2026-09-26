// src/lib/product/types.ts

import type { Locale } from "@/lib/shop/types";

export type LocalizedText = Record<Locale, string>;

export type StockStatus = "in-stock" | "low-stock" | "out-of-stock";

export type ProductImage = {
  id: string;
  src: string;
  alt: LocalizedText;
};

/** A color is a real variant: it owns its own photo set, not just a swatch. */
export type ProductVariant = {
  id: string;
  hex: string;
  name: LocalizedText;
  images: ProductImage[];
};

export type FaqItem = {
  id: string;
  question: LocalizedText;
  answer: LocalizedText;
};

export type Review = {
  id: string;
  author: string;
  rating: number; // 1-5
  date: string; // ISO
  verified: boolean;
  title?: LocalizedText;
  body: LocalizedText;
  helpfulCount: number;
};

export type ProductDetail = {
  id: string;
  slug: string;
  name: LocalizedText;
  brand: string;
  categoryValue: string;
  categoryLabel: LocalizedText;
  model: string;
  price: number;
  originalPrice?: number;
  stock: StockStatus;
  lowStockThreshold?: number;
  stockCount?: number;
  description: LocalizedText;
  variants: ProductVariant[];
  weight: LocalizedText; // e.g. "2.6 kg"
  dimensions: LocalizedText; // e.g. "27 × 27 × 24 cm"
  warrantyMonths: number;
  boxContents: LocalizedText[];
  deliveryEstimate: LocalizedText;
  returnPolicy: LocalizedText;
  faqs: FaqItem[];
  rating: number;
  reviewCount: number;
  reviews: Review[];
};
