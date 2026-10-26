// src/lib/auth/redact.ts

import type { ProductResponse } from "@/lib/validations/product.schema";
import type { OrderResponse } from "@/lib/validations/order.schema";

/**
 * Strips financial data from a single product.
 */
export function redactProductForModerator(
  product: ProductResponse,
): ProductResponse {
  // Destructure to remove sensitive fields, keep the rest
  const { costPrice, costHistory, supplier, ...rest } = product;

  // Cast back to ProductResponse so the API route signature matches,
  // even though the deleted fields are technically missing.
  return rest as unknown as ProductResponse;
}

export function redactProductsForModerator(
  products: ProductResponse[],
): ProductResponse[] {
  return products.map(redactProductForModerator);
}

/**
 * Strips financial data from a single order and its items.
 */
export function redactOrderForModerator(order: OrderResponse): OrderResponse {
  const { costTotal, profitTotal, items, ...rest } = order;

  const redactedItems = items.map((item) => {
    const { costPriceAtTime, ...itemRest } = item;
    return itemRest as unknown as typeof item;
  });

  return { ...rest, items: redactedItems } as unknown as OrderResponse;
}

export function redactOrdersForModerator(
  orders: OrderResponse[],
): OrderResponse[] {
  return orders.map(redactOrderForModerator);
}
