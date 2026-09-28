// src/lib/cart/types.ts

import type { LocalizedText, StockStatus } from "@/lib/product/types";

export type CartItem = {
  productId: string;
  slug: string;
  variantId: string;
  name: LocalizedText;
  brand: string;
  image: string;
  colorName: LocalizedText;
  colorHex: string;
  price: number;
  originalPrice?: number;
  quantity: number;
  stock: StockStatus;
  stockCount?: number;
};
