// src/lib/cart/cart-key.ts

const SEPARATOR = "__";

export function makeCartKey(productId: string, variantId: string) {
  return `${productId}${SEPARATOR}${variantId}`;
}

export function parseCartKey(key: string): {
  productId: string;
  variantId: string;
} {
  const idx = key.lastIndexOf(SEPARATOR);
  if (idx === -1) return { productId: key, variantId: "" };
  return {
    productId: key.slice(0, idx),
    variantId: key.slice(idx + SEPARATOR.length),
  };
}
